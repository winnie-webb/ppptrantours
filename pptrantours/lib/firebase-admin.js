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

/**
 * @returns {import('firebase-admin/firestore').Firestore|null} null when no
 *   service account is configured, so callers can degrade instead of crashing.
 */
export function getAdminDb() {
  if (cached !== undefined) return cached;

  const serviceAccount = parseServiceAccount(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY
  );
  if (!serviceAccount) {
    cached = null;
    return cached;
  }

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
  return cached;
}
