/**
 * Tests for the PayPal capture verdict.
 *
 * `capture()` is where every assertion that stops a $340 booking settling for
 * $1 lives, so it is what is tested here — not `start()`, which is a request
 * builder whose only interesting output is PayPal's own link.
 *
 * `fetch` is stubbed rather than hitting sandbox. These tests are about how we
 * read a capture response, and a live sandbox makes the failure cases — a
 * mismatched custom_id, a short capture, a PENDING status — either impossible
 * to provoke or slow enough that nobody runs them.
 *
 * Run: npm test
 */
import { test, describe, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";

import { capture, formatAmount } from "./paypal.js";

const ORDER = "PPP-AB2345-9f3c";
const realFetch = globalThis.fetch;

/**
 * Stub the two calls `capture()` makes: the OAuth token, then the capture.
 * Only the second is interesting, so the token is answered generically.
 */
function stubFetch(captureStatus, captureBody) {
  globalThis.fetch = async (url) => {
    if (String(url).includes("/v1/oauth2/token")) {
      return new Response(JSON.stringify({ access_token: "test-token" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify(captureBody), {
      status: captureStatus,
      headers: { "Content-Type": "application/json" },
    });
  };
}

/** A capture response shaped the way PayPal actually returns one. */
function captureBody({
  status = "COMPLETED",
  value = "340.00",
  currency = "USD",
  customId = ORDER,
} = {}) {
  return {
    id: "PAYPAL-ORDER-1",
    status,
    purchase_units: [
      {
        reference_id: customId,
        custom_id: customId,
        payments: {
          captures: [
            {
              id: "CAPTURE-1",
              status,
              custom_id: customId,
              amount: { currency_code: currency, value },
            },
          ],
        },
      },
    ],
    // Present in a real response, and expected to be scrubbed before storage.
    payer: { name: { given_name: "Test" }, email_address: "guest@example.com" },
    links: [{ rel: "self", href: "https://example.invalid" }],
  };
}

const args = {
  paypalOrderId: "PAYPAL-ORDER-1",
  expectedCustomId: ORDER,
  expectedCents: 34000,
  currency: "USD",
};

describe("paypal.capture", () => {
  beforeEach(() => {
    process.env.PAYPAL_CLIENT_ID = "test-id";
    process.env.PAYPAL_CLIENT_SECRET = "test-secret";
  });

  afterEach(() => {
    globalThis.fetch = realFetch;
  });

  test("a completed capture for the right amount is paid", async () => {
    stubFetch(201, captureBody());
    const v = await capture(args);
    assert.equal(v.outcome, "paid");
    assert.equal(v.verified, true);
    assert.equal(v.transactionId, "CAPTURE-1");
  });

  /*
   * THE CHECK IMPLEMENTATIONS SKIP.
   *
   * There is no forged hash here and nothing malformed — PayPal is reporting a
   * genuine capture. It is simply for less than the booking costs. Without the
   * amount comparison this settles a $340 transfer for a dollar.
   */
  test("a genuine capture for the wrong amount is invalid, not paid", async () => {
    stubFetch(201, captureBody({ value: "1.00" }));
    const v = await capture(args);
    assert.equal(v.outcome, "invalid");
    assert.equal(v.verified, false);
  });

  test("the right amount in the wrong currency is invalid", async () => {
    stubFetch(201, captureBody({ currency: "CAD" }));
    const v = await capture(args);
    assert.equal(v.outcome, "invalid");
  });

  /*
   * The binding check. A capture that is real, completed and for the right
   * money but belongs to a DIFFERENT order of ours must not settle this one.
   */
  test("a capture whose custom_id is another order is invalid", async () => {
    stubFetch(201, captureBody({ customId: "PPP-ZZ9999-0000" }));
    const v = await capture(args);
    assert.equal(v.outcome, "invalid");
  });

  /*
   * PayPal holds the money without releasing it. Neither neighbour is true:
   * "paid" sends a driver out against money that may never arrive, "failed"
   * invites a second charge for the same booking.
   */
  test("a pending capture is pending, not paid and not failed", async () => {
    stubFetch(201, captureBody({ status: "PENDING" }));
    const v = await capture(args);
    assert.equal(v.outcome, "pending");
    assert.equal(v.verified, true);
    assert.match(v.providerStatus, /^PENDING/);
  });

  test("already captured is treated as paid — this is the refresh path", async () => {
    stubFetch(422, {
      name: "UNPROCESSABLE_ENTITY",
      details: [{ issue: "ORDER_ALREADY_CAPTURED" }],
    });
    const v = await capture(args);
    assert.equal(v.outcome, "paid");
  });

  test("a declined instrument is an ordinary failure", async () => {
    stubFetch(422, {
      name: "UNPROCESSABLE_ENTITY",
      details: [{ issue: "INSTRUMENT_DECLINED" }],
    });
    const v = await capture(args);
    assert.equal(v.outcome, "failed");
    assert.equal(v.verified, false);
  });

  test("a response carrying no capture is a failure, never a pass", async () => {
    stubFetch(201, { id: "PAYPAL-ORDER-1", status: "COMPLETED", purchase_units: [] });
    const v = await capture(args);
    assert.equal(v.outcome, "failed");
  });

  test("the payer's details are not kept on the stored payload", async () => {
    stubFetch(201, captureBody());
    const v = await capture(args);
    assert.equal(v.raw.payer, undefined);
    assert.equal(v.raw.links, undefined);
    // The part worth keeping survives.
    assert.equal(v.raw.id, "PAYPAL-ORDER-1");
  });
});

describe("paypal.formatAmount", () => {
  test("two decimals, because PayPal rejects anything else for USD", () => {
    assert.equal(formatAmount(34000, "USD"), "340.00");
    assert.equal(formatAmount(100, "USD"), "1.00");
    assert.equal(formatAmount(34050, "USD"), "340.50");
  });
});
