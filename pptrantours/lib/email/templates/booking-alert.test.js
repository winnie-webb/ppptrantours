/**
 * Tests for the rendered booking alert.
 *
 * Two things are worth asserting about an email template. First, that a guest
 * cannot get a tag into the owner's inbox — `notes` and `name` are free text
 * typed by a stranger, and the body is injected raw. Second, that the figures
 * in it are the ones the server computed, since this email is what the owner
 * acts on.
 *
 * Run: npm test
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { bookingAlert } from "./booking-alert.js";

/** A guest doing their best to get markup into the inbox. */
const HOSTILE = `<script>alert(1)</script><img src=x onerror=alert(2)>"'&`;

const FULL = {
  reference: "PPP-K3F9QX",
  type: "booking",
  name: "Alicia Brown",
  email: "alicia@example.com",
  phone: "+1 876 555 0000",
  tourTitle: "Montego Bay → Ocho Rios transfer",
  placeLabel: "Sandals Royal Caribbean",
  date: "2026-10-04",
  time: "14:30",
  flightNumber: "AA1653",
  adults: 2,
  children: 1,
  notes: "Travelling with a folding wheelchair.",
  transportTotal: 187.5,
};

describe("bookingAlert — injection", () => {
  /*
   * Neither template contains a <script> or an <img> of its own, so either one
   * appearing can only have come from the guest.
   *
   * Note what is NOT asserted: that the string "onerror=" is absent. It is
   * present, inside the inert text "&lt;img src=x onerror=alert(2)&gt;" — that
   * is the escaping working, and testing for it would fail the good case.
   */
  const out = bookingAlert({ ...FULL, name: HOSTILE, notes: HOSTILE });

  test("hostile input opens no script tag", () => {
    assert.ok(!/<script/i.test(out.html));
  });

  test("hostile input opens no img tag", () => {
    assert.ok(!/<img/i.test(out.html));
  });

  test("it is escaped rather than stripped, so the owner still sees it", () => {
    assert.ok(out.html.includes("&lt;script&gt;"));
  });

  test("a quote in the address cannot break out of the mailto attribute", () => {
    const quoted = bookingAlert({ ...FULL, email: `evil"@example.com` });
    assert.ok(!quoted.html.includes(`mailto:evil"@`));
    assert.ok(quoted.html.includes("mailto:evil&quot;@"));
  });
});

describe("bookingAlert — content", () => {
  const out = bookingAlert(FULL);

  test("subject carries kind, reference and name", () => {
    assert.equal(out.subject, "New Booking — PPP-K3F9QX — Alicia Brown");
  });

  test("reply-to is the guest, which is the point of the whole email", () => {
    assert.equal(out.replyTo, FULL.email);
  });

  test("renders the server's total", () => {
    // Recomputed from products.json, not whatever the browser posted.
    assert.ok(out.html.includes("US$187.50"));
  });

  test("quotes the transport and nothing else", () => {
    // Gate fees used to be re-priced, stored and printed here as a second
    // figure and a combined day total. The site quotes one number now, so a
    // second money figure in this email would be one the owner cannot
    // reconcile against anything the guest was shown.
    const amounts = out.html.match(/US\$[\d,]+\.\d{2}/g) ?? [];
    assert.deepStrictEqual([...new Set(amounts)], ["US$187.50"]);
  });

  test("pluralises travellers", () => {
    assert.ok(out.html.includes("2 adults, 1 child"));
  });

  test("leaves no unrendered placeholder behind", () => {
    // The failure that started all this was an email full of {{variables}}.
    assert.ok(!/\{\{/.test(out.html));
  });

  test("fits inside the EmailJS 50Kb request cap", () => {
    assert.ok(Buffer.byteLength(out.html, "utf8") < 50_000);
  });
});

describe("bookingAlert — transfer direction", () => {
  test("a departure-only transfer is labelled Hotel → airport, not Round trip", () => {
    const out = bookingAlert({
      ...FULL,
      kind: "transfer",
      direction: "to-airport",
    });
    assert.ok(out.html.includes("Hotel &rarr; airport") || out.html.includes("Hotel → airport"));
    assert.ok(!out.html.includes("Round trip"));
  });

  test("an arrival is labelled Airport → hotel", () => {
    const out = bookingAlert({ ...FULL, kind: "transfer", direction: "to-hotel" });
    assert.ok(out.html.includes("Airport &rarr; hotel") || out.html.includes("Airport → hotel"));
  });

  test("a round trip shows the return leg", () => {
    const out = bookingAlert({
      ...FULL,
      kind: "transfer",
      direction: "both",
      returnDate: "2026-10-11",
      returnFlight: "AA1654",
    });
    assert.ok(out.html.includes("Round trip"));
    assert.ok(out.html.includes("2026-10-11"));
    assert.ok(out.html.includes("AA1654"));
  });

  test("a legacy tripType-only booking still gets a direction label", () => {
    const oneWay = bookingAlert({ ...FULL, kind: "transfer", tripType: "one-way", direction: undefined });
    assert.ok(oneWay.html.includes("Airport &rarr; hotel") || oneWay.html.includes("Airport → hotel"));

    const roundTrip = bookingAlert({ ...FULL, kind: "transfer", tripType: "round-trip", direction: undefined });
    assert.ok(roundTrip.html.includes("Round trip"));
  });

  test("a tour booking (no direction) shows no Direction row", () => {
    const out = bookingAlert(FULL);
    assert.ok(!out.html.includes(">Direction<"));
  });
});

describe("bookingAlert — sparse enquiry", () => {
  const out = bookingAlert({
    reference: "PPP-AAA111",
    type: "enquiry",
    adults: 1,
    children: 0,
    transportTotal: null,
  });

  test("says Enquiry, not Booking", () => {
    assert.ok(out.subject.startsWith("New Enquiry"));
  });

  test("blank optionals become em dashes, not empty cells", () => {
    assert.ok(out.html.includes("—"));
  });

  test("an unpriced enquiry says so instead of showing US$0.00", () => {
    assert.ok(out.html.includes("quote requested"));
    assert.ok(!out.html.includes("US$0.00"));
  });

  test("no entry-fee line when there are no entry fees", () => {
    assert.ok(!out.html.includes("paid at the gate"));
  });

  test("singular traveller", () => {
    assert.ok(out.html.includes("1 adult<"));
  });

  test("still leaves no unrendered placeholder", () => {
    assert.ok(!/\{\{/.test(out.html));
  });
});
