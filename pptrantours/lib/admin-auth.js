/**
 * Admin gate for the /api/admin/* routes. Server-only.
 *
 * Extracted from app/api/admin/bookings/route.js because the status-transition
 * and manual-payment routes need the identical check, and an access check that
 * exists in two copies is an access check that will diverge.
 *
 * Everything is verified against the decoded token, never against anything the
 * page claims. Hiding the UI is not access control.
 */
import { getAdminDb } from "@/lib/firebase-admin";

function allowedEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * @returns {Promise<{email: string} | {error: string, status: number}>}
 */
export async function requireAdmin(request) {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return { error: "Not signed in.", status: 401 };

  const allow = allowedEmails();
  if (allow.length === 0) {
    // Fail closed. An empty allowlist must lock everyone out, never let
    // everyone in — that is the difference between a bug and a data breach.
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
