/**
 * Firebase Admin bootstrap — server-only.
 *
 * The Admin SDK bypasses Firestore rules entirely, which is exactly why
 * `firestore.rules` can deny every client request: nothing in a browser ever
 * touches the database, so guest names, emails, phone numbers and flight
 * details are unreadable from the outside.
 *
 * Never import this from a client component. It reads a private key.
 */
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const APP_NAME = "ppp-admin";

/**
 * Accepts the service account as raw JSON or base64. Vercel's env UI mangles
 * multi-line values, so the private key commonly arrives with literal `\n`
 * two-character sequences instead of real newlines — those have to be put back
 * or `cert()` throws an opaque "Invalid PEM formatted message".
 */
function parseServiceAccount(raw) {
  if (!raw) return null;

  let text = raw.trim().replace(/^['"]|['"]$/g, "");
  if (!text.startsWith("{")) {
    try {
      text = Buffer.from(text, "base64").toString("utf8");
    } catch {
      return null;
    }
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }

  if (typeof parsed.private_key === "string") {
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  }

  const complete =
    parsed.project_id && parsed.client_email && parsed.private_key;
  return complete ? parsed : null;
}

/** True when a usable service account is present in the environment. */
export function isAdminConfigured() {
  return parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) !== null;
}

let cached;
let initError = null;

/**
 * Why the last `getAdminDb()` returned null, when it was not simply absent.
 *
 * Server-only, and deliberately not surfaced to a browser verbatim — it can
 * quote a PEM parse failure. Callers say "missing or rejected" and log this.
 */
export function adminInitError() {
  return initError;
}

/**
 * @returns {import('firebase-admin/firestore').Firestore|null} null when no
 *   service account is configured OR when the one present cannot be used, so
 *   callers can degrade instead of crashing.
 *
 * `parseServiceAccount` above is careful, but being careful about the JSON is
 * not enough: `cert()` validates the private key and throws "Invalid PEM
 * formatted message" on a key whose newlines did not survive the environment,
 * and `initializeApp` can throw on its own. Those throws used to escape this
 * function, and from here they escaped `requireAdmin` and then the API route —
 * whose try/catch begins *after* the auth call — so Next answered with an HTML
 * 500 carrying no `error` field and the console could only say "that didn't
 * work". A configuration problem has to name itself.
 */
export function getAdminDb() {
  if (cached !== undefined) return cached;

  const serviceAccount = parseServiceAccount(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  );
  if (!serviceAccount) {
    initError = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
      ? "FIREBASE_SERVICE_ACCOUNT_KEY is set but is not a complete service account (needs project_id, client_email and private_key, as raw JSON or base64)."
      : "FIREBASE_SERVICE_ACCOUNT_KEY is not set.";
    cached = null;
    return cached;
  }

  try {
    const existing = getApps().find((a) => a.name === APP_NAME);
    const app =
      existing ??
      initializeApp(
        {
          credential: cert(serviceAccount),
          projectId: serviceAccount.project_id,
        },
        APP_NAME
      );

    cached = getFirestore(app);
    initError = null;
  } catch (err) {
    initError = `Firebase Admin refused the service account: ${err?.message ?? err}`;
    console.error("[firebase-admin] init failed", err);
    cached = null;
  }

  return cached;
}
