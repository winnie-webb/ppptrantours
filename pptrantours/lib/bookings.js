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
 * @returns {Promise<{reference: string, persisted: boolean, whatsappUrl: string}>}
 */
export async function createBooking(booking) {
  let reference = null;
  let persisted = false;

  try {
    const res = await fetch("/api/bookings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
  } catch (err) {
    // A validation message is worth showing; anything else, we degrade quietly
    // rather than telling the guest their booking vanished.
    if (err instanceof Error && err.message !== "save-failed") throw err;
  }

  if (!reference) reference = makeReference();

  return {
    reference,
    persisted,
    whatsappUrl: buildWhatsAppMessage({ ...booking, reference }),
  };
}

export { makeReference, buildWhatsAppMessage };
