/**
 * WiPay Caribbean — the only file that knows WiPay exists.
 *
 * Verified against WiPay's official *Payments API Documentation* v1.0.8
 * (23/12/2024). The details below are not guesses; where the doc is silent it
 * says so.
 *
 * Flow: we POST server-side asking for a hosted-page URL, redirect the guest to
 * it, and WiPay redirects them back to `response_url` with the outcome in the
 * query string. Card details are entered on WiPay's page and never touch this
 * site.
 *
 * THERE IS NO WEBHOOK. The browser redirect is the only signal we get, which is
 * this integration's weak point and the reason `/api/payments/start` alerts the
 * owner at initiation rather than only on settlement — if the redirect is lost,
 * that alert plus the `order_id` is what lets him find the payment in the WiPay
 * dashboard by hand.
 */
import crypto from "node:crypto";

const ENDPOINTS = {
  JM: "https://jm.wipayfinancial.com/plugins/payments/request",
  TT: "https://tt.wipayfinancial.com/plugins/payments/request",
  BB: "https://bb.wipayfinancial.com/plugins/payments/request",
  GY: "https://gy.wipayfinancial.com/plugins/payments/request",
};

/** WiPay Jamaica settles these. Not CAD/GBP/EUR — that is what PayPal is for. */
const CURRENCIES = ["USD", "JMD", "TTD"];

export const id = "wipay";

export function supportsCurrency(code) {
  return CURRENCIES.includes(code);
}

function config() {
  const environment =
    process.env.WIPAY_ENVIRONMENT === "live" ? "live" : "sandbox";

  /*
   * The published sandbox pair, as a fallback in development only.
   *
   * The sandbox computes a real hash from key "123", so the verification path is
   * genuinely exercised without anyone holding an account. But the fallback is
   * gated on NODE_ENV as well as on `environment`, and that gate is the
   * important half: without it, deploying with no WiPay variables set would
   * leave `isConfigured()` true in production, offer every guest a Pay button,
   * and send them to WiPay's *sandbox* — a card page that takes their details
   * and settles nothing. Production must be configured explicitly or offer no
   * card payment at all.
   */
  const allowSandboxFallback =
    environment === "sandbox" && process.env.NODE_ENV !== "production";

  const accountNumber =
    process.env.WIPAY_ACCOUNT_NUMBER ||
    (allowSandboxFallback ? "1234567890" : "");
  const apiKey =
    process.env.WIPAY_API_KEY || (allowSandboxFallback ? "123" : "");

  return {
    environment,
    accountNumber,
    apiKey,
    countryCode: process.env.WIPAY_COUNTRY_CODE || "JM",
    // merchant_absorb: the guest is charged exactly the fare we published. The
    // ~3.5% is covered in the published prices instead, so no processing fee
    // ever appears at checkout — which is the only option consistent with
    // "no fuel levy, no airport surcharge, what you see is the whole fare".
    feeStructure: process.env.WIPAY_FEE_STRUCTURE || "merchant_absorb",
  };
}

export function isConfigured() {
  const c = config();
  return Boolean(c.accountNumber && c.apiKey && ENDPOINTS[c.countryCode]);
}

export function environment() {
  return config().environment;
}

/**
 * Ask WiPay for a hosted payment page.
 *
 * @param {object} args
 * @param {string} args.orderId      unique; echoed back to us. See the cap below.
 * @param {number} args.amountCents  integer
 * @param {string} args.currency
 * @param {string} args.returnUrl    absolute
 * @param {{name?:string, email?:string, phone?:string}} [args.guest]
 * @returns {Promise<{redirectUrl: string, raw: object}>}
 */
export async function start({
  orderId,
  amountCents,
  currency,
  returnUrl,
  guest = {},
}) {
  const c = config();
  const endpoint = ENDPOINTS[c.countryCode];
  if (!endpoint) throw new Error(`No WiPay endpoint for ${c.countryCode}`);
  if (!c.accountNumber || !c.apiKey) throw new Error("WiPay is not configured");

  /*
   * `order_id` is capped at 16 characters on FGB, which is the hosted page
   * Jamaica uses (FAC allows 48). It must also begin and end alphanumeric. A
   * PPP-XXXXXX reference is 10, leaving room for a short suffix — but nothing
   * here may grow past 16 without checking which hosted page is in play.
   */
  if (orderId.length > 16) {
    throw new Error(`order_id "${orderId}" exceeds the 16-char FGB limit`);
  }

  /*
   * `total` must be a string with exactly two decimals, and it must be byte-for
   * -byte the same string we later hash. "340" and "340.00" produce different
   * md5 digests, so it is formatted once, here, and returned to the caller to
   * store.
   */
  const total = (amountCents / 100).toFixed(2);

  const form = new URLSearchParams({
    account_number: c.accountNumber,
    country_code: c.countryCode,
    currency,
    environment: c.environment,
    fee_structure: c.feeStructure,
    method: "credit_card",
    order_id: orderId,
    origin: "ppp-tran-tours",
    response_url: returnUrl,
    total,
    // card_type is deliberately omitted so the guest gets WiPay's Visa /
    // Mastercard chooser rather than us guessing which card they hold.
  });

  if (guest.name) form.set("name", guest.name.slice(0, 60));
  if (guest.email) form.set("email", guest.email.slice(0, 50));
  if (guest.phone) form.set("phone", guest.phone.slice(0, 20));

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      // Without this WiPay replies with a 302 to the hosted page. Asking for
      // JSON gets the URL back instead, so the API key stays server-side and we
      // can record the attempt before the guest goes anywhere.
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
    cache: "no-store",
  });

  const text = await res.text();
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error(
      `WiPay returned ${res.status} with a non-JSON body: ${text.slice(0, 200)}`
    );
  }

  const redirectUrl = raw.url ?? raw.redirect_url ?? raw.data?.url;
  if (!res.ok || !redirectUrl) {
    throw new Error(
      `WiPay refused the request (${res.status}): ${
        raw.message ?? raw.error ?? text.slice(0, 200)
      }`
    );
  }

  return { redirectUrl, total, raw };
}

/**
 * Recompute the response hash.
 *
 * `md5(transaction_id + total + api_key)`, concatenated in that order with NO
 * separators, compared as lowercase hex.
 *
 * `total` must be the raw query-string value, untouched. Re-formatting it —
 * `Number(t).toFixed(2)`, trimming a zero — is the single most common way this
 * integration is broken, because "340.00" and "340" hash differently.
 *
 * Exported separately from `settle` so it can be checked against a known
 * answer without a Firestore or a network round trip. See lib/payments/wipay.test.js.
 */
export function verifyHash({ transactionId, total, hash, apiKey }) {
  const key = apiKey ?? config().apiKey;
  if (!key || !hash || !transactionId || total == null) return false;

  const expected = crypto
    .createHash("md5")
    .update(`${transactionId}${total}${key}`, "utf8")
    .digest("hex");

  const supplied = String(hash).toLowerCase();

  // timingSafeEqual throws on a length mismatch, so guard first. Timing is not
  // really the threat here, but it costs one line and removes the question.
  if (supplied.length !== expected.length) return false;
  return crypto.timingSafeEqual(
    Buffer.from(supplied, "utf8"),
    Buffer.from(expected, "utf8")
  );
}

/**
 * Read WiPay's redirect back into a verdict.
 *
 * `requestedTotal` is the total string WE sent, read back off our own payment
 * record — NOT the `total` in the query string. This is not a stylistic
 * preference:
 *
 *   md5("SB-12-1-oid_123-aBc-20210616024001" + "10.00" + "123")
 *     = 3d34d20260f7433ceee277e9ed9166a3
 *
 * which is exactly the hash printed in the doc's own worked example — an
 * example whose *response* total is 12.05, because it ran under
 * `customer_pay` and WiPay had added its fee. So the digest covers the amount
 * requested, and an implementation that hashes the amount returned works only
 * by accident under `merchant_absorb` and breaks the moment the fee structure
 * changes. (That computation also confirms the example used the published
 * sandbox key, 123.)
 *
 * Returns a plain object. It deliberately does NOT decide whether the amount is
 * right or which booking this belongs to — the hash proves only that WiPay
 * produced this pair. Those checks live in the return route, the only place
 * that knows what was asked for.
 *
 * @param {URLSearchParams} params
 * @param {string} requestedTotal  e.g. "340.00", as stored at initiation
 */
export function settle(params, requestedTotal) {
  const get = (k) => params.get(k) ?? null;

  const transactionId = get("transaction_id");
  const total = get("total"); // raw string, never coerced
  const orderId = get("order_id");
  const hash = get("hash");
  const status = (get("status") ?? "").toLowerCase();

  /*
   * `hash` is only returned when `status` is success. A missing hash on a
   * decline or a cancellation is normal and must not be read as tampering; a
   * missing hash on a *claimed* success is exactly that.
   */
  const succeeded = status === "success";
  const verified = succeeded
    ? verifyHash({ transactionId, total: requestedTotal, hash })
    : false;

  let outcome;
  if (!succeeded) {
    outcome = status === "cancelled" ? "cancelled" : "failed";
  } else if (!verified) {
    outcome = "invalid";
  } else {
    outcome = "paid";
  }

  return {
    outcome,
    verified,
    orderId,
    transactionId,
    reportedTotal: total,
    providerStatus: status || null,
    message: get("message"),
    // Stored for audit. WiPay never sends card data, so there is nothing to
    // scrub beyond the hash itself, which is dropped as it proves nothing later.
    raw: Object.fromEntries(
      [...params.entries()].filter(([k]) => k !== "hash")
    ),
  };
}
