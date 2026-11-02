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
