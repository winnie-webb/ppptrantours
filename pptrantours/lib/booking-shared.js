/**
 * Booking helpers with no Firebase dependency, so both the browser and the
 * server route can import them. Keeping these out of `lib/bookings.js` stops
 * the client Firebase SDK being dragged into the API route's bundle.
 */
import { site } from "@/app/data/site";

/** Short human-quotable reference, e.g. PPP-K3F9QX. */
export function makeReference() {
  // No I, O, 0 or 1 — these get read down a phone line.
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return `PPP-${out}`;
}

export function buildWhatsAppMessage(booking) {
  const lines = [
    `Hi PPP Tran Tours, I'd like to book:`,
    ``,
    `Tour: ${booking.tourTitle}`,
    `Reference: ${booking.reference}`,
    `Pickup: ${booking.pickupLabel}`,
    `Date: ${booking.date}${booking.time ? ` at ${booking.time}` : ""}`,
    `Travellers: ${booking.adults} adult${booking.adults === 1 ? "" : "s"}` +
      (booking.children
        ? `, ${booking.children} child${booking.children === 1 ? "" : "ren"}`
        : ""),
    booking.flightNumber ? `Flight: ${booking.flightNumber}` : null,
    booking.hotel ? `Staying at: ${booking.hotel}` : null,
    `Estimated total: US$${Number(booking.total ?? 0).toFixed(2)}`,
    ``,
    `Name: ${booking.name}`,
    `Email: ${booking.email}`,
    booking.phone ? `Phone: ${booking.phone}` : null,
    booking.notes ? `` : null,
    booking.notes ? `Notes: ${booking.notes}` : null,
  ].filter((l) => l !== null);

  return `${site.contact.whatsappHref}?text=${encodeURIComponent(lines.join("\n"))}`;
}
