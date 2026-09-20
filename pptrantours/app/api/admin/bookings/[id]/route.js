import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/admin-auth";
import { paymentsForBooking } from "@/lib/payments/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Legal status moves, enforced on the server.
 *
 * The UI only ever offers what is valid, but the UI is not the rule — a stale
 * tab or a hand-rolled request must not be able to walk a completed booking
 * back to new.
 *
 * `status` tracks the operational life of the booking and is entirely separate
 * from `payment.state`. Paying does not confirm a booking, and confirming does
 * not collect money.
 *
 * Priced bookings now START at `confirmed` — see app/api/bookings/route.js. So
 * `new` is reached only by a quote request or an enquiry, which is exactly what
 * it should have meant all along. It stays in the table both for those and for
 * records written before the change; removing it would make every old booking
 * un-advanceable in /admin for no gain.
 */
const TRANSITIONS = {
  new: ["confirmed", "cancelled"],
  confirmed: ["assigned", "cancelled"],
  assigned: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

const REF = /^PPP-[A-Z2-9]{6}$/;

const bad = (error, status) => NextResponse.json({ error }, { status });

/** Booking detail, including its payment history. Used by the expanded row. */
export async function GET(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) return bad(auth.error, auth.status);

  const { id } = await params;
  if (!REF.test(id)) return bad("Not a valid reference.", 400);

  const db = getAdminDb();
  const snap = await db.collection("bookings").doc(id).get();
  if (!snap.exists) return bad("No such booking.", 404);

  const d = snap.data();
  return NextResponse.json({
    booking: {
      id: snap.id,
      ...d,
      lookupToken: undefined,
      createdAt: d.createdAt?.toDate?.().toISOString() ?? null,
    },
    payments: await paymentsForBooking(id),
  });
}

/** Move a booking's status. */
export async function PATCH(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) return bad(auth.error, auth.status);

  const { id } = await params;
  if (!REF.test(id)) return bad("Not a valid reference.", 400);

  let body;
  try {
    body = await request.json();
  } catch {
    return bad("Malformed request.", 400);
  }

  const next = String(body.status ?? "");
  if (!Object.keys(TRANSITIONS).includes(next)) {
    return bad("Not a status we recognise.", 400);
  }

  const db = getAdminDb();
  const { FieldValue } = await import("firebase-admin/firestore");
  const ref = db.collection("bookings").doc(id);

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("not-found");

      const current = snap.data().status ?? "new";
      if (current === next) return; // idempotent, not an error
      if (!TRANSITIONS[current]?.includes(next)) {
        throw new Error(`illegal:${current}->${next}`);
      }

      tx.update(ref, {
        status: next,
        // Who did what, when. The only record of an operational decision.
        history: FieldValue.arrayUnion({
          status: next,
          by: auth.email,
          at: new Date().toISOString(),
        }),
      });
    });
  } catch (err) {
    const msg = String(err?.message ?? "");
    if (msg === "not-found") return bad("No such booking.", 404);
    if (msg.startsWith("illegal:")) {
      return bad(`That move is not allowed (${msg.slice(8)}).`, 409);
    }
    console.error(`[admin] ${id} status change failed`, err);
    return bad("Could not update that booking.", 500);
  }

  return NextResponse.json({ ok: true, status: next });
}

/**
 * Record a payment taken outside the website.
 *
 * Not optional, for two reasons. Most of PPP's money still arrives as cash in
 * the vehicle, and this is the only way that reaches the books. And a capture
 * that times out leaves an attempt that may or may not have charged — the
 * owner settles which in the PayPal dashboard and enters it here, which is the
 * rescue path for the one ambiguous case the online flow has.
 *
 * `verifiedBy` records which admin vouched for it, since unlike a hosted-page
 * payment there is no cryptographic proof behind this number.
 */
export async function POST(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) return bad(auth.error, auth.status);

  const { id } = await params;
  if (!REF.test(id)) return bad("Not a valid reference.", 400);

  let body;
  try {
    body = await request.json();
  } catch {
    return bad("Malformed request.", 400);
  }

  const amountCents = Number.parseInt(body.amountCents, 10);
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return bad("An amount is required.", 422);
  }

  /*
   * `wipay-manual` was renamed to `paypal-manual` when WiPay was removed, but
   * it is still ACCEPTED: records written before the swap carry it, and
   * rejecting the old value would make those bookings un-editable in /admin
   * for no gain. New entries use the new name.
   */
  const method = ["cash", "paypal-manual", "wipay-manual", "bank"].includes(
    body.method
  )
    ? body.method
    : null;
  if (!method) return bad("Not a payment method we recognise.", 400);

  const db = getAdminDb();
  const { FieldValue } = await import("firebase-admin/firestore");
  const bookingRef = db.collection("bookings").doc(id);
  const paymentRef = db.collection("payments").doc();

  try {
    await db.runTransaction(async (tx) => {
      const snap = await tx.get(bookingRef);
      if (!snap.exists) throw new Error("not-found");

      const booking = snap.data();
      const payableCents = booking.payment?.payableCents ?? 0;
      const paidCents = (booking.payment?.paidCents ?? 0) + amountCents;

      tx.set(paymentRef, {
        orderId: `${id}-manual`,
        reference: id,
        provider: "manual",
        environment: "manual",
        amountCents,
        requestedTotal: (amountCents / 100).toFixed(2),
        currency: booking.payment?.currency ?? "USD",
        state: "paid",
        providerTxnId: String(body.txnId ?? "").slice(0, 120) || null,
        providerStatus: method,
        hashVerified: false,
        forgedAttempts: 0,
        returnPayload: null,
        note: String(body.note ?? "").slice(0, 500),
        verifiedBy: auth.email,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        settledAt: FieldValue.serverTimestamp(),
      });

      tx.update(bookingRef, {
        "payment.paidCents": paidCents,
        "payment.state":
          payableCents > 0 && paidCents < payableCents ? "part-paid" : "paid",
        "payment.lastPaymentId": paymentRef.id,
        "payment.updatedAt": FieldValue.serverTimestamp(),
        settlement: method === "cash" ? "cash-on-day" : "online",
      });
    });
  } catch (err) {
    if (String(err?.message) === "not-found") {
      return bad("No such booking.", 404);
    }
    console.error(`[admin] ${id} manual payment failed`, err);
    return bad("Could not record that payment.", 500);
  }

  return NextResponse.json({ ok: true, paymentId: paymentRef.id });
}
