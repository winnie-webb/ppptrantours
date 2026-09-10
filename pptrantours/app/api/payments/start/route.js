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
  if (!chooseProvider(currency)) {
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
  const returnUrl = `${site.url}/api/payments/wipay/return`;

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
    return bad("We couldn't open the payment page. Please try again.", 502);
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
   * This is the real safety net for the missing webhook. WiPay tells us the
   * outcome only through the guest's browser, so a closed tab or a dropped
   * mobile connection can leave a real charge with no record on our side. If
   * this alert arrives and nothing follows it, the owner has a specific
   * order_id to search in the WiPay dashboard.
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
    { redirectUrl: started.redirectUrl, paymentId: payment.id, reference },
    { headers: { "Cache-Control": "no-store" } }
  );
}
