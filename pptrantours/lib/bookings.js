/**
 * Booking submission, from the browser.
 *
 * This used to call `addDoc` straight from the page. It no longer does: writes
 * go to `POST /api/bookings`, which re-prices the booking and stores it with
 * the Admin SDK. That is what lets `firestore.rules` deny every client request
 * — guest contact details are never reachable from a browser, and there is no
 * permissive create rule to get subtly wrong.
 *
 * The guest is never left stranded. If the route is unreachable, or no service
 * account is configured yet, they still get a reference and a pre-filled
 * WhatsApp message and `persisted` comes back false so the UI can say so.
 */
import { buildWhatsAppMessage, makeReference } from "./booking-shared";

/**
 * @returns {Promise<{reference: string, persisted: boolean, paymentOptions: object|null, whatsappUrl: string}>}
 */
export async function createBooking(booking, { idempotencyKey } = {}) {
  let reference = null;
  let persisted = false;
  let paymentOptions = null;

  try {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        /*
         * Makes a double-click, a retry after a timeout and a back-button
         * resubmit all resolve to one booking. The server claims this key
         * atomically and replays the original reference on a repeat, so the
         * guest never ends up with two bookings — or, now that payment exists,
         * two payable ones.
         */
        ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
      },
      body: JSON.stringify(booking),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      // 4xx means the guest can fix it (bad email, stale tour) — surface it.
      // 5xx is ours, and falls through to the WhatsApp handoff below.
      if (res.status >= 400 && res.status < 500 && data.error) {
        throw new Error(data.error);
      }
      throw new Error("save-failed");
    }

    reference = data.reference ?? null;
    persisted = Boolean(data.persisted);
    paymentOptions = data.paymentOptions ?? null;
  } catch (err) {
    // A validation message is worth showing; anything else, we degrade quietly
    // rather than telling the guest their booking vanished.
    if (err instanceof Error && err.message !== "save-failed") throw err;
  }

  if (!reference) reference = makeReference();

  return {
    reference,
    persisted,
    paymentOptions,
    whatsappUrl: buildWhatsAppMessage({ ...booking, reference }),
  };
}

export { makeReference, buildWhatsAppMessage };

/**
 * Ask the server to create a payment for this booking.
 *
 * No amount is sent. The server re-derives it from the stored booking, so a
 * tampered request can only ever pay the real price.
 *
 * Returns both ways of paying the same order: `providerRef` for the inline
 * buttons, `redirectUrl` for the hosted page they fall back to.
 */
export async function createPaymentSession(reference) {
  const res = await fetch("/api/payments/start", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reference }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.redirectUrl) {
    throw new Error(data.error ?? "payment-start-failed");
  }
  return { redirectUrl: data.redirectUrl, providerRef: data.providerRef ?? null };
}

/** The hosted-page URL alone, for the redirect path. */
export async function startPayment(reference) {
  const { redirectUrl } = await createPaymentSession(reference);
  return redirectUrl;
}

/**
 * Capture an order the guest approved in the inline buttons.
 *
 * The browser never captures — it asks our server to, and the server verifies
 * the order against its own record before taking a penny. See
 * app/api/payments/paypal/capture/route.js.
 */
export async function capturePayment(orderID, { cancelled = false } = {}) {
  const res = await fetch("/api/payments/paypal/capture", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ orderID, cancelled }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "payment-capture-failed");
  return data;
}
