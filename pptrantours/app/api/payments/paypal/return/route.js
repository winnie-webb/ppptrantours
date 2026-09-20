import { NextResponse } from "next/server";
import { site } from "@/app/data/site";
import { settlePaypalOrder } from "@/lib/payments/settle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Where PayPal sends the guest back to. This is `return_url`, and with
 * `?cancelled=1` it is also `cancel_url`.
 *
 * An API route, not a page, for two reasons: `proxy.js` locale-rewrites pages
 * and 308-redirects `/en/*`, and a payment return is the last place you want a
 * redirect chain. It captures, writes, and 303s to the result page. It never
 * renders HTML.
 *
 * ── What is different from the WiPay route this replaces ────────────────────
 *
 * There is no hash. With `intent: CAPTURE` the guest arriving here has only
 * AUTHORISED — nothing has been charged — and the capture call we make below is
 * what takes the money. So this route is not verifying a claim the guest
 * carried; it is performing the charge itself, over TLS, with our own secret.
 *
 * That inverts the old failure mode in our favour. WiPay's weak point was a
 * lost redirect leaving a real charge unrecorded. Here a guest who never
 * arrives has not been charged, and the abandonment sweep marking that attempt
 * dead is simply correct.
 *
 * ── Where the checks live ───────────────────────────────────────────────────
 *
 * In `lib/payments/settle.js`, not here. The inline buttons approve in a popup
 * and settle over `/api/payments/paypal/capture` without any redirect at all,
 * so there are two ways into settlement and only one may decide whether money
 * was taken. This route is now what it always should have been: a redirect
 * shim that turns a settlement result into a URL.
 *
 * On any failure: nothing is written to the booking, the reason is logged, and
 * the guest gets a neutral page. Which check failed is never disclosed.
 */

function resultUrl({ reference, token, state }) {
  const params = new URLSearchParams({ state });
  if (token) params.set("p", token);
  return `${site.url}/booking/${reference}?${params.toString()}`;
}

function neutralUrl(state) {
  return `${site.url}/booking/unknown?state=${state}`;
}

export async function GET(request) {
  const params = request.nextUrl.searchParams;

  // PayPal's own order id. Named `token` in the redirect for historical
  // reasons; it is not a credential and proves nothing on its own.
  const paypalOrderId = params.get("token");
  const cancelled = params.get("cancelled") === "1";

  const { reference, token, state } = await settlePaypalOrder({
    paypalOrderId,
    cancelled,
  });

  // No reference means we could not match the return to a payment of ours.
  // Neutral page, and never a hint as to which check failed.
  if (!reference) {
    return NextResponse.redirect(neutralUrl(state), 303);
  }

  return NextResponse.redirect(resultUrl({ reference, token, state }), 303);
}
