import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/admin-auth";
import { sendReviewRequest } from "@/lib/notify";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REF = /^PPP-[A-Z2-9]{6}$/;

const bad = (error, status) => NextResponse.json({ error }, { status });

/**
 * Email the guest the after-the-trip thank-you with the Google review link.
 *
 * Completed bookings only: asking before the trip is the one thing Google's
 * review policy is clear about. Sending twice is allowed — a guest may ask for
 * it again — but the row shows when it last went, so it is never by accident.
 */
export async function POST(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) return bad(auth.error, auth.status);

  const { id } = await params;
  if (!REF.test(id)) return bad("Not a valid reference.", 400);

  const db = getAdminDb();
  const ref = db.collection("bookings").doc(id);
  const snap = await ref.get();
  if (!snap.exists) return bad("No such booking.", 404);

  const booking = snap.data();
  if (booking.status !== "completed") {
    return bad("Mark the trip done before asking for a review.", 409);
  }
  if (!booking.email) return bad("This booking has no email address.", 422);

  const result = await sendReviewRequest(booking);
  if (!result.sent) {
    console.error(`[admin] ${id} review request not sent`, result.reason);
    return bad("The email could not be sent. Try WhatsApp instead.", 502);
  }

  const at = new Date().toISOString();
  await ref.update({ reviewRequest: { at, by: auth.email } });

  return NextResponse.json({ ok: true, at });
}
