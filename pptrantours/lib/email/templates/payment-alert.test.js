/**
 * Tests for the payment-started alert.
 *
 * This email's whole job is to be findable later: when a capture throws, the
 * return route writes nothing on purpose, and this message plus its order id is
 * the only trail to the transaction in the PayPal dashboard. So the order id
 * and the amount are what is asserted, along with the sandbox marker — an alert
 * that does not distinguish a test charge from a real one is worse than none.
 *
 * Run: npm test
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { paymentAlert } from "./payment-alert.js";

const STARTED = {
  reference: "PPP-K3F9QX",
  orderId: "5O190127TN364715T",
  amountCents: 18750,
  currency: "USD",
  provider: "paypal",
  environment: "sandbox",
  name: "Alicia Brown",
  tourTitle: "Montego Bay → Ocho Rios transfer",
  date: "2026-10-04",
};

describe("paymentAlert", () => {
  const out = paymentAlert(STARTED);

  test("carries the order id, which is the entire point", () => {
    assert.ok(out.html.includes("5O190127TN364715T"));
  });

  test("formats the amount from cents", () => {
    assert.ok(out.html.includes("USD 187.50"));
    assert.ok(out.subject.includes("USD 187.50"));
  });

  test("says plainly that this is not a confirmed payment", () => {
    // The failure mode this guards against is the owner reading it as a sale.
    assert.ok(/not a confirmed payment/i.test(out.html));
  });

  test("flags a non-live environment in the subject", () => {
    assert.ok(out.subject.includes("[sandbox]"));
  });

  test("does not clutter a live alert with an environment tag", () => {
    const live = paymentAlert({ ...STARTED, environment: "live" });
    assert.ok(!live.subject.includes("["));
  });

  test("escapes a hostile guest name", () => {
    const out = paymentAlert({ ...STARTED, name: "<script>alert(1)</script>" });
    assert.ok(!/<script/i.test(out.html));
    assert.ok(out.html.includes("&lt;script&gt;"));
  });

  test("survives a call with nothing but an amount", () => {
    // Called from a catch path, where most of the context may be missing.
    const bare = paymentAlert({ amountCents: 100, currency: "USD" });
    assert.ok(bare.html.includes("USD 1.00"));
    assert.ok(!/\{\{/.test(bare.html));
  });

  test("leaves no unrendered placeholder behind", () => {
    assert.ok(!/\{\{/.test(out.html));
  });
});
