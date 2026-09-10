/**
 * The seam between the booking flow and whoever takes the money.
 *
 * Deliberately thin. Two providers do not justify a plugin system, and WiPay
 * and PayPal are not the same shape: WiPay confirms by browser redirect with an
 * md5 hash and has no webhook, PayPal confirms with a server-side capture call
 * and does. A single interface spanning both collapses to
 * `settle(anything) → maybe`, which is worse than a switch.
 *
 * So each provider owns its own return route, and only these two functions —
 * the two points the booking flow genuinely does not care about — are shared.
 *
 * Adding PayPal: write lib/payments/paypal.js exporting the same handful of
 * functions, add it to PROVIDERS and to BY_CURRENCY, add
 * app/api/payments/paypal/capture/route.js. If the booking flow needs no change
 * at all, this seam was drawn in the right place. That is the test.
 */
import * as wipay from "./wipay.js";
import * as mock from "./mock.js";

const PROVIDERS = { wipay, mock };

/**
 * Currency is the only input to provider selection.
 *
 * No "preferred provider" setting: that is a knob nobody will turn correctly,
 * and it would make which processor took a payment depend on a config value
 * rather than on what the guest is paying in.
 *
 * WiPay Jamaica settles USD/JMD/TTD only. CAD/GBP/EUR is the entire reason
 * PayPal is wanted later — and note that PayPal funds a USD order from a
 * Canadian or British account by itself, so that needs no FX table here. An
 * owner-maintained rate table would put the exchange risk on PPP, go stale, and
 * quote a number that differs from the guest's card statement.
 */
const BY_CURRENCY = {
  USD: ["wipay", "paypal"],
  JMD: ["wipay"],
  TTD: ["wipay"],
  CAD: ["paypal"],
  GBP: ["paypal"],
  EUR: ["paypal"],
};

function available(name) {
  const p = PROVIDERS[name];
  if (!p) return false;
  // Second gate on the mock, independent of its own check: a fake provider
  // reachable in production is a way to mark bookings paid for free.
  if (name === "mock" && process.env.NODE_ENV === "production") return false;
  return p.isConfigured();
}

/** @returns {string|null} provider id, or null if nothing can take this currency. */
export function chooseProvider(currency) {
  // The mock stands in for whatever would otherwise have been chosen, so it is
  // tried first — but only when explicitly switched on outside production.
  if (available("mock")) return "mock";

  for (const name of BY_CURRENCY[currency] ?? []) {
    if (available(name)) return name;
  }
  return null;
}

export function getProvider(name) {
  const p = PROVIDERS[name];
  if (!p || !available(name)) return null;
  return p;
}

/** True when at least one provider could take money in this currency. */
export function paymentsConfigured(currency = "USD") {
  return chooseProvider(currency) !== null;
}

/**
 * @param {object} args
 * @param {string} args.orderId
 * @param {number} args.amountCents  integer, already re-derived server-side
 * @param {string} args.currency
 * @param {string} args.returnUrl    absolute
 * @param {object} [args.guest]
 * @returns {Promise<{provider:string, environment:string, redirectUrl:string, requestedTotal:string, raw:object}>}
 */
export async function startPayment({
  orderId,
  amountCents,
  currency,
  returnUrl,
  guest,
}) {
  const name = chooseProvider(currency);
  if (!name) throw new Error(`No payment provider available for ${currency}`);

  const provider = PROVIDERS[name];
  const result = await provider.start({
    orderId,
    amountCents,
    currency,
    returnUrl,
    guest,
  });

  return {
    provider: name,
    environment: provider.environment(),
    redirectUrl: result.redirectUrl,
    requestedTotal: result.total,
    raw: result.raw ?? {},
  };
}
