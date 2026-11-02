/**
 * How a booking's times and flights are shown — to the guest, to Mr. Pugh, in
 * the admin and in the WhatsApp text. No imports, so the email templates
 * (plain Node ESM under `node --test`) can use it as well as the app.
 *
 * Times are STORED as the `HH:MM` a `<input type="time">` gives, and SHOWN in
 * 12-hour form with "a.m."/"p.m." (owner, 2026-11-02): "15:45" reads as a
 * typo to most guests.
 */

/**
 * "15:45" → "3:45 p.m.", "00:10" → "12:10 a.m.". Empty in, empty out; anything
 * that is not a 24-hour time is passed through unchanged rather than lost.
 */
export function formatTime12(value) {
  const raw = String(value ?? "").trim();
  const m = /^(\d{1,2}):(\d{2})/.exec(raw);
  if (!m) return raw;
  const h = Number(m[1]);
  if (h > 23 || Number(m[2]) > 59) return raw;
  const suffix = h < 12 ? "a.m." : "p.m.";
  return `${h % 12 || 12}:${m[2]} ${suffix}`;
}

/** The transfer direction, including bookings saved before `direction` existed. */
export function transferDirection(booking) {
  if (booking.direction) return booking.direction;
  if (booking.tripType === "one-way") return "to-hotel";
  return booking.tripType ? "both" : "";
}

/**
 * The flight legs of a transfer, each `{ date, time, flight }` or null.
 *
 * The form reuses its first date/time/flight fields for whichever leg comes
 * first: the arrival when there is one, otherwise ("to-airport") the
 * departure. A round trip keeps its departure in `returnDate`, `returnTime`
 * and `returnFlight`. This undoes that, so nothing downstream has to.
 */
export function transferLegs(booking) {
  const none = { arrival: null, departure: null };
  if (booking?.kind !== "transfer") return none;

  const first = { date: booking.date ?? "", time: booking.time ?? "", flight: booking.flightNumber ?? "" };
  const direction = transferDirection(booking);
  if (direction === "to-airport") return { arrival: null, departure: first };
  if (direction === "to-hotel") return { arrival: first, departure: null };
  return {
    arrival: first,
    departure: {
      date: booking.returnDate ?? "",
      time: booking.returnTime ?? "",
      flight: booking.returnFlight ?? "",
    },
  };
}

/** "2026-10-11 at 3:45 p.m." — the date alone when no time was given. */
export function formatDateTime(date, time) {
  const t = formatTime12(time);
  return [date, t].filter(Boolean).join(" at ");
}
