/**
 * The seam between the booking flow and whoever takes the money.
 *
 * Deliberately thin. One live provider does not justify a plugin system, and
 * the two this file has carried are not the same shape: WiPay confirmed by
 * browser redirect with an md5 hash and had no webhook, PayPal confirms with a
 * server-side capture call. A single interface spanning both collapses to
 * `settle(anything) -> maybe`, which is worse than a switch.
 *
 * So each provider owns its own return route, and only the two functions below
 * — the two points the booking flow genuinely does not care about — are shared.
 *
 * WiPay was removed rather than kept as a fallback. It never went live: it
 * requires a VERIFIED Jamaican business bank account, and keeping an
 * unreachable second processor wired up meant two return routes, two hashing
 * stories and two sets of failure paths to test for a capability nobody had.
 * The history is in git if it is ever wanted back.
 */
import * as paypal from "./paypal.js";
import * as mock from "./mock.js";

const PROVIDERS = { paypal, mock };

/**
 * Currency is the only input to provider selection.
 *
 * No "preferred provider" setting: that is a knob nobody will turn correctly,
 * and it would make which processor took a payment depend on a config value
 * rather than on what the guest is paying in.
 *
 * PayPal funds a USD order from a Canadian or British account by itself, so
 * CAD/GBP/EUR need no FX table here. An owner-maintained rate table would put
 * the exchange risk on PPP, go stale, and quote a number that differs from the
 * guest's card statement.
 *
 * JMD and TTD have no entry and therefore no provider, which is correct rather
 * than an omission: PayPal does not settle either, and WiPay — which did — was
 * removed. A guest paying in Jamaican dollars settles with the driver in cash,
 * which is what the site has always said happens.
 */
const BY_CURRENCY = {
  USD: ["paypal"],
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
 * @returns {Promise<{provider:string, environment:string, redirectUrl:string,
 *   requestedTotal:string, providerRef:string|null, raw:object}>}
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
    /*
     * The provider's own id for this attempt, stored so the return route can
     * find our record from it.
     *
     * WiPay echoed our `order_id` back in the query string, so the lookup key
     * was something we chose. PayPal hands the guest ITS order id and nothing
     * else, so the only way to get from a return to our record without trusting
     * a query parameter is to have written PayPal's id down first. Null for a
     * provider that does not need it.
     */
    providerRef: result.providerRef ?? null,
    raw: result.raw ?? {},
  };
}
