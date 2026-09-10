import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/admin-auth";
import { sweepAbandoned, paymentsForBooking } from "@/lib/payments/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
 * requireAdmin now lives in lib/admin-auth.js. It moved because the status
 * transition and manual-payment routes need the identical check, and an access
 * check that exists in two copies is one that will diverge.
 */

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const db = getAdminDb();

  try {
    // The owner opening /admin is a frequent enough trigger to retire payments
    // the guest walked away from, so this needs no scheduler. Never allowed to
    // fail the read.
    await sweepAbandoned(20).catch((err) =>
      console.error("[payments] sweep failed", err)
    );

    const snap = await db
      .collection("bookings")
      .orderBy("createdAt", "desc")
      .limit(200)
      .get();

    const bookings = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        ...d,
        // Never send these to the browser. `lookupToken` is what authorises the
        // guest's own result page, and `userAgent` is noise the console does
        // not display.
        lookupToken: undefined,
        userAgent: undefined,
        // Firestore Timestamps do not survive JSON.stringify intact.
        createdAt: d.createdAt?.toDate?.().toISOString() ?? null,
        payment: d.payment
          ? {
              ...d.payment,
              updatedAt: d.payment.updatedAt?.toDate?.().toISOString() ?? null,
            }
          : null,
      };
    });

    /*
     * The two states that cost real money if they are ignored.
     *
     * Paid-but-still-new is the important one: the guest has been charged and
     * nobody has confirmed the date yet, so every hour there is refund risk.
     * It is a normal state — paying deliberately does not confirm a booking —
     * which is exactly why it needs surfacing rather than hiding.
     */
    const attention = {
      paidUnconfirmed: bookings
        .filter(
          (b) =>
            (b.payment?.state === "paid" || b.payment?.state === "part-paid") &&
            b.status === "new"
        )
        .map((b) => b.reference),
      paymentPending: bookings
        .filter((b) => b.payment?.state === "pending")
        .map((b) => b.reference),
    };

    return NextResponse.json({ bookings, attention });
  } catch (err) {
    console.error("[admin] booking read failed", err);
    return NextResponse.json(
      { error: "Could not load bookings." },
      { status: 500 }
    );
  }
}
