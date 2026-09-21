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
import { getAdminDb, adminInitError } from "@/lib/firebase-admin";

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

  /*
   * These two imports are the reason this console returned a bare 500 for its
   * whole life, and the try/catch is not decoration.
   *
   * `firebase-admin/auth` pulls jwks-rsa, which `require()`s jose. jose 6 is
   * ESM-only, so on a runtime without `require(esm)` the import throws
   * ERR_REQUIRE_ESM. That throw happened here, outside any handler and before
   * the API route's own try block, so Next answered with its HTML 500 carrying
   * no `error` field and the page could only say "that didn't work". The
   * underlying clash is pinned away in package.json `overrides`, but a module
   * that fails to load must name itself rather than vanish.
   */
  let getAuth;
  let getApps;
  try {
    ({ getAuth } = await import("firebase-admin/auth"));
    ({ getApps } = await import("firebase-admin/app"));
  } catch (err) {
    console.error("[admin-auth] firebase-admin failed to load", err);
    return {
      error: "The server could not load its authentication library.",
      status: 503,
    };
  }

  // getAdminDb() initialises the named app; call it first so getAuth() finds one.
  if (!getAdminDb()) {
    // Logged in full, reported narrowly: this can quote a PEM parse failure.
    console.error("[admin-auth] no admin database:", adminInitError());
    return {
      error:
        "The server's database credentials are missing or were rejected. Check FIREBASE_SERVICE_ACCOUNT_KEY.",
      status: 503,
    };
  }
  const app = getApps().find((a) => a.name === "ppp-admin");

  let decoded;
  try {
    decoded = await getAuth(app).verifyIdToken(token);
  } catch {
    return { error: "That sign-in is not valid.", status: 401 };
  }

  const email = (decoded.email ?? "").toLowerCase();
  if (!allow.includes(email)) {
    return { error: "That account is not permitted.", status: 403 };
  }

  /*
   * `email_verified` is demanded of federated providers, and not of a password.
   *
   * The check exists because a federated provider can assert an address it has
   * not proven the user owns, and the allowlist is keyed on the address — so an
   * unverified Google claim to donovan@… would be enough to walk in.
   *
   * A password account cannot do that. It is created by us, in the Firebase
   * console, for an address already on the allowlist, and the thing being
   * proven at sign-in is possession of the password rather than of the mailbox.
   * Firebase marks such accounts `emailVerified: false` until someone clicks a
   * verification link, so requiring the flag here would lock out every account
   * the console can create — which is what this route is for.
   */
  const provider = decoded.firebase?.sign_in_provider ?? "";
  if (provider !== "password" && !decoded.email_verified) {
    return { error: "That account is not permitted.", status: 403 };
  }

  return { email };
}
