/**
 * A fake hosted payment page, for development only.
 *
 * `start()` returns a local page with succeed / decline / cancel / pending /
 * forge / underpay buttons, each of which redirects to the mock's own return
 * route. Everything downstream of the provider — the store, the settlement
 * transaction, the booking summary, the result page — is therefore exercised
 * genuinely, including the failure paths that are tedious to reach by hand and
 * expensive to reach with a live card.
 *
 * ── What it deliberately does NOT cover ─────────────────────────────────────
 *
 * lib/payments/paypal.js itself. The mock used to share WiPay's return route,
 * because WiPay's settlement was a pure function of a query string and could be
 * faked exactly. PayPal's settlement is a network capture against PayPal, so
 * there is nothing honest to fake: a mock that returned a hand-made "captured"
 * object would be testing the mock. Use the PayPal SANDBOX for that — and note
 * that unlike WiPay, whose `response_url` could not be localhost, PayPal
 * redirects the browser and is happy with a localhost return URL, so the
 * sandbox needs no tunnel.
 *
 * Guarded twice, deliberately. `isConfigured()` requires PAYMENTS_MOCK=1 AND a
 * non-production NODE_ENV, and `lib/payments/index.js` refuses to select this
 * provider in production regardless of what the environment says. A mock
 * payment provider reachable in production is a way to mark bookings paid for
 * free.
 */
import crypto from "node:crypto";

export const id = "mock";

/**
 * Self-contained, where this used to borrow WiPay's key and md5.
 *
 * Not a security boundary — the whole module is unreachable in production — but
 * it keeps the mock from becoming the reason a dead provider's file has to
 * stay, which is exactly how wipay.js would have survived its own removal.
 */
const SECRET = "mock-payments-dev-only";

export function isConfigured() {
  return process.env.PAYMENTS_MOCK === "1" && process.env.NODE_ENV !== "production";
}

export function supportsCurrency() {
  return true;
}

export function environment() {
  return "mock";
}

export function sign({ orderId, total }) {
  return crypto
    .createHmac("sha256", SECRET)
    .update(`${orderId}|${total}`, "utf8")
    .digest("hex");
}

export function verify({ orderId, total, signature }) {
  if (!orderId || total == null || !signature) return false;
  const expected = sign({ orderId, total });
  const supplied = String(signature);
  if (supplied.length !== expected.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(supplied, "utf8"),
    Buffer.from(expected, "utf8")
  );
}

export async function start({ orderId, amountCents, currency, returnUrl }) {
  const total = (amountCents / 100).toFixed(2);
  const params = new URLSearchParams({
    order_id: orderId,
    total,
    currency,
    return_url: returnUrl,
  });
  return {
    redirectUrl: `/api/payments/mock?${params.toString()}`,
    total,
    // Stands in for PayPal's order id so the return route's lookup by
    // providerRef works identically under the mock.
    providerRef: `MOCK-${orderId}`,
    raw: { mock: true },
  };
}

/**
 * Read the mock's redirect back into a verdict.
 *
 * Same shape as what lib/payments/paypal.js `capture()` returns, so the mock's
 * return route and the PayPal one reach `settlePayment` with identical
 * arguments — which is the only part of the contract worth preserving now that
 * the two providers no longer share a route.
 *
 * `requestedTotal` is read off OUR record, never the query string. The
 * "underpay" button exists precisely to prove that check still bites.
 */
export function settle(params, requestedTotal) {
  const status = (params.get("status") ?? "").toLowerCase();
  const transactionId = params.get("transaction_id");
  const orderId = params.get("order_id");
  const reportedTotal = params.get("total");

  const signed = verify({
    orderId,
    total: requestedTotal,
    signature: params.get("sig"),
  });

  let outcome;
  if (status === "cancelled") outcome = "cancelled";
  else if (status === "pending") outcome = "pending";
  else if (status !== "success") outcome = "failed";
  else if (!signed) outcome = "invalid";
  else if (reportedTotal !== requestedTotal) outcome = "invalid";
  else outcome = "paid";

  return {
    outcome,
    verified: signed,
    orderId,
    transactionId,
    reportedTotal,
    providerStatus: status || null,
    message: params.get("message"),
    raw: Object.fromEntries(
      [...params.entries()].filter(([k]) => k !== "sig")
    ),
  };
}
