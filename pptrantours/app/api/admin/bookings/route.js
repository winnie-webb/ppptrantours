import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Who is allowed in. Checked on the server against the *verified* token, not
 * against anything the page claims — hiding the UI is not access control.
 */
function allowedEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

async function requireAdmin(request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return { error: "Not signed in.", status: 401 };

  const allow = allowedEmails();
  if (allow.length === 0) {
    // Fail closed. An empty allowlist must lock everyone out, never let
    // everyone in — this is the difference between a bug and a data breach.
    return { error: "No admin accounts are configured.", status: 503 };
  }

  const { getAuth } = await import("firebase-admin/auth");
  const { getApps } = await import("firebase-admin/app");

  // getAdminDb() initialises the named app; call it first so getAuth() finds one.
  if (!getAdminDb()) return { error: "Server is not configured.", status: 503 };
  const app = getApps().find((a) => a.name === "ppp-admin");

  let decoded;
  try {
    decoded = await getAuth(app).verifyIdToken(token);
  } catch {
    return { error: "That sign-in is not valid.", status: 401 };
  }

  const email = (decoded.email ?? "").toLowerCase();
  if (!decoded.email_verified || !allow.includes(email)) {
    return { error: "That account is not permitted.", status: 403 };
  }

  return { email };
}

export async function GET(request) {
  const auth = await requireAdmin(request);
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const db = getAdminDb();

  try {
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
        // Firestore Timestamps do not survive JSON.stringify intact.
        createdAt: d.createdAt?.toDate?.().toISOString() ?? null,
      };
    });

    return NextResponse.json({ bookings });
  } catch (err) {
    console.error("[admin] booking read failed", err);
    return NextResponse.json(
      { error: "Could not load bookings." },
      { status: 500 }
    );
  }
}
