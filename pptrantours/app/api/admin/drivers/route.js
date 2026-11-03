import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/admin-auth";
import { normaliseDriver } from "@/lib/drivers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/*
 * The driver roster. Admin-only, like every other /api/admin route, and
 * written with the Admin SDK so `firestore.rules` can keep denying every
 * browser request: drivers' phone numbers are no more public than guests'.
 *
 * There is no DELETE. A driver who stops working for PPP is marked inactive,
 * because past bookings still name them and the record of who drove which
 * guest has to survive.
 */

const bad = (error, status) => NextResponse.json({ error }, { status });

const serialise = (doc) => {
  const d = doc.data();
  return {
    id: doc.id,
    ...d,
    createdAt: d.createdAt?.toDate?.().toISOString() ?? null,
    updatedAt: d.updatedAt?.toDate?.().toISOString() ?? null,
  };
};

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) return bad(auth.error, auth.status);

  try {
    const snap = await getAdminDb().collection("drivers").orderBy("name").get();
    return NextResponse.json({ drivers: snap.docs.map(serialise) });
  } catch (err) {
    console.error("[admin] driver read failed", err);
    return bad("Could not load drivers.", 500);
  }
}

export async function POST(request) {
  const auth = await requireAdmin(request);
  if (auth.error) return bad(auth.error, auth.status);

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

  try {
    const ref = await db.collection("drivers").add({
      ...result.value,
      createdBy: auth.email,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    return NextResponse.json({ ok: true, id: ref.id });
  } catch (err) {
    console.error("[admin] driver create failed", err);
    return bad("Could not save that driver.", 500);
  }
}
