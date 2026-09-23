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
    assert.equal(out.subject, "You're booked — PPP-K3F9QX");
  });

  test("renders the server's total", () => {
    assert.ok(out.html.includes("US$170.00"));
  });

  test("carries the direction for a transfer", () => {
    assert.ok(out.html.includes("Hotel &rarr; airport") || out.html.includes("Hotel → airport"));
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

  test("a tour booking shows no Direction row", () => {
    const out = bookingConfirmation(
      { ...FULL, kind: "tour", direction: undefined },
      LINKS
    );
    assert.ok(!out.html.includes(">Direction<"));
  });
});

describe("bookingConfirmation — missing name", () => {
  test("falls back to a generic greeting rather than crashing on an empty name", () => {
    const out = bookingConfirmation({ reference: "PPP-CCC333", transportTotal: null }, LINKS);
    assert.ok(out.html.includes("there,") || out.html.includes("there."));
  });
});
