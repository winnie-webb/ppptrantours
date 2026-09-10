/**
 * Booking helpers with no Firebase dependency, so both the browser and the
 * server route can import them. Keeping these out of `lib/bookings.js` stops
 * the client Firebase SDK being dragged into the API route's bundle.
 */
import { site } from "@/app/data/site";

// No I, O, 0 or 1 — these get read down a phone line.
const REF_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Short human-quotable reference, e.g. PPP-K3F9QX.
 *
 * `Math.random()` on purpose. This function runs in the browser as the fallback
 * when the API is unreachable, and that path never writes to Firestore — the
 * reference is only something for the guest to quote over WhatsApp. The server
 * mints its own with `crypto.randomInt` (see makeServerReference), because
 * there the value becomes a document id and a payment order_id.
 *
 * Keep it at 10 characters. It is used as the WiPay `order_id` prefix, and that
 * field is capped at 16 on the hosted page Jamaica uses.
 */
export function makeReference() {
  let out = "";
  for (let i = 0; i < 6; i += 1) {
    out += REF_ALPHABET[Math.floor(Math.random() * REF_ALPHABET.length)];
  }
  return `PPP-${out}`;
}

/**
 * The same shape, from a real CSPRNG. Server-only — `node:crypto` is imported
 * lazily so this module stays safe to bundle for the browser.
 */
export async function makeServerReference() {
  const { randomInt } = await import("node:crypto");
  let out = "";
  for (let i = 0; i < 6; i += 1) {
    out += REF_ALPHABET[randomInt(REF_ALPHABET.length)];
  }
  return `PPP-${out}`;
}

const money = (n) => `US$${Number(n ?? 0).toFixed(2)}`;

/**
 * Pre-filled WhatsApp message.
 *
 * Transport and gate fees are listed on separate lines on purpose. Mr. Pugh
 * reads these messages on his phone and quotes back from them; a single blended
 * total would have him quoting a number that includes money he never collects.
 */
export function buildWhatsAppMessage(booking) {
  const isTransfer = booking.kind === "transfer";

  const travellers =
    `${booking.adults} adult${booking.adults === 1 ? "" : "s"}` +
    (booking.children
      ? `, ${booking.children} child${booking.children === 1 ? "" : "ren"}`
      : "");

  const lines = [
    `Hi PPP Tran Tours, I'd like to book:`,
    ``,
    `${isTransfer ? "Transfer" : "Tour"}: ${booking.tourTitle}`,
    `Reference: ${booking.reference}`,
    booking.placeLabel
      ? `${isTransfer ? "Destination" : "Staying at"}: ${booking.placeLabel}`
      : null,
    isTransfer && booking.tripType
      ? `Trip: ${booking.tripType === "one-way" ? "One way" : "Round trip"}`
      : null,
    `Date: ${booking.date}${booking.time ? ` at ${booking.time}` : ""}`,
    booking.returnDate ? `Return: ${booking.returnDate}` : null,
    `Travellers: ${travellers}`,
    booking.flightNumber ? `Flight: ${booking.flightNumber}` : null,
    booking.returnFlight ? `Return flight: ${booking.returnFlight}` : null,
    ``,
    booking.transportTotal != null
      ? `Transport (PPP): ${money(booking.transportTotal)}`
      : `Transport: please quote me`,
    ...(booking.entryLines?.length
      ? [`Entry fees at the gate:`, ...booking.entryLines.map((l) => `  · ${l}`)]
      : []),
    booking.transportTotal != null && booking.entryTotal
      ? `Estimated day total: ${money(booking.transportTotal + booking.entryTotal)}`
      : null,
    ``,
    `Name: ${booking.name}`,
    `Email: ${booking.email}`,
    booking.phone ? `Phone: ${booking.phone}` : null,
    booking.notes ? `` : null,
    booking.notes ? `Notes: ${booking.notes}` : null,
  ].filter((l) => l !== null);

  return `${site.contact.whatsappHref}?text=${encodeURIComponent(lines.join("\n"))}`;
}
