import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/admin-auth";
import { normaliseDriver } from "@/lib/drivers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ID = /^[A-Za-z0-9]{10,40}$/;

const bad = (error, status) => NextResponse.json({ error }, { status });

/**
 * Update a driver: new papers, a new vehicle, or marking them unavailable.
 *
 * The whole record is re-validated rather than patched field by field, so
 * the console always sends the full form and the stored record can never be
 * half-valid. Bookings already assigned keep their own snapshot of the
 * driver (see driverSnapshot), so this never rewrites history.
 */
export async function PATCH(request, { params }) {
  const auth = await requireAdmin(request);
  if (auth.error) return bad(auth.error, auth.status);

  const { id } = await params;
  if (!ID.test(id)) return bad("Not a valid driver.", 400);

  let body;
  try {
    body = await request.json();
  } catch {
    return bad("Malformed request.", 400);
  }

  const result = normaliseDriver(body);
  if (result.error) return bad(result.error, 422);

  const db = getAdminDb();
  const { FieldValue } = await import("firebase-admin/firestore");
  const ref = db.collection("drivers").doc(id);

  try {
    const snap = await ref.get();
    if (!snap.exists) return bad("No such driver.", 404);
    await ref.update({
      ...result.value,
      updatedBy: auth.email,
      updatedAt: FieldValue.serverTimestamp(),
    });
  } catch (err) {
    console.error(`[admin] driver ${id} update failed`, err);
    return bad("Could not save that driver.", 500);
  }

  return NextResponse.json({ ok: true });
}
