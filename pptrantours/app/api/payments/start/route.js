import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { site } from "@/app/data/site";
import { startPayment, chooseProvider } from "@/lib/payments";
import {
  createPayment,
  makeOrderId,
  getBooking,
  countInitiated,
  hasPaid,
  sweepAbandoned,
} from "@/lib/payments/store";
import { sendPaymentAlert } from "@/lib/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** How many attempts one booking may have in flight before we stop. */
const MAX_IN_FLIGHT = 5;

const bad = (error, status) =>
  NextResponse.json({ error }, { status, headers: { "Cache-Control": "no-store" } });

/**
 * Create a payment session for an existing booking.
 *
 * Takes a reference and nothing else that matters. **No amount is accepted from
 * the client** — it is re-derived from the stored booking, the same principle as
 * the re-pricing in /api/bookings. The worst an attacker achieves by hammering
 * this is creating hosted-page sessions against their own booking, which the
 * in-flight cap bounds.
 */
export async function POST(request) {
  const db = getAdminDb();
  if (!db) return bad("Payments are not available.", 503);

  let body;
  try {
    body = await request.json();
  } catch {
    return bad("Malformed request.", 400);
  }

  const reference = String(body.reference ?? "").trim().slice(0, 20);
  if (!/^PPP-[A-Z2-9]{6}$/.test(reference)) {
    return bad("That booking reference is not valid.", 400);
  }

  const booking = await getBooking(reference);
  // Deliberately the same message as an invalid reference: this must not
  // become an oracle for which references exist.
  if (!booking) return bad("That booking could not be found.", 404);

  if (booking.type === "enquiry") {
    return bad("There is nothing to pay on an enquiry.", 422);
  }

  /*
   * The amount, re-derived. `payableCents` was written by /api/bookings from
   * payable(), which refuses to collect against a missing or provisional price.
   * A zero here means the booking is a quote request or carries an indicative
   * figure, and neither may be charged.
   */
  const amountCents = booking.payment?.payableCents ?? 0;
  if (!amountCents) {
    return bad("That booking has no fixed price to pay yet.", 422);
  }

  const currency = booking.payment?.currency ?? "USD";
  const providerName = chooseProvider(currency);
  if (!providerName) {
    return bad("Card payment is not switched on.", 503);
  }

  if (await hasPaid(reference)) {
    return bad("That booking has already been paid.", 409);
  }

  // Clear anything the guest walked away from before counting.
  await sweepAbandoned(20).catch(() => {});
  if ((await countInitiated(reference)) >= MAX_IN_FLIGHT) {
    return bad("Too many payment attempts. Please contact us.", 429);
  }

  const orderId = makeOrderId(reference);

  /*
   * Each provider owns its own return route, so the URL is built from whichever
   * one was selected rather than hardcoded. This used to name wipay explicitly,
   * which meant the mock provider redirected guests into WiPay's route — fine
   * while the two shared a settlement shape, and a silent mis-route the moment
   * they stopped.
   */
  const returnUrl = `${site.url}/api/payments/${providerName}/return`;

  let started;
  try {
    started = await startPayment({
      orderId,
      amountCents,
      currency,
      returnUrl,
      guest: {
        name: booking.name,
        email: booking.email,
        phone: booking.phone,
      },
    });
  } catch (err) {
    console.error(`[payments] ${reference} could not start`, err);
    /*
     * TEMPORARY DIAGNOSTIC — remove once the card flow is confirmed working.
     *
     * The provider's own reason, truncated. A refused order is otherwise only
     * visible in the platform's logs, and a wrong enum in the order payload
     * looks identical from out here to bad credentials or a currency the
     * account cannot take. This is a documented PayPal issue code, not
     * anything of ours, and the site has no real customers yet — but it is
     * still more than a stranger needs, so it goes once it has done its job.
     */
    return NextResponse.json(
      {
        error: "We couldn't open the payment page. Please try again.",
        detail: String(err?.message ?? "").slice(0, 200),
      },
      { status: 502, headers: { "Cache-Control": "no-store" } }
    );
  }

  let payment;
  try {
    payment = await createPayment({
      reference,
      orderId,
      provider: started.provider,
      environment: started.environment,
      amountCents,
      requestedTotal: started.requestedTotal,
      currency,
      // PayPal's own order id. Without it the return route cannot find this
      // record, which is why the failure below refuses rather than redirects.
      providerRef: started.providerRef,
    });
  } catch (err) {
    console.error(`[payments] ${reference} session not recorded`, err);
    // Refuse rather than send the guest to a page whose result we could not
    // match back to anything.
    return bad("We couldn't start that payment. Please try again.", 500);
  }

  /*
   * Alert the owner at INITIATION, not only on settlement.
   *
   * This mattered more under WiPay, where approving on the hosted page WAS the
   * charge, so a closed tab could leave real money unrecorded. Under PayPal it
   * cannot: `intent: CAPTURE` means nothing is taken until our return route
   * captures, and a guest who never comes back has not paid.
   *
   * It is kept for the one case that survives — a capture that throws, where
   * the charge may or may not have gone through and the attempt is left
   * `initiated` on purpose. Then this alert plus its order_id is what tells the
   * owner which transaction to look up in the PayPal dashboard.
   *
   * The cost is an email per abandoned attempt. If that becomes noise, move the
   * send into the return route's catch rather than dropping it: the ambiguous
   * case is the only one worth an email, and it is also the only one nobody
   * finds out about any other way.
   *
   * Never allowed to fail the request — a missed email beats a lost payment.
   */
  sendPaymentAlert({
    reference,
    orderId,
    amountCents,
    currency,
    provider: started.provider,
    environment: started.environment,
    name: booking.name,
    tourTitle: booking.tourTitle,
    date: booking.date,
  }).catch((err) => console.error("[payments] initiation alert failed", err));

  return NextResponse.json(
    {
      redirectUrl: started.redirectUrl,
      /*
       * PayPal's own order id, for the inline buttons: the SDK's `createOrder`
       * hands this back and the popup opens against an order this server
       * already created and priced. It is not a secret — the guest is about to
       * be shown it either way — and it confers nothing on its own, because
       * settlement looks it up against our record and takes every amount from
       * there.
       */
      providerRef: started.providerRef,
      paymentId: payment.id,
      reference,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
