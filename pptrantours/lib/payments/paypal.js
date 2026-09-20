/**
 * PayPal Orders v2 — the only file that knows PayPal exists.
 *
 * Flow: we create an order server-side, redirect the guest to PayPal's hosted
 * approval page, and they come back to `/api/payments/paypal/return`. We then
 * CAPTURE server-side. Card details are entered on PayPal's page and never
 * touch this site.
 *
 * ── Why this is safer than the WiPay integration it replaced ────────────────
 *
 * WiPay confirmed by browser redirect carrying an md5 hash, which meant a
 * closed tab could leave a REAL CHARGE with no record on our side. PayPal has
 * no such hole, for a structural reason: with `intent: CAPTURE`, approving on
 * PayPal's page only AUTHORISES. Nothing is charged until our server calls
 * capture. So a guest who approves and then closes the tab has not paid, and
 * the abandonment sweep marking that attempt dead is telling the truth.
 *
 * It also means there is no hash to verify, and nothing to verify it with: the
 * capture response comes back over TLS on a connection authenticated with our
 * own secret, so the response IS the proof. What still has to be checked is
 * that the captured order is the one we created, for the amount we asked —
 * see `capture()` below.
 *
 * Amounts are never taken from the client. `/api/payments/start` re-derives
 * them from the stored booking before anything here is called.
 */

const API = {
  sandbox: "https://api-m.sandbox.paypal.com",
  live: "https://api-m.paypal.com",
};

/**
 * PayPal settles all of these into a USD-denominated order by itself, funding a
 * Canadian or British account without us holding an FX table. An owner-
 * maintained rate table would put the exchange risk on PPP, go stale, and quote
 * a number that differs from the guest's card statement.
 */
const CURRENCIES = ["USD", "CAD", "GBP", "EUR"];

/** PayPal rejects an amount whose decimal places do not match the currency. */
const ZERO_DECIMAL = ["JPY", "HUF", "TWD"];

export const id = "paypal";

export function supportsCurrency(code) {
  return CURRENCIES.includes(code);
}

function config() {
  const environment =
    process.env.PAYPAL_ENVIRONMENT === "live" ? "live" : "sandbox";

  return {
    environment,
    base: API[environment],
    clientId: process.env.PAYPAL_CLIENT_ID || "",
    clientSecret: process.env.PAYPAL_CLIENT_SECRET || "",
    brandName: process.env.PAYPAL_BRAND_NAME || "PPP Tran Tours",
  };
}

/**
 * No sandbox fallback pair, unlike the WiPay module that stood here.
 *
 * WiPay publishes shared sandbox credentials, so that module could fall back to
 * them in development. PayPal does not — sandbox credentials are per-developer.
 * There is therefore nothing to fall back TO, and `PAYMENTS_MOCK=1` is how this
 * flow is exercised without an account. See lib/payments/mock.js.
 */
export function isConfigured() {
  const c = config();
  return Boolean(c.clientId && c.clientSecret);
}

export function environment() {
  return config().environment;
}

/** Two decimals for every currency this site takes. Kept honest anyway. */
export function formatAmount(amountCents, currency) {
  if (ZERO_DECIMAL.includes(currency)) return String(Math.round(amountCents / 100));
  return (amountCents / 100).toFixed(2);
}

/**
 * OAuth2 client-credentials token.
 *
 * Deliberately NOT cached across requests. Tokens live ~9 hours and caching one
 * in module scope would mean a serverless instance holding a credential across
 * invocations for a saving of one round trip on a flow that already redirects
 * the guest to another domain. Not worth the lifetime question.
 */
async function accessToken() {
  const c = config();
  if (!c.clientId || !c.clientSecret) throw new Error("PayPal is not configured");

  const basic = Buffer.from(`${c.clientId}:${c.clientSecret}`).toString("base64");

  const res = await fetch(`${c.base}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });

  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    throw new Error(`PayPal auth returned ${res.status}: ${text.slice(0, 200)}`);
  }

  if (!res.ok || !body.access_token) {
    // `error_description` is PayPal's own wording and is safe to log: it says
    // "Client Authentication failed", never anything about the guest.
    throw new Error(
      `PayPal auth failed (${res.status}): ${body.error_description ?? body.error ?? "no token"}`
    );
  }

  return body.access_token;
}

/**
 * Create an order and get the approval URL.
 *
 * @param {object} args
 * @param {string} args.orderId      OUR reference-derived id. Becomes custom_id.
 * @param {number} args.amountCents  integer
 * @param {string} args.currency
 * @param {string} args.returnUrl    absolute
 * @param {{name?:string, email?:string}} [args.guest]
 * @returns {Promise<{redirectUrl:string, total:string, providerRef:string, raw:object}>}
 */
export async function start({
  orderId,
  amountCents,
  currency,
  returnUrl,
  guest = {},
}) {
  const c = config();
  const total = formatAmount(amountCents, currency);
  const token = await accessToken();

  /*
   * `custom_id` is the binding between PayPal's order and our payment record,
   * and it is the check `capture()` leans on. PayPal echoes it back on the
   * capture, and a guest cannot make PayPal echo a value we did not set.
   *
   * `invoice_id` is NOT set to the same thing, deliberately. PayPal enforces
   * invoice_id uniqueness per merchant account and fails the capture with
   * DUPLICATE_INVOICE_ID on a collision — which would turn a retried booking
   * into a hard failure. custom_id has no such constraint and serves the
   * matching purpose on its own.
   */
  const payload = {
    intent: "CAPTURE",
    purchase_units: [
      {
        reference_id: orderId,
        custom_id: orderId,
        description: `${c.brandName} booking ${orderId.split("-").slice(0, 2).join("-")}`,
        amount: { currency_code: currency, value: total },
      },
    ],
    /*
     * `application_context`, and deliberately NOT `payment_source.paypal`.
     *
     * Pinning payment_source.paypal at creation declares the order is to be
     * funded from a PayPal wallet. That is fine for a redirect to PayPal's own
     * page, and fatal for the inline card button: the SDK confirms a card by
     * sending `payment_source.card`, against an order that has already said it
     * will be paid another way. One order has to serve both the buttons and
     * the redirect fallback, so it commits to neither.
     *
     * The cost is the email prefill, which lived under payment_source and has
     * no equivalent here. Worth losing — it only ever helped the guests who
     * already had a PayPal account, which is not who this change is for.
     */
    application_context: {
      brand_name: c.brandName,
      // No address is collected for a transfer, and asking for one on
      // PayPal's page is a step that loses bookings.
      shipping_preference: "NO_SHIPPING",
      // "Pay Now" rather than "Continue": the guest sees the final amount
      // on PayPal's own button, which is what we want them to have agreed.
      user_action: "PAY_NOW",
      /*
       * Lead with the card form, not the login.
       *
       * This was NO_PREFERENCE, which in practice means PayPal decides — and
       * PayPal decides "log in". A guest without an account then has to find
       * "Pay with Debit or Credit Card" underneath it, and plenty do not. The
       * whole point of taking a card is that not having a PayPal account is
       * normal.
       *
       * BILLING, not GUEST_CHECKOUT. The two enums are not interchangeable and
       * this cost a broken deploy: `application_context.landing_page` accepts
       * LOGIN | BILLING | NO_PREFERENCE, while GUEST_CHECKOUT belongs to
       * `payment_source.*.experience_context.landing_page`. Sending the wrong
       * one makes PayPal refuse the order outright, so /api/payments/start
       * 502s and no card can be taken at all.
       */
      landing_page: "BILLING",
      return_url: returnUrl,
      // PayPal sends a cancel to a different URL entirely, so it carries a
      // marker rather than relying on an absent token.
      cancel_url: `${returnUrl}?cancelled=1`,
    },
  };

  const res = await fetch(`${c.base}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      // Idempotency on creation: a double-submit produces one PayPal order.
      "PayPal-Request-Id": `create-${orderId}`,
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const text = await res.text();
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new Error(
      `PayPal returned ${res.status} with a non-JSON body: ${text.slice(0, 200)}`
    );
  }

  if (!res.ok || !raw.id) {
    throw new Error(
      `PayPal refused the order (${res.status}): ${describeError(raw) ?? text.slice(0, 200)}`
    );
  }

  /*
   * `payer-action` is the v2 link for the payment_source flow used here.
   * `approve` is the older application_context shape. Both are accepted so a
   * PayPal-side change of which one is emitted does not strand every guest on
   * an error page.
   */
  const link = (raw.links ?? []).find(
    (l) => l.rel === "payer-action" || l.rel === "approve"
  );
  if (!link?.href) {
    throw new Error(`PayPal order ${raw.id} came back with no approval link`);
  }

  return { redirectUrl: link.href, total, providerRef: raw.id, raw };
}

/** PayPal's error bodies nest the useful part two levels down. */
function describeError(body) {
  if (!body) return null;
  const detail = body.details?.[0];
  if (detail) return `${detail.issue}${detail.description ? `: ${detail.description}` : ""}`;
  return body.message ?? body.name ?? null;
}

/** Pull the first capture out of a capture response, whatever shape it took. */
function firstCapture(body) {
  return body?.purchase_units?.[0]?.payments?.captures?.[0] ?? null;
}

/**
 * Capture an approved order, and decide whether it counts.
 *
 * This is the equivalent of WiPay's `settle()`, but it makes a network call
 * rather than reading a query string, so it cannot share that signature — which
 * is exactly why lib/payments/index.js gives each provider its own return route
 * instead of pretending one interface fits both.
 *
 * ── The checks, in order ────────────────────────────────────────────────────
 *
 * 1. The capture HTTP call succeeds with our own credentials. Nothing below is
 *    guest-supplied; there is no hash to forge because there is no hash.
 * 2. `custom_id` on the capture equals the order id we issued. This is what
 *    stops a token belonging to some other order settling this booking.
 * 3. The captured amount and currency equal what we asked for. An attacker
 *    cannot alter a PayPal order after creation, but this is the check that
 *    catches OUR bugs — a re-priced booking, a stale record — and it is cheap.
 * 4. Only then is the status read.
 *
 * ALREADY_CAPTURED is not a failure. It is the guest refreshing the return tab,
 * and it means the money was taken; the caller's `initiated` guard normally
 * absorbs that, and this is the second line.
 *
 * @param {object} args
 * @param {string} args.paypalOrderId   the `token` PayPal sends back
 * @param {string} args.expectedCustomId  our order id, from our own record
 * @param {number} args.expectedCents     from our own record
 * @param {string} args.currency
 * @returns {Promise<{outcome:string, verified:boolean, transactionId:string|null,
 *   reportedTotal:string|null, providerStatus:string|null, message:string|null, raw:object}>}
 */
export async function capture({
  paypalOrderId,
  expectedCustomId,
  expectedCents,
  currency,
}) {
  const c = config();
  const token = await accessToken();

  const res = await fetch(
    `${c.base}/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        // Real idempotency: a retried capture returns the original result
        // rather than charging twice.
        "PayPal-Request-Id": `capture-${expectedCustomId}`,
      },
      body: "{}",
      cache: "no-store",
    }
  );

  const text = await res.text();
  let body;
  try {
    body = JSON.parse(text);
  } catch {
    return fail("unconfirmed-body", `PayPal capture returned ${res.status}`, {
      status: res.status,
    });
  }

  if (!res.ok) {
    const issue = body.details?.[0]?.issue ?? body.name ?? "";

    if (issue === "ORDER_ALREADY_CAPTURED") {
      // The refresh path. Treated as paid without re-reading the amount: the
      // original capture already passed every check below before it was stored.
      return {
        outcome: "paid",
        verified: true,
        transactionId: null,
        reportedTotal: null,
        providerStatus: "ALREADY_CAPTURED",
        message: null,
        raw: scrub(body),
      };
    }

    // A declined instrument is a real, ordinary decline — the guest can retry
    // with another card. It is not an error on our side.
    if (issue === "INSTRUMENT_DECLINED" || issue === "PAYER_ACTION_REQUIRED") {
      return fail("failed", issue, scrub(body));
    }

    return fail("failed", describeError(body) ?? `HTTP ${res.status}`, scrub(body));
  }

  const cap = firstCapture(body);
  if (!cap) {
    return fail("unconfirmed-body", "capture response carried no capture", scrub(body));
  }

  // (2) The binding check.
  const customId = cap.custom_id ?? body.purchase_units?.[0]?.custom_id ?? null;
  if (customId !== expectedCustomId) {
    return fail(
      "invalid",
      `custom_id ${customId} does not match ${expectedCustomId}`,
      scrub(body)
    );
  }

  // (3) The amount check, in integer cents on both sides.
  const value = cap.amount?.value ?? null;
  const gotCents = Math.round(Number(value) * 100);
  if (
    !Number.isFinite(gotCents) ||
    gotCents !== expectedCents ||
    cap.amount?.currency_code !== currency
  ) {
    return fail(
      "invalid",
      `captured ${value} ${cap.amount?.currency_code} against ${expectedCents} cents ${currency}`,
      scrub(body)
    );
  }

  // (4) The status.
  const status = String(cap.status ?? body.status ?? "").toUpperCase();

  /*
   * PENDING is neither paid nor failed, and collapsing it into either is a lie
   * the owner would act on. It means PayPal has the money but is holding it —
   * an eCheck clearing, or a manual review. The booking shows as pending, the
   * capture id is stored, and it is reconciled from the PayPal dashboard.
   */
  if (status === "PENDING") {
    return {
      outcome: "pending",
      verified: true,
      transactionId: cap.id ?? null,
      reportedTotal: value,
      providerStatus: `PENDING:${cap.status_details?.reason ?? "unspecified"}`,
      message: null,
      raw: scrub(body),
    };
  }

  if (status !== "COMPLETED") {
    return fail("failed", `capture status ${status}`, scrub(body));
  }

  return {
    outcome: "paid",
    verified: true,
    transactionId: cap.id ?? null,
    reportedTotal: value,
    providerStatus: status,
    message: null,
    raw: scrub(body),
  };
}

function fail(outcome, message, raw) {
  return {
    outcome: outcome === "unconfirmed-body" ? "failed" : outcome,
    verified: false,
    transactionId: null,
    reportedTotal: null,
    providerStatus: null,
    message,
    raw: raw ?? {},
  };
}

/**
 * Drop everything from a stored PayPal payload that we have no reason to keep.
 *
 * PayPal returns the payer's name, email and account id on a capture. None of
 * it is needed — the booking already holds the contact details the guest gave
 * us — and storing a second copy keyed to a payment record is a privacy cost
 * with no operational benefit. `links` are one-shot and stale by the time
 * anyone reads the record.
 */
function scrub(body) {
  if (!body || typeof body !== "object") return {};
  const { payer, links, payment_source, ...rest } = body;
  return rest;
}
