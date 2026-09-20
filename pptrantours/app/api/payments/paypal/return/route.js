import { NextResponse } from "next/server";
import { site } from "@/app/data/site";
import { getProvider } from "@/lib/payments";
import {
  findPaymentByProviderRef,
  settlePayment,
  recordForgedAttempt,
  getBooking,
} from "@/lib/payments/store";

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
 * ── The checks, in order. Every one is load-bearing. ────────────────────────
 *
 * 1. The `token` resolves to a payment WE created, found by the PayPal order id
 *    we wrote down before the guest left. No query parameter is trusted for
 *    anything except this lookup, and a lookup miss is fatal.
 * 2. The payment is still `initiated`. Already terminal means this is a
 *    refresh: write nothing, send them to the same page. That guard is what
 *    makes this route idempotent, and it is why no nonce table is needed. The
 *    `PayPal-Request-Id` on the capture is the second line behind it.
 * 3. The capture's `custom_id` equals the order id we issued, and the captured
 *    amount equals what we asked for. Both live in lib/payments/paypal.js,
 *    because they are assertions about a PayPal response rather than about
 *    this route. THE AMOUNT CHECK IS THE ONE IMPLEMENTATIONS SKIP — see the
 *    note there.
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

  const provider = getProvider("paypal");
  if (!provider) {
    console.error("[payments] paypal return hit with no provider configured");
    return NextResponse.redirect(neutralUrl("unconfirmed"), 303);
  }

  if (!paypalOrderId) {
    // A cancel with no token cannot be matched to anything, and that is fine:
    // nothing was charged, and the sweep will retire the attempt.
    console.warn("[payments] paypal return with no token");
    return NextResponse.redirect(
      neutralUrl(cancelled ? "cancelled" : "unconfirmed"),
      303
    );
  }

  // (1) Resolve our own record first. Nothing is acted on before this.
  const payment = await findPaymentByProviderRef(paypalOrderId);
  if (!payment) {
    console.warn(`[payments] paypal return for unknown order ${paypalOrderId}`);
    return NextResponse.redirect(neutralUrl("unconfirmed"), 303);
  }

  const booking = await getBooking(payment.reference);
  const token = booking?.lookupToken ?? null;

  // (2) Already terminal — the refresh path. Write nothing.
  if (payment.state !== "initiated") {
    return NextResponse.redirect(
      resultUrl({
        reference: payment.reference,
        token,
        state: payment.state,
      }),
      303
    );
  }

  /*
   * The guest backed out on PayPal's page. Recorded as cancelled without
   * calling capture — there is nothing to capture, and asking would return
   * ORDER_NOT_APPROVED and be logged as a failure it is not.
   */
  if (cancelled) {
    await settlePayment({
      paymentId: payment.id,
      outcome: "cancelled",
      providerTxnId: null,
      providerStatus: "CANCELLED_BY_PAYER",
      hashVerified: false,
      returnPayload: null,
    }).catch((err) =>
      console.error(`[payments] ${payment.reference} cancel not recorded`, err)
    );

    return NextResponse.redirect(
      resultUrl({ reference: payment.reference, token, state: "cancelled" }),
      303
    );
  }

  // (3) The charge, and every assertion about it.
  let verdict;
  try {
    verdict = await provider.capture({
      paypalOrderId,
      expectedCustomId: payment.orderId,
      expectedCents: payment.amountCents,
      currency: payment.currency,
    });
  } catch (err) {
    /*
     * A thrown capture is genuinely ambiguous — a timeout can mean the charge
     * went through and we lost the answer. NOTHING is written: leaving the
     * attempt `initiated` keeps it visible in /admin as in-flight and lets the
     * guest retry, and the PayPal dashboard settles which it was. Writing
     * "failed" here is how a real charge gets collected a second time.
     */
    console.error(
      `[payments] ${payment.reference} capture threw for ${paypalOrderId}`,
      err
    );
    return NextResponse.redirect(
      resultUrl({ reference: payment.reference, token, state: "unconfirmed" }),
      303
    );
  }

  if (verdict.outcome === "invalid") {
    console.error(
      `[payments] ${payment.reference} capture failed verification: ${verdict.message}`
    );
    await recordForgedAttempt(payment.id);
    return NextResponse.redirect(
      resultUrl({ reference: payment.reference, token, state: "unconfirmed" }),
      303
    );
  }

  try {
    const { alreadySettled } = await settlePayment({
      paymentId: payment.id,
      outcome: verdict.outcome,
      providerTxnId: verdict.transactionId,
      providerStatus: verdict.providerStatus,
      // Named for WiPay's md5, kept because the column means "the provider's
      // own proof checked out" and PayPal's proof is the authenticated capture.
      hashVerified: verdict.verified,
      returnPayload: verdict.raw,
    });

    if (!alreadySettled) {
      console.log(
        `[payments] ${payment.reference} ${verdict.outcome} (${verdict.transactionId ?? "no txn"})`
      );
    }
  } catch (err) {
    console.error(`[payments] ${payment.reference} could not be settled`, err);
    return NextResponse.redirect(
      resultUrl({ reference: payment.reference, token, state: "unconfirmed" }),
      303
    );
  }

  return NextResponse.redirect(
    resultUrl({ reference: payment.reference, token, state: verdict.outcome }),
    303
  );
}
