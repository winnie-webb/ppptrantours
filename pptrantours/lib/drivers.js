/**
 * The driver roster: who can be sent on a PPP job, in what vehicle, and
 * whether their papers are current.
 *
 * PPP keeps drivers on standby beyond the owner, so a booking is fulfilled by
 * whichever driver is free. The guest still books PPP, so every one of those
 * drivers carries PPP's licence, insurance and reputation with them. This
 * module is the rule that a lapsed licence or policy never reaches a guest.
 *
 * Pure functions, no Firebase: the API routes, the admin console and the tests
 * all import it, and they must never disagree about whether a driver is fit to
 * send.
 *
 * Relative import, like app/products/pricing.js, so `node --test` can load
 * this file without the bundler's `@/` alias.
 */
import { transferLegs } from "./booking-times.js";

/** Documents the console tracks, with the label shown beside each. */
export const DRIVER_DOCUMENTS = [
  { key: "insuranceExpiry", label: "Passenger insurance" },
  { key: "licenceExpiry", label: "Road licence / JTB" },
];

const DATE = /^\d{4}-\d{2}-\d{2}$/;

const text = (v, max) => String(v ?? "").trim().slice(0, max);

/**
 * Validate a driver record from the console.
 *
 * Name and a WhatsApp number are required: a job cannot be sent without a
 * number, and a guest is told the name. Everything else is optional, because
 * a driver is often added before their papers have been photographed — but a
 * missing expiry is reported by `documentStatus`, never assumed current.
 *
 * @returns {{value: object} | {error: string}}
 */
export function normaliseDriver(input = {}) {
  const name = text(input.name, 80);
  if (!name) return { error: "A driver needs a name." };

  const phone = text(input.phone, 30);
  if (phone.replace(/\D/g, "").length < 7) {
    return { error: "A driver needs a WhatsApp number, with country code." };
  }

  const seatsRaw = input.seats === "" || input.seats == null ? null : Number(input.seats);
  if (seatsRaw !== null && (!Number.isInteger(seatsRaw) || seatsRaw < 1 || seatsRaw > 60)) {
    return { error: "Seats must be a whole number between 1 and 60." };
  }

  const value = {
    name,
    phone,
    vehicle: text(input.vehicle, 80),
    plate: text(input.plate, 20).toUpperCase(),
    seats: seatsRaw,
    notes: text(input.notes, 500),
    active: input.active !== false,
  };

  for (const { key, label } of DRIVER_DOCUMENTS) {
    const d = text(input[key], 10);
    if (d && !DATE.test(d)) return { error: `${label} expiry must be a date.` };
    value[key] = d || null;
  }

  return { value };
}

/**
 * Today's date in Jamaica, as YYYY-MM-DD. The server runs in UTC, and a
 * policy that expires "today" in Montego Bay must not still look valid for
 * five more hours.
 */
export function jamaicaToday(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Jamaica",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/**
 * The last day the driver will be working on this booking: the tour date, or
 * the later of a transfer's two legs. Papers have to be valid through that
 * day, not just today. Null when the booking carries no usable date.
 */
export function jobLastDate(booking = {}) {
  const legs = transferLegs(booking);
  const dates = (
    booking.kind === "transfer"
      ? [legs.arrival?.date, legs.departure?.date]
      : [booking.date]
  ).filter((d) => typeof d === "string" && DATE.test(d));
  return dates.length ? dates.sort().at(-1) : null;
}

/**
 * Whether a driver's papers cover a given date.
 *
 * `expired`  past their expiry on `onDate` — the driver cannot be sent
 * `expiring` valid on `onDate` but lapsing within 30 days of it — a warning
 * `missing`  never recorded — a warning, since the console cannot vouch for it
 *
 * @returns {{ok: boolean, expired: string[], expiring: string[], missing: string[]}}
 */
export function documentStatus(driver = {}, onDate = jamaicaToday()) {
  const expired = [];
  const expiring = [];
  const missing = [];

  const soon = addDays(onDate, 30);

  for (const { key, label } of DRIVER_DOCUMENTS) {
    const d = driver[key];
    if (!d) missing.push(label);
    else if (d < onDate) expired.push(label);
    else if (d <= soon) expiring.push(label);
  }

  return { ok: expired.length === 0, expired, expiring, missing };
}

function addDays(ymd, days) {
  const t = Date.parse(`${ymd}T12:00:00Z`);
  if (Number.isNaN(t)) return ymd;
  return new Date(t + days * 86400000).toISOString().slice(0, 10);
}

/**
 * Can this driver be put on this booking? The one rule both the server and
 * the console apply.
 *
 * Papers must be valid through the last day of the job (or today, if the
 * booking has no date, or if the job date has already passed). Seats are a
 * warning, not a block: a driver can bring a bigger vehicle, and the owner
 * knows his fleet better than the roster does.
 *
 * @returns {{ok: boolean, reason: string|null, warnings: string[]}}
 */
export function canAssign(driver, booking, today = jamaicaToday()) {
  if (!driver) return { ok: false, reason: "That driver is not on the roster.", warnings: [] };
  if (driver.active === false) {
    return { ok: false, reason: `${driver.name} is marked as not available for jobs.`, warnings: [] };
  }

  const last = jobLastDate(booking);
  const onDate = last && last > today ? last : today;
  const docs = documentStatus(driver, onDate);

  if (!docs.ok) {
    return {
      ok: false,
      reason: `${driver.name}'s ${docs.expired.join(" and ").toLowerCase()} ${
        docs.expired.length === 1 ? "has" : "have"
      } expired by ${onDate}. Update the date on the Drivers tab once it is renewed.`,
      warnings: [],
    };
  }

  const warnings = [];
  if (docs.missing.length) warnings.push(`No expiry recorded for ${docs.missing.join(" or ").toLowerCase()}.`);
  if (docs.expiring.length) warnings.push(`${docs.expiring.join(" and ")} expires within 30 days.`);

  const party = Number(booking?.adults ?? 0) + Number(booking?.children ?? 0);
  if (driver.seats && party > driver.seats) {
    warnings.push(`${party} travelling, but ${driver.vehicle || "the vehicle"} seats ${driver.seats}.`);
  }

  return { ok: true, reason: null, warnings };
}

/**
 * What a booking keeps of its driver. A snapshot, not a reference: if the
 * driver later changes vehicle, the booking still records who actually went.
 */
export function driverSnapshot(id, driver) {
  return {
    id,
    name: driver.name,
    phone: driver.phone,
    vehicle: driver.vehicle || "",
    plate: driver.plate || "",
  };
}
