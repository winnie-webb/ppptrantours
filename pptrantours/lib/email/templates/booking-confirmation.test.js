/**
 * Tests for the guest-facing confirmation email. Same two concerns as
 * booking-alert.test.js: a guest cannot get a tag into their own inbox via
 * their own name or notes, and the figures/links in it are the real ones.
 *
 * Run: npm test
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { bookingConfirmation } from "./booking-confirmation.js";

const HOSTILE = `<script>alert(1)</script><img src=x onerror=alert(2)>"'&`;

const LINKS = {
  bookingUrl: "https://ppptrantoursjamaica.com/booking/PPP-K3F9QX?p=abc123",
  whatsappUrl: "https://wa.me/18763976277?text=hi",
};

const FULL = {
  reference: "PPP-K3F9QX",
  type: "booking",
  kind: "transfer",
  direction: "to-airport",
  name: "Alicia Brown",
  email: "alicia@example.com",
  tourTitle: "Airport transfer to Sandals Royal Caribbean",
  placeLabel: "Sandals Royal Caribbean",
  date: "2026-10-04",
  transportTotal: 170,
};

describe("bookingConfirmation — injection", () => {
  const out = bookingConfirmation({ ...FULL, name: HOSTILE }, LINKS);

  test("hostile input opens no script tag", () => {
    assert.ok(!/<script/i.test(out.html));
  });

  test("hostile input opens no img tag", () => {
    assert.ok(!/<img/i.test(out.html));
  });

  test("it is escaped rather than stripped", () => {
    assert.ok(out.html.includes("&lt;script&gt;"));
  });
});

describe("bookingConfirmation — content", () => {
  const out = bookingConfirmation(FULL, LINKS);

  test("subject carries the outcome and reference", () => {
    assert.equal(out.subject, "Booking confirmed — PPP-K3F9QX");
  });

  test("renders the server's total", () => {
    assert.ok(out.html.includes("US$170.00"));
  });

  test("carries the direction for a transfer", () => {
    assert.ok(out.html.includes(">Transfer type<"));
    assert.ok(out.html.includes("One-way departure"));
  });

  test("links to the booking page with its token intact", () => {
    assert.ok(out.html.includes(LINKS.bookingUrl));
  });

  test("links to WhatsApp", () => {
    assert.ok(out.html.includes(LINKS.whatsappUrl));
  });

  test("greets the guest by first name only", () => {
    assert.ok(out.html.includes("Alicia."));
    assert.ok(!out.html.includes("Alicia Brown."));
  });

  test("leaves no unrendered placeholder behind", () => {
    assert.ok(!/\{\{/.test(out.html));
  });

  test("fits inside the EmailJS 50Kb request cap", () => {
    assert.ok(Buffer.byteLength(out.html, "utf8") < 50_000);
  });
});

describe("bookingConfirmation — flight legs and next steps", () => {
  const roundTrip = bookingConfirmation(
    {
      ...FULL,
      direction: "both",
      time: "14:30",
      flightNumber: "AA1653",
      returnDate: "2026-10-11",
      returnTime: "16:05",
      returnFlight: "AA1654",
    },
    LINKS
  );

  test("a round trip shows arrival and departure, each in 12-hour time", () => {
    assert.ok(roundTrip.html.includes("Arrival flight time"));
    assert.ok(roundTrip.html.includes("2026-10-04 at 2:30 p.m."));
    assert.ok(roundTrip.html.includes("Departure flight time"));
    assert.ok(roundTrip.html.includes("2026-10-11 at 4:05 p.m."));
    assert.ok(roundTrip.html.includes("AA1654"));
    assert.ok(!roundTrip.html.includes("16:05"));
  });

  test("never promises a driver's name", () => {
    assert.ok(!/driver(&#39;|')s name/.test(roundTrip.html));
    assert.ok(!/driver details/.test(roundTrip.html));
  });

  test("keeps the flight-tracking promise for an arrival", () => {
    assert.ok(roundTrip.html.includes("We track your flight"));
  });

  test("a departure explains how the hotel pickup is set", () => {
    const out = bookingConfirmation({ ...FULL, time: "09:15" }, LINKS);
    assert.ok(out.html.includes("Departure flight time"));
    assert.ok(out.html.includes("9:15 a.m."));
    assert.ok(out.html.includes("two hours before your flight"));
    assert.ok(!out.html.includes("We track your flight"));
  });

  test("speaks as we, never I", () => {
    assert.ok(!/\bI(&#39;|')?(ll|m|ve)?\b/.test(roundTrip.html.replace(/<[^>]+>/g, " ")));
  });
});

describe("bookingConfirmation — enquiry and quote-request", () => {
  test("an enquiry gets its own headline and subject", () => {
    const out = bookingConfirmation(
      { reference: "PPP-AAA111", type: "enquiry", name: "Sam", transportTotal: null },
      LINKS
    );
    assert.ok(out.subject.startsWith("We've got your message"));
    // The apostrophe is HTML-escaped in the body, unlike the plain-text subject.
    assert.ok(out.html.includes("got your message"));
  });

  test("an unpriced quote-request says so instead of a total", () => {
    const out = bookingConfirmation(
      { reference: "PPP-BBB222", type: "quote-request", name: "Sam", transportTotal: null },
      LINKS
    );
    assert.ok(out.html.includes("to be confirmed"));
    assert.ok(!out.html.includes("US$0.00"));
    assert.ok(out.html.includes("Request received"));
  });

  test("a tour booking shows no Transfer type row", () => {
    const out = bookingConfirmation(
      { ...FULL, kind: "tour", direction: undefined },
      LINKS
    );
    assert.ok(!out.html.includes(">Transfer type<"));
  });
});

describe("bookingConfirmation — missing name", () => {
  test("falls back to a generic greeting rather than crashing on an empty name", () => {
    const out = bookingConfirmation({ reference: "PPP-CCC333", transportTotal: null }, LINKS);
    assert.ok(out.html.includes("there,") || out.html.includes("there."));
  });
});
