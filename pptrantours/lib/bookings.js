/**
 * Booking submission.
 *
 * With Firebase configured, a booking lands in the `bookings` collection.
 * Without it, we still succeed locally and hand the guest a pre-filled
 * WhatsApp message, so the form is usable from day one.
 */
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDb, isFirebaseConfigured } from "./firebase";
import { site } from "@/app/data/site";

/** Short human-quotable reference, e.g. PPP-K3F9QX. */
export function makeReference() {
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
      (booking.children ? `, ${booking.children} child${booking.children === 1 ? "" : "ren"}` : ""),
    booking.flightNumber ? `Flight: ${booking.flightNumber}` : null,
    booking.hotel ? `Staying at: ${booking.hotel}` : null,
    `Estimated total: US$${booking.total.toFixed(2)}`,
    ``,
    `Name: ${booking.name}`,
    `Email: ${booking.email}`,
    booking.phone ? `Phone: ${booking.phone}` : null,
    booking.notes ? `` : null,
    booking.notes ? `Notes: ${booking.notes}` : null,
  ].filter((l) => l !== null);

  return `${site.contact.whatsappHref}?text=${encodeURIComponent(lines.join("\n"))}`;
}

/**
 * @returns {Promise<{reference: string, persisted: boolean, whatsappUrl: string}>}
 */
export async function createBooking(booking) {
  const reference = booking.reference ?? makeReference();
  const payload = { ...booking, reference };
  const whatsappUrl = buildWhatsAppMessage(payload);

  if (!isFirebaseConfigured) {
    // No project attached yet — the guest still gets a working handoff.
    return { reference, persisted: false, whatsappUrl };
  }

  const db = getDb();
  await addDoc(collection(db, "bookings"), {
    ...payload,
    status: "new",
    createdAt: serverTimestamp(),
  });

  return { reference, persisted: true, whatsappUrl };
}
