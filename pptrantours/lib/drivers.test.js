import { test } from "node:test";
import assert from "node:assert/strict";
import {
  normaliseDriver,
  documentStatus,
  canAssign,
  jobLastDate,
  jamaicaToday,
  driverSnapshot,
} from "./drivers.js";

const good = {
  name: "Noel",
  phone: "+1 876 555 0101",
  vehicle: "Toyota Hiace",
  plate: "pp 1234",
  seats: 9,
  insuranceExpiry: "2027-06-30",
  licenceExpiry: "2027-03-31",
  active: true,
};

test("normaliseDriver requires a name and a WhatsApp number", () => {
  assert.match(normaliseDriver({ phone: "18765550101" }).error, /name/);
  assert.match(normaliseDriver({ name: "Noel", phone: "12" }).error, /WhatsApp/);
});

test("normaliseDriver cleans the record", () => {
  const { value } = normaliseDriver({ ...good, name: "  Noel  ", seats: "9" });
  assert.equal(value.name, "Noel");
  assert.equal(value.plate, "PP 1234");
  assert.equal(value.seats, 9);
  assert.equal(value.active, true);
});

test("normaliseDriver rejects bad seats and bad dates, allows blanks", () => {
  assert.match(normaliseDriver({ ...good, seats: 0 }).error, /Seats/);
  assert.match(normaliseDriver({ ...good, seats: "2.5" }).error, /Seats/);
  assert.match(normaliseDriver({ ...good, insuranceExpiry: "30/06/27" }).error, /date/);
  const { value } = normaliseDriver({ ...good, seats: "", insuranceExpiry: "" });
  assert.equal(value.seats, null);
  assert.equal(value.insuranceExpiry, null);
});

test("documentStatus separates expired, expiring and missing", () => {
  const s = documentStatus(
    { insuranceExpiry: "2026-11-01", licenceExpiry: "2026-11-20" },
    "2026-11-03"
  );
  assert.equal(s.ok, false);
  assert.deepEqual(s.expired, ["Passenger insurance"]);
  assert.deepEqual(s.expiring, ["Road licence / JTB"]);

  const m = documentStatus({}, "2026-11-03");
  assert.equal(m.ok, true);
  assert.equal(m.missing.length, 2);
});

test("an expiry date is valid through that day", () => {
  assert.equal(documentStatus({ insuranceExpiry: "2026-11-03", licenceExpiry: "2027-01-01" }, "2026-11-03").ok, true);
});

test("jobLastDate takes the later transfer leg, or the tour date", () => {
  assert.equal(
    jobLastDate({ kind: "transfer", direction: "both", date: "2026-12-20", returnDate: "2026-12-27" }),
    "2026-12-27"
  );
  // A one-way arrival ignores a stray return date.
  assert.equal(
    jobLastDate({ kind: "transfer", direction: "to-hotel", date: "2026-12-20", returnDate: "2026-12-27" }),
    "2026-12-20"
  );
  assert.equal(jobLastDate({ kind: "excursion", date: "2027-01-05" }), "2027-01-05");
  assert.equal(jobLastDate({ kind: "excursion" }), null);
});

test("canAssign blocks a driver whose papers lapse before the job ends", () => {
  const booking = { kind: "transfer", direction: "both", date: "2027-03-20", returnDate: "2027-04-02", adults: 2 };
  const r = canAssign(good, booking, "2026-11-03");
  assert.equal(r.ok, false);
  assert.match(r.reason, /road licence/);
  assert.match(r.reason, /2027-04-02/);
});

test("canAssign checks today for a job already in the past", () => {
  const r = canAssign({ ...good, insuranceExpiry: "2026-10-01" }, { kind: "excursion", date: "2026-09-01" }, "2026-11-03");
  assert.equal(r.ok, false);
});

test("canAssign blocks an inactive or unknown driver", () => {
  assert.equal(canAssign(null, {}).ok, false);
  assert.equal(canAssign({ ...good, active: false }, {}, "2026-11-03").ok, false);
});

test("canAssign warns, without blocking, on seats and missing papers", () => {
  const r = canAssign(
    { ...good, seats: 3, licenceExpiry: null },
    { kind: "excursion", date: "2026-12-01", adults: 4, children: 1 },
    "2026-11-03"
  );
  assert.equal(r.ok, true);
  assert.equal(r.warnings.length, 2);
  assert.ok(r.warnings.some((w) => /5 travelling/.test(w)));
});

test("jamaicaToday uses Jamaica's date, not UTC's", () => {
  // 03:00 UTC on 4 Nov is still 22:00 on 3 Nov in Montego Bay (UTC-5).
  assert.equal(jamaicaToday(new Date("2026-11-04T03:00:00Z")), "2026-11-03");
});

test("driverSnapshot keeps only what the booking needs", () => {
  assert.deepEqual(driverSnapshot("d1", { ...good, notes: "x" }), {
    id: "d1",
    name: "Noel",
    phone: "+1 876 555 0101",
    vehicle: "Toyota Hiace",
    plate: "pp 1234",
  });
});
