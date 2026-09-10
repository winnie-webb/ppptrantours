import { NextResponse } from "next/server";
import { site } from "@/app/data/site";
import { getProvider } from "@/lib/payments";
import {
  findPaymentByOrderId,
  settlePayment,
  recordForgedAttempt,
  getBooking,
} from "@/lib/payments/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Where WiPay sends the guest back to. This is `response_url`.
 *
 * An API route, not a page, for two reasons: `proxy.js` locale-rewrites pages
 * and 308-redirects `/en/*`, and a payment return is the last place you want a
 * redirect chain. It verifies, writes, and 303s to the result page. It never
 * renders HTML.
 *
 * ── The five checks, in order. Every one is load-bearing. ────────────────────
 *
 * 1. The hash recomputes. Proves WiPay produced this (transaction_id, total)
 *    pair, using the total WE requested — read off our own record, never from
 *    the query string.
 * 2. The order_id resolves to a payment we created, and its reference matches
 *    the one embedded in the order_id.
 * 3. The reported amount equals the amount we asked for, as integer cents.
 *    THIS IS THE ONE IMPLEMENTATIONS SKIP, and it is the one that matters:
 *    an attacker cannot forge a hash, but WiPay will hand them a perfectly
 *    valid one for the $1 they actually paid. Without this check that $1
 *    settles a $340 booking.
 * 4. The payment is still `initiated`. If it is already terminal this is a
 *    refresh, so write nothing and send them to the same page. That guard is
 *    what makes this route idempotent, which is why no nonce table is needed.
 * 5. Only then is `status` trusted.
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
  const orderId = params.get("order_id");

  const provider = getProvider("wipay") ?? getProvider("mock");
  if (!provider) {
    console.error("[payments] return hit with no provider configured");
    return NextResponse.redirect(neutralUrl("unconfirmed"), 303);
  }

  if (!orderId) {
    console.warn("[payments] return with no order_id");
    return NextResponse.redirect(neutralUrl("unconfirmed"), 303);
  }

  // (2) Resolve our own record first. Nothing is trusted before this.
  const payment = await findPaymentByOrderId(orderId);
  if (!payment) {
    console.warn(`[payments] return for unknown order_id ${orderId}`);
    return NextResponse.redirect(neutralUrl("unconfirmed"), 303);
  }

  // The order_id embeds the reference; a mismatch means it was rewritten.
  if (!orderId.startsWith(`${payment.reference}-`)) {
    console.error(
      `[payments] order_id ${orderId} does not belong to ${payment.reference}`
    );
    await recordForgedAttempt(payment.id);
    return NextResponse.redirect(neutralUrl("unconfirmed"), 303);
  }

  const booking = await getBooking(payment.reference);
  const token = booking?.lookupToken ?? null;

  // (4) Already terminal — the refresh path. Write nothing.
  if (payment.state !== "initiated") {
    return NextResponse.redirect(
      resultUrl({
        reference: payment.reference,
        token,
        state: payment.state === "paid" ? "paid" : payment.state,
      }),
      303
    );
  }

  // (1) and (5). The requested total comes from our record, not the query.
  const verdict = provider.settle(params, payment.requestedTotal);

  if (verdict.outcome === "invalid") {
    console.error(
      `[payments] ${payment.reference} hash failed for order ${orderId}`
    );
    await recordForgedAttempt(payment.id);
    return NextResponse.redirect(
      resultUrl({ reference: payment.reference, token, state: "unconfirmed" }),
      303
    );
  }

  /*
   * (3) The amount check. Integer cents on both sides.
   *
   * Under `merchant_absorb` the reported total should equal the requested one
   * exactly, so this is a strict comparison. Under `customer_pay` WiPay adds
   * its fee and the reported total is HIGHER — if the fee structure is ever
   * changed, this must become `reported >= requested` with the difference
   * recorded as a fee, not simply loosened.
   */
  if (verdict.outcome === "paid") {
    const reportedCents = Math.round(Number(verdict.reportedTotal) * 100);
    if (!Number.isFinite(reportedCents) || reportedCents !== payment.amountCents) {
      console.error(
        `[payments] ${payment.reference} amount mismatch: reported ${verdict.reportedTotal}, expected ${payment.amountCents} cents`
      );
      await recordForgedAttempt(payment.id);
      return NextResponse.redirect(
        resultUrl({ reference: payment.reference, token, state: "unconfirmed" }),
        303
      );
    }
  }

  try {
    const { alreadySettled } = await settlePayment({
      paymentId: payment.id,
      outcome: verdict.outcome,
      providerTxnId: verdict.transactionId,
      providerStatus: verdict.providerStatus,
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
    resultUrl({
      reference: payment.reference,
      token,
      state: verdict.outcome === "paid" ? "paid" : verdict.outcome,
    }),
    303
  );
}
