/**
 * A fake hosted payment page, for development only.
 *
 * `response_url` cannot be localhost as far as WiPay is concerned, so testing
 * the real flow needs a tunnel. This stands in instead: `start()` returns a
 * local page with succeed / decline / cancel / forge buttons, each of which
 * redirects to the REAL return route with a REAL hash computed from the sandbox
 * key. Everything downstream of WiPay's own page is therefore exercised
 * genuinely — including the failure paths, which a tunnel makes tedious to
 * reach and a live card makes expensive.
 *
 * Guarded twice, deliberately. `isConfigured()` requires PAYMENTS_MOCK=1 AND a
 * non-production NODE_ENV, and `lib/payments/index.js` refuses to select this
 * provider in production regardless of what the environment says. A mock
 * payment provider reachable in production is a way to mark bookings paid for
 * free.
 */
import { verifyHash } from "./wipay.js";

export const id = "mock";

export function isConfigured() {
  return process.env.PAYMENTS_MOCK === "1" && process.env.NODE_ENV !== "production";
}

export function supportsCurrency() {
  return true;
}

export function environment() {
  return "mock";
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
    raw: { mock: true },
  };
}

/** Same contract as the WiPay reader, so the return route needs no branch. */
export function settle(params, requestedTotal) {
  const status = (params.get("status") ?? "").toLowerCase();
  const transactionId = params.get("transaction_id");
  const hash = params.get("hash");

  const succeeded = status === "success";
  const verified = succeeded
    ? verifyHash({
        transactionId,
        total: requestedTotal,
        hash,
        apiKey: process.env.WIPAY_API_KEY || "123",
      })
    : false;

  let outcome;
  if (!succeeded) outcome = status === "cancelled" ? "cancelled" : "failed";
  else if (!verified) outcome = "invalid";
  else outcome = "paid";

  return {
    outcome,
    verified,
    orderId: params.get("order_id"),
    transactionId,
    reportedTotal: params.get("total"),
    providerStatus: status || null,
    message: params.get("message"),
    raw: Object.fromEntries(
      [...params.entries()].filter(([k]) => k !== "hash")
    ),
  };
}
