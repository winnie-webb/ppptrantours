import { test } from "node:test";
import assert from "node:assert/strict";
import { formatTime12, formatDateTime, transferLegs } from "./booking-times.js";

test("formatTime12 shows 12-hour time with a.m./p.m.", () => {
  assert.equal(formatTime12("15:45"), "3:45 p.m.");
  assert.equal(formatTime12("09:05"), "9:05 a.m.");
  assert.equal(formatTime12("00:10"), "12:10 a.m.");
  assert.equal(formatTime12("12:00"), "12:00 p.m.");
  assert.equal(formatTime12(""), "");
  assert.equal(formatTime12(undefined), "");
  assert.equal(formatTime12("about noon"), "about noon");
});

test("formatDateTime joins date and time, or gives the date alone", () => {
  assert.equal(formatDateTime("2026-10-11", "14:30"), "2026-10-11 at 2:30 p.m.");
  assert.equal(formatDateTime("2026-10-11", ""), "2026-10-11");
});

test("transferLegs splits a booking into arrival and departure", () => {
  const base = { kind: "transfer", date: "2026-10-04", time: "14:30", flightNumber: "AA1653" };

  assert.deepEqual(transferLegs({ ...base, direction: "to-hotel" }), {
    arrival: { date: "2026-10-04", time: "14:30", flight: "AA1653" },
    departure: null,
  });
  assert.deepEqual(transferLegs({ ...base, direction: "to-airport" }), {
    arrival: null,
    departure: { date: "2026-10-04", time: "14:30", flight: "AA1653" },
  });
  assert.deepEqual(
    transferLegs({
      ...base,
      direction: "both",
      returnDate: "2026-10-11",
      returnTime: "16:05",
      returnFlight: "AA1654",
    }).departure,
    { date: "2026-10-11", time: "16:05", flight: "AA1654" }
  );
  assert.deepEqual(transferLegs({ kind: "tour", date: "2026-10-04" }), {
    arrival: null,
    departure: null,
  });
});

test("missingFlightTime requires every leg's flight time", async () => {
  const { missingFlightTime } = await import("./booking-times.js");
  const base = { kind: "transfer", date: "2026-11-03", time: "17:20", returnDate: "", returnTime: "" };
  // PPP-N495SH: a one-way arrival with no landing time.
  assert.equal(missingFlightTime({ ...base, direction: "to-hotel", time: "" }), "arrival");
  assert.equal(missingFlightTime({ ...base, direction: "to-hotel" }), null);
  assert.equal(missingFlightTime({ ...base, direction: "to-airport", time: "" }), "departure");
  assert.equal(missingFlightTime({ ...base, direction: "to-airport" }), null);
  assert.equal(missingFlightTime({ ...base, direction: "both", time: "" }), "arrival");
  assert.equal(missingFlightTime({ ...base, direction: "both" }), "departure");
  assert.equal(
    missingFlightTime({ ...base, direction: "both", returnDate: "2026-11-10", returnTime: "09:00" }),
    null
  );
  assert.equal(missingFlightTime({ kind: "tour", date: "2026-11-03" }), null);
});
