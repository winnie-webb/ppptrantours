/**
 * Booking helpers with no Firebase dependency, so both the browser and the
 * server route can import them. Keeping these out of `lib/bookings.js` stops
 * the client Firebase SDK being dragged into the API route's bundle.
 */
import { site } from "@/app/data/site";
import { describeDirection } from "@/app/products/pricing";
import { formatDateTime, transferLegs } from "./booking-times";

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
 * Kept at 10 characters. It is the prefix of the payment `order_id`, which
 * WiPay capped at 16 on the hosted page Jamaica used. PayPal's `custom_id`
 * allows 127, so the cap no longer binds — but the reference is quoted over
 * WhatsApp and read down a phone line, and 10 characters is short for that
 * reason too.
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

/** "Arrival: 2026-10-04 at 2:30 p.m." and "Arrival flight: AA1653", for one leg. */
function legLines(label, leg) {
  if (!leg) return [];
  return [
    `${label}: ${formatDateTime(leg.date, leg.time) || "—"}`,
    leg.flight ? `${label} flight: ${leg.flight}` : null,
  ];
}

/**
 * After-the-trip thank-you, opened from /admin on Mr. Pugh's phone and sent to
 * the GUEST — the reverse direction of buildWhatsAppMessage below. Null when
 * there is no number to send it to.
 *
 * No discount or freebie for the review: Google removes reviews that were
 * paid for in any form.
 */
export function buildReviewRequestWhatsApp(booking) {
  const digits = String(booking.phone ?? "").replace(/\D/g, "");
  if (!digits) return null;

  const firstName = String(booking.name ?? "").trim().split(/\s+/)[0];
  const text = [
    `Hi${firstName ? ` ${firstName}` : ""}, thank you for travelling with PPP Tran Tours! We hope you had a wonderful time in Jamaica.`,
    ``,
    `If you have a minute, a quick Google review would mean a lot to us:`,
    site.reviewLinks.google,
    ``,
    `Safe travels, and we hope to see you again.`,
    `— Donovan, PPP Tran Tours`,
  ].join("\n");

  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

const travellersLine = (booking) =>
  `${booking.adults} adult${booking.adults === 1 ? "" : "s"}` +
  (booking.children
    ? `, ${booking.children} child${booking.children === 1 ? "" : "ren"}`
    : "");

/**
 * The job, sent from /admin to the DRIVER it was assigned to. Opened on the
 * owner's or dispatcher's phone; they press send.
 *
 * Everything a driver needs and nothing they don't: no guest email, no
 * payment history. What to collect is stated as a single figure, because a
 * driver who has to work out the balance at the curb will get it wrong.
 * Null when the driver has no number on file.
 */
export function buildDriverJobWhatsApp(booking, driver) {
  const digits = String(driver?.phone ?? "").replace(/\D/g, "");
  if (!digits) return null;

  const isTransfer = booking.kind === "transfer";
  const legs = transferLegs(booking);
  const payable = Number(booking.payment?.payableCents ?? 0);
  const paid = Number(booking.payment?.paidCents ?? 0);
  const collectCents =
    payable > 0
      ? Math.max(0, payable - paid)
      : booking.transportTotal != null
        ? Math.round(Number(booking.transportTotal) * 100)
        : null;
  const firstName = String(driver.name ?? "").trim().split(/\s+/)[0];

  const lines = [
    `Hi${firstName ? ` ${firstName}` : ""}, PPP job ${booking.reference}:`,
    ``,
    `${isTransfer ? "Transfer" : "Tour"}: ${booking.tourTitle}`,
    booking.placeLabel ? `${isTransfer ? "Hotel" : "Pickup from"}: ${booking.placeLabel}` : null,
    isTransfer && (booking.direction || booking.tripType)
      ? `Trip: ${describeDirection(booking.direction ?? (booking.tripType === "one-way" ? "to-hotel" : "both"))}`
      : null,
    ...(isTransfer
      ? [
          ...legLines("Arrival", legs.arrival),
          ...legLines("Departure", legs.departure),
          booking.airline ? `Airline: ${booking.airline}` : null,
        ]
      : [`Date: ${formatDateTime(booking.date, booking.time)}`]),
    `Travellers: ${travellersLine(booking)}`,
    ``,
    `Guest: ${booking.name}`,
    booking.phone ? `Guest phone: ${booking.phone}` : null,
    booking.notes ? `Notes: ${booking.notes}` : null,
    ``,
    collectCents == null
      ? `Payment: confirm with the office`
      : collectCents === 0
        ? `Payment: PAID online. Collect nothing.`
        : `Collect on the day: ${money(collectCents / 100)} cash (USD)`,
    isTransfer && legs.arrival
      ? `Meet at the curb, Column E, holding the PPP sign.`
      : null,
    `Please reply OK to confirm. Thank you.`,
  ].filter((l) => l !== null);

  return `https://wa.me/${digits}?text=${encodeURIComponent(lines.join("\n"))}`;
}

/**
 * Who is coming, sent from /admin to the GUEST once a driver is assigned.
 * The name and the vehicle are what a guest scans the curb for; the plate
 * settles it. Null when the guest gave no number.
 */
export function buildDriverIntroWhatsApp(booking) {
  const digits = String(booking.phone ?? "").replace(/\D/g, "");
  const driver = booking.driver;
  if (!digits || !driver?.name) return null;

  const firstName = String(booking.name ?? "").trim().split(/\s+/)[0];
  const vehicle = [driver.vehicle, driver.plate && `plate ${driver.plate}`]
    .filter(Boolean)
    .join(", ");
  const arriving = booking.kind === "transfer" && transferLegs(booking).arrival;

  const text = [
    `Hi${firstName ? ` ${firstName}` : ""}, this is PPP Tran Tours about booking ${booking.reference}.`,
    ``,
    `Your driver will be ${driver.name}${vehicle ? ` (${vehicle})` : ""}.`,
    arriving
      ? `After customs, go out through the glass doors by the taxi stand, turn left, and look for ${driver.name} at the curb by Column E with the PPP sign.`
      : null,
    `Any questions, just reply here.`,
  ]
    .filter((l) => l !== null)
    .join("\n");

  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

/**
 * Pre-filled WhatsApp message.
 *
 * Transport and gate fees are listed on separate lines on purpose. Mr. Pugh
 * reads these messages on his phone and quotes back from them; a single blended
 * total would have him quoting a number that includes money he never collects.
 */
export function buildWhatsAppMessage(booking) {
  const isTransfer = booking.kind === "transfer";
  const legs = transferLegs(booking);

  const travellers = travellersLine(booking);

  const lines = [
    `Hi PPP Tran Tours, I'd like to book:`,
    ``,
    `${isTransfer ? "Transfer" : "Tour"}: ${booking.tourTitle}`,
    `Reference: ${booking.reference}`,
    booking.placeLabel
      ? `${isTransfer ? "Destination" : "Staying at"}: ${booking.placeLabel}`
      : null,
    isTransfer && (booking.direction || booking.tripType)
      ? `Trip: ${describeDirection(booking.direction ?? (booking.tripType === "one-way" ? "to-hotel" : "both"))}`
      : null,
    // A transfer lists each flight leg on its own lines, times in 12-hour form.
    ...(isTransfer
      ? [
          ...legLines("Arrival", legs.arrival),
          ...legLines("Departure", legs.departure),
          booking.airline ? `Airline: ${booking.airline}` : null,
        ]
      : [`Date: ${formatDateTime(booking.date, booking.time)}`]),
    `Travellers: ${travellers}`,
    ``,
    booking.transportTotal != null
      ? `Transport (PPP): ${money(booking.transportTotal)}`
      : `Transport: please quote me`,
    ``,
    `Name: ${booking.name}`,
    `Email: ${booking.email}`,
    booking.phone ? `Phone: ${booking.phone}` : null,
    booking.notes ? `` : null,
    booking.notes ? `Notes: ${booking.notes}` : null,
  ].filter((l) => l !== null);

  return `${site.contact.whatsappHref}?text=${encodeURIComponent(lines.join("\n"))}`;
}
