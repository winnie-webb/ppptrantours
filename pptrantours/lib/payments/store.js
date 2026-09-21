/**
 * Every Firestore read and write for payments. Server-only.
 *
 * `payments` is a top-level collection, not a subcollection under each booking.
 * Several attempts per booking are normal — abandon then retry — and the
 * abandonment sweep queries across all of them, which a subcollection would
 * force into a collection-group query for no gain.
 *
 * EVERY QUERY HERE AVOIDS COMPOSITE INDEXES, deliberately. Composite indexes
 * require Firebase billing to be enabled and this project is on the free plan,
 * so an equality filter combined with a range or an orderBy on a different
 * field would fail at runtime with FAILED_PRECONDITION. Multiple equality
 * filters are fine — Firestore merges single-field indexes for those — so the
 * pattern throughout is: filter by equality in the query, then narrow or sort
 * in memory. The sets involved are a handful of documents, so that costs
 * nothing; if this ever grows, enabling billing and adding the indexes is the
 * fix, not restructuring the data.
 *
 * `firestore.rules` denies every client request, so nothing here is reachable
 * from a browser. That is the whole reason guest contact details and payment
 * references are safe to store in the first place.
 */
import crypto from "node:crypto";
import { getAdminDb } from "@/lib/firebase-admin";

const PAYMENTS = "payments";
const BOOKINGS = "bookings";

/** How long a started-but-unfinished payment is left alone before sweeping. */
const ABANDON_AFTER_MS = 45 * 60 * 1000;

/**
 * `order_id` for the provider, and our own lookup key.
 *
 * The reference is embedded so a human can paste it into the WiPay dashboard
 * and find the transaction — which matters far more than it sounds, because
 * there is no webhook and a lost redirect leaves that dashboard as the only
 * record. Capped at 16 characters for FGB: `PPP-XXXXXX` is 10, the dash and
 * four hex take it to 15.
 */
export function makeOrderId(reference) {
  return `${reference}-${crypto.randomBytes(2).toString("hex")}`;
}

/** Opaque per-booking token, so a result page cannot be opened by guessing. */
export function makeLookupToken() {
  return crypto.randomBytes(16).toString("hex");
}

/**
 * Derived, never set directly: a paid amount that has reached the payable
 * amount is paid, anything between is part-paid.
 */
function summarise({ payableCents, paidCents }) {
  if (paidCents <= 0) return "unpaid";
  if (paidCents >= payableCents) return "paid";
  return "part-paid";
}

/**
 * The booking-level payment state after an attempt reaches `outcome`.
 *
 * Money already banked wins over the latest attempt's verdict: a guest whose
 * second card declines is still part-paid, not failed, and showing "failed" on
 * a booking that holds $170 is how a driver gets told to collect twice.
 *
 * `pending` is its own state and is NOT folded into either paid or unpaid.
 * PayPal returns it when it has the money but is holding it — an eCheck
 * clearing, or a manual review — and both of the neighbouring answers are
 * wrong: "paid" sends a driver out against money that may never arrive,
 * "unpaid" invites a second charge. It resolves from the PayPal dashboard.
 */
function bookingPaymentState({ outcome, payableCents, paidCents }) {
  if (paidCents > 0) return summarise({ payableCents, paidCents });
  if (outcome === "pending") return "pending";
  if (outcome === "failed" || outcome === "invalid") return "failed";
  return "unpaid";
}

export async function getBooking(reference) {
  const db = getAdminDb();
  if (!db) return null;
  const snap = await db.collection(BOOKINGS).doc(reference).get();
  return snap.exists ? { id: snap.id, ...snap.data() } : null;
}

/** Records an attempt before the guest leaves for the hosted page. */
export async function createPayment({
  reference,
  orderId,
  provider,
  environment,
  amountCents,
  requestedTotal,
  currency,
  providerRef = null,
}) {
  const db = getAdminDb();
  if (!db) throw new Error("no-db");

  const { FieldValue } = await import("firebase-admin/firestore");
  const ref = db.collection(PAYMENTS).doc();

  await ref.set({
    orderId,
    /*
     * The provider's own id for this attempt — PayPal's order id.
     *
     * Written at creation, BEFORE the guest leaves, because it is the lookup
     * key on the way back: PayPal returns its id and nothing of ours. A record
     * without it cannot be matched to a return, so a failure to write here must
     * fail the whole start — which it does, since the start route refuses
     * rather than redirect when this throws.
     */
    providerRef,
    reference,
    provider,
    environment,
    amountCents,
    // The exact string sent as `total`, kept because the response hash is
    // computed over it. Reformatting it at verification time is how this
    // integration breaks.
    requestedTotal,
    currency,
    state: "initiated",
    providerTxnId: null,
    providerStatus: null,
    hashVerified: false,
    forgedAttempts: 0,
    returnPayload: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    settledAt: null,
  });

  // Mark the booking as awaiting a payment so /admin can see it mid-flight.
  await db.collection(BOOKINGS).doc(reference).update({
    "payment.state": "pending",
    "payment.provider": provider,
    "payment.lastPaymentId": ref.id,
    "payment.updatedAt": FieldValue.serverTimestamp(),
  });

  return { id: ref.id };
}

export async function findPaymentByOrderId(orderId) {
  const db = getAdminDb();
  if (!db) return null;
  const snap = await db
    .collection(PAYMENTS)
    .where("orderId", "==", orderId)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() };
}

/**
 * Find an attempt by the PROVIDER's id for it — PayPal's order id.
 *
 * A single equality filter, so it rides Firestore's automatic single-field
 * index and needs no composite index. See the note at the top of this file for
 * why that constraint is being respected everywhere.
 */
export async function findPaymentByProviderRef(providerRef) {
  const db = getAdminDb();
  if (!db || !providerRef) return null;
  const snap = await db
    .collection(PAYMENTS)
    .where("providerRef", "==", providerRef)
    .limit(1)
    .get();
  if (snap.empty) return null;
  const doc = snap.docs[0];
  return { id: doc.id, ...doc.data() };
}

/**
 * Move a payment to a terminal state and recompute the booking summary.
 *
 * All of it inside a transaction that re-reads the state, because the return
 * route can be hit twice — a guest refreshing the tab is the common case. The
 * `initiated` guard is what makes that idempotent, and it is why `paidCents` is
 * assigned rather than incremented: `FieldValue.increment` is not idempotent
 * under a retried transaction, so a retry would double the amount.
 *
 * @returns {Promise<{applied: boolean, alreadySettled: boolean}>}
 */
export async function settlePayment({
  paymentId,
  outcome,
  providerTxnId,
  providerStatus,
  hashVerified,
  returnPayload,
}) {
  const db = getAdminDb();
  if (!db) throw new Error("no-db");
  const { FieldValue } = await import("firebase-admin/firestore");

  const paymentRef = db.collection(PAYMENTS).doc(paymentId);

  return db.runTransaction(async (tx) => {
    const paySnap = await tx.get(paymentRef);
    if (!paySnap.exists) return { applied: false, alreadySettled: false };

    const pay = paySnap.data();
    if (pay.state !== "initiated") {
      // Already terminal. Write nothing — this is the refresh path.
      return { applied: false, alreadySettled: true };
    }

    const bookingRef = db.collection(BOOKINGS).doc(pay.reference);
    const bookSnap = await tx.get(bookingRef);

    tx.update(paymentRef, {
      state: outcome,
      providerTxnId: providerTxnId ?? null,
      providerStatus: providerStatus ?? null,
      hashVerified: Boolean(hashVerified),
      returnPayload: returnPayload ?? null,
      updatedAt: FieldValue.serverTimestamp(),
      settledAt: FieldValue.serverTimestamp(),
    });

    if (bookSnap.exists) {
      const booking = bookSnap.data();
      const payableCents =
        booking.payment?.payableCents ?? pay.amountCents ?? 0;
      const paidCents =
        outcome === "paid"
          ? (booking.payment?.paidCents ?? 0) + pay.amountCents
          : (booking.payment?.paidCents ?? 0);

      tx.update(bookingRef, {
        /*
         * `status` is deliberately NOT touched — but no longer for the reason
         * that used to be written here.
         *
         * A priced booking is already `confirmed` when it is created (see
         * app/api/bookings/route.js), so there is nothing for a payment to
         * promote. Paying is a separate axis: it settles the money, not the
         * booking. The one case that still reaches here as `new` is a quote
         * request or an enquiry, and paying against one of those must not
         * confirm a date nobody has agreed a price for — which is exactly what
         * the admin attention band surfaces.
         */
        "payment.state": bookingPaymentState({
          outcome,
          payableCents,
          paidCents,
        }),
        "payment.paidCents": paidCents,
        "payment.provider": pay.provider,
        "payment.lastPaymentId": paymentId,
        "payment.updatedAt": FieldValue.serverTimestamp(),
        ...(outcome === "paid" ? { settlement: "online" } : {}),
      });
    }

    return { applied: true, alreadySettled: false };
  });
}

/** Bump the forgery counter on a payment whose return failed verification. */
export async function recordForgedAttempt(paymentId) {
  const db = getAdminDb();
  if (!db) return;
  const { FieldValue } = await import("firebase-admin/firestore");
  await db
    .collection(PAYMENTS)
    .doc(paymentId)
    .update({
      forgedAttempts: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });
}

/** How many attempts are already in flight for a booking. */
export async function countInitiated(reference) {
  const db = getAdminDb();
  if (!db) return 0;
  const snap = await db
    .collection(PAYMENTS)
    .where("reference", "==", reference)
    .where("state", "==", "initiated")
    .get();
  return snap.size;
}

export async function hasPaid(reference) {
  const db = getAdminDb();
  if (!db) return false;
  const snap = await db
    .collection(PAYMENTS)
    .where("reference", "==", reference)
    .where("state", "==", "paid")
    .limit(1)
    .get();
  return !snap.empty;
}

/**
 * Sweep payments the guest walked away from.
 *
 * Called opportunistically rather than on a cron: the owner opening /admin, or
 * anyone starting a payment, is a frequent enough trigger at this volume and it
 * needs no scheduler. Capped per call so it can never become the slow part of a
 * request.
 *
 * Abandoned records are NEVER deleted. One that turns out to have been charged
 * is precisely the evidence needed to reconcile a lost redirect by hand.
 */
export async function sweepAbandoned(limit = 20) {
  const db = getAdminDb();
  if (!db) return 0;
  const { FieldValue } = await import("firebase-admin/firestore");

  /*
   * Equality filter only, with the age test done in memory.
   *
   * `where(state).where(createdAt, "<")` would be the natural query, but an
   * equality plus a range on a different field needs a composite index, and
   * composite indexes require Firebase billing to be enabled — this project is
   * on the free plan. Multiple equality filters are fine, because Firestore
   * merges single-field indexes for those.
   *
   * The cost of doing it this way is bounded and small: `initiated` is a
   * transient state that a booking leaves within minutes, so the set being
   * scanned is a handful of documents, and it is capped anyway.
   */
  const cutoffMs = Date.now() - ABANDON_AFTER_MS;
  const snap = await db
    .collection(PAYMENTS)
    .where("state", "==", "initiated")
    .limit(Math.max(limit * 5, 50))
    .get();

  const stale = snap.docs
    .filter((d) => {
      const created = d.data().createdAt?.toMillis?.();
      // A doc whose serverTimestamp has not materialised yet is brand new.
      return typeof created === "number" && created < cutoffMs;
    })
    .slice(0, limit);

  if (stale.length === 0) return 0;

  const batch = db.batch();
  const touched = new Set();

  for (const doc of stale) {
    batch.update(doc.ref, {
      state: "abandoned",
      updatedAt: FieldValue.serverTimestamp(),
    });
    const reference = doc.data().reference;
    if (reference && !touched.has(reference)) {
      touched.add(reference);
      batch.update(db.collection(BOOKINGS).doc(reference), {
        // Only clears the "pending" flag. A booking that also holds a genuine
        // paid attempt keeps its paidCents, and the next read recomputes.
        "payment.state": "unpaid",
        "payment.updatedAt": FieldValue.serverTimestamp(),
      });
    }
  }

  await batch.commit();
  return stale.length;
}

/** Payment history for one booking, newest first. Used by /admin. */
export async function paymentsForBooking(reference) {
  const db = getAdminDb();
  if (!db) return [];
  // No orderBy: an equality filter combined with an orderBy on a different
  // field needs a composite index too. A booking has a handful of payment
  // attempts at most, so sorting them here costs nothing.
  const snap = await db
    .collection(PAYMENTS)
    .where("reference", "==", reference)
    .limit(20)
    .get();

  return snap.docs
    .map((d) => ({
      id: d.id,
      ...d.data(),
      createdAt: d.data().createdAt?.toDate?.().toISOString() ?? null,
      settledAt: d.data().settledAt?.toDate?.().toISOString() ?? null,
    }))
    .sort((a, b) => String(b.createdAt ?? "").localeCompare(String(a.createdAt ?? "")));
}
