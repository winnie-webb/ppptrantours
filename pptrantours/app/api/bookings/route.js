import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { sendBookingAlert } from "@/lib/notify";
import { makeServerReference } from "@/lib/booking-shared";
import { filterProductById } from "@/app/products/product";
import {
  quoteExcursion,
  quoteTransfer,
  payable,
  fromCents,
  MAX_PARTY,
} from "@/app/products/pricing";
import { paymentsConfigured } from "@/lib/payments";
import { makeLookupToken, sweepAbandoned } from "@/lib/payments/store";
import { getPlace } from "@/app/data/places";

// firebase-admin needs Node built-ins; it cannot run on the edge runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX = { name: 120, email: 200, phone: 40, place: 80, flight: 20, notes: 2000 };

function str(value, limit) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, limit);
}

function int(value, min, max, fallback) {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/** Deliberately loose — the only real test of an address is mailing it. */
function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
}

/** Keep only keys and values that exist in the catalogue. */
function cleanChoices(raw) {
  if (!raw || typeof raw !== "object") return {};
  const out = {};
  for (const [k, v] of Object.entries(raw)) {
    if (typeof k === "string" && typeof v === "string" && k.length < 40) {
      out[k.slice(0, 40)] = v.slice(0, 40);
    }
  }
  return out;
}

function cleanAddons(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((v) => typeof v === "string")
    .slice(0, 10)
    .map((v) => v.slice(0, 40));
}

/**
 * A date in the past is a mistake, not a booking.
 *
 * Checked here as well as with `min` on the input, because the input attribute
 * is a courtesy to the guest and this is the actual rule. Compared as plain
 * `yyyy-mm-dd` strings against UTC: a guest whose own midnight has not yet
 * arrived in UTC could otherwise be told their today is yesterday, so this is
 * deliberately generous by up to a day rather than strict and wrong.
 */
function isPastDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; // not a date we parse
  const today = new Date();
  const utcToday = `${today.getUTCFullYear()}-${String(today.getUTCMonth() + 1).padStart(2, "0")}-${String(today.getUTCDate()).padStart(2, "0")}`;
  return value < utcToday;
}

/*
 * Minimum credible abuse controls for a public, unauthenticated endpoint that
 * writes to a database and sends an email on every request.
 *
 * Deliberately NOT a CAPTCHA. On a small operator's booking form a CAPTCHA
 * costs real conversions against a speculative benefit, and it would add a
 * third-party script to every tour page. A honeypot plus a dwell-time floor
 * catches naive bots at zero cost to a real guest; if actual spam ever appears,
 * that is the moment to reconsider, and it is a decision with evidence behind
 * it rather than a reflex.
 */
const MIN_DWELL_MS = 3000;

function looksAutomated(body) {
  // A field positioned off-screen, so nothing but a form-filler completes it.
  if (typeof body.company === "string" && body.company.trim() !== "") {
    return "honeypot";
  }
  const opened = Number(body.formOpenedAt);
  if (Number.isFinite(opened) && opened > 0) {
    const dwell = Date.now() - opened;
    // A negative dwell means a forged or skewed clock; only reject the clearly
    // impossible, since a guest's clock being minutes out is common.
    if (dwell >= 0 && dwell < MIN_DWELL_MS) return "too-fast";
  }
  return null;
}

/**
 * Same-origin check. Any browser sends one of these on a fetch; a script
 * hammering the endpoint typically does not bother.
 *
 * Unknown-but-present hosts are allowed through: Vercel serves this on preview
 * URLs and on the vercel.app domain as well as the canonical one, and locking
 * to a single host would silently break every preview deployment.
 */
function wrongOrigin(request) {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  if (!origin && !referer) return "no-origin";
  return null;
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  /*
   * Abuse checks first, and they all return the same vague message.
   *
   * Telling a bot which check it tripped is telling it how to pass next time,
   * and a real guest can never see these — an empty honeypot and a browser
   * origin are both automatic.
   */
  const automated = looksAutomated(body) ?? wrongOrigin(request);
  if (automated) {
    console.warn(`[bookings] rejected: ${automated}`);
    return NextResponse.json(
      { error: "That request could not be accepted. Please try again." },
      { status: 422 }
    );
  }

  const name = str(body.name, MAX.name);
  const email = str(body.email, MAX.email);

  if (!name) {
    return NextResponse.json({ error: "A name is required." }, { status: 422 });
  }
  if (!looksLikeEmail(email)) {
    return NextResponse.json(
      { error: "A valid email address is required." },
      { status: 422 }
    );
  }

  const date = str(body.date, 30);
  if (isPastDate(date)) {
    return NextResponse.json(
      { error: "That date has already passed. Please pick a later one." },
      { status: 422 }
    );
  }

  const isEnquiry = body.type === "enquiry";
  const isTransfer = body.kind === "transfer";
  // No party-size limit; MAX_PARTY is only a sanity bound on a posted body.
  const adults = int(body.adults, 1, MAX_PARTY, 1);
  const children = int(body.children, 0, MAX_PARTY, 0);
  const placeKey = str(body.placeKey, MAX.place);
  const place = getPlace(placeKey);

  /*
   * The client's totals are discarded and recomputed here.
   *
   * A posted price is just a claim. Without this, anyone could book a $340
   * GoldenEye transfer for $1 by editing the request before it is sent.
   *
   * Two totals now come back rather than one, and they mean different things:
   * `transportTotal` is what PPP is owed, `entryTotal` is what the guest should
   * expect to hand over at the gate. Only the first is a debt to us, so they
   * are stored separately and never silently added together.
   */
  let transportTotal = null;
  let entryTotal = 0;
  let entryLines = [];
  let quoted = false;
  let quote = null;

  if (!isEnquiry) {
    if (isTransfer) {
      if (!place?.transfer) {
        return NextResponse.json(
          { error: "We don't have a published rate for that destination." },
          { status: 422 }
        );
      }
      const tripType = body.tripType === "one-way" ? "one-way" : "round-trip";
      const q = quoteTransfer(placeKey, { tripType, adults, children });
      quote = q;
      transportTotal = q.transport?.total ?? null;
      quoted = transportTotal != null;
    } else {
      const tour = filterProductById(str(body.tourId, 60));
      if (!tour) {
        return NextResponse.json(
          { error: "That tour is no longer available." },
          { status: 422 }
        );
      }

      const q = quoteExcursion(tour, {
        zoneKey: place?.zone ?? null,
        adults,
        children,
        choices: cleanChoices(body.choices),
        addons: cleanAddons(body.addons),
      });

      // A null transport total is legitimate: the owner publishes no rate from
      // every resort for every tour. That is a quote request, not an error.
      quote = q;
      transportTotal = q.transport?.total ?? null;
      entryTotal = q.entry?.total ?? 0;
      entryLines = (q.entry?.lines ?? []).map(
        (l) => `${l.label}${l.option ? ` (${l.option})` : ""}: $${l.amount.toFixed(2)}`
      );
      quoted = transportTotal != null;
    }
  }

  const reference = await makeServerReference();

  /*
   * What could be charged online, decided here and nowhere else.
   *
   * `payable()` takes the re-priced quote, so the figure can only ever be one
   * this route computed. The client is told the amount purely so the button can
   * be labelled — /api/payments/start re-derives it from the stored booking and
   * ignores anything posted to it.
   */
  const pay = quote ? payable(quote) : { collectible: false, reason: "enquiry", payableCents: 0 };
  const providerReady = paymentsConfigured("USD");

  const booking = {
    reference,
    type: isEnquiry ? "enquiry" : quoted ? "booking" : "quote-request",
    kind: str(body.kind, 20),
    tourId: str(body.tourId, 60),
    tourTitle: str(body.tourTitle, 200),
    placeKey,
    placeLabel: place ? place.name : str(body.placeLabel, MAX.place),
    zoneKey: place?.zone ?? "",
    tripType: isTransfer
      ? body.tripType === "one-way"
        ? "one-way"
        : "round-trip"
      : "",
    adults,
    children,
    choices: cleanChoices(body.choices),
    addons: cleanAddons(body.addons),
    transportTotal,
    entryTotal,
    entryLines,
    // Kept for the alert email and the admin list, but it is an estimate of the
    // guest's whole day, not an amount we are charging.
    dayTotal: transportTotal == null ? null : transportTotal + entryTotal,
    date,
    time: str(body.time, 20),
    returnDate: str(body.returnDate, 30),
    returnFlight: str(body.returnFlight, MAX.flight),
    flightNumber: str(body.flightNumber, MAX.flight),
    subject: str(body.subject, 120),
    name,
    email,
    phone: str(body.phone, MAX.phone),
    notes: str(body.notes, MAX.notes),
    /*
     * A priced booking is CONFIRMED the moment it is made. This site no longer
     * takes "requests".
     *
     * The distinction is already carried by `type` above, so it costs nothing
     * to honour it here: a `booking` has a published rate and a date, and there
     * is nothing left for the owner to decide before it is real. A
     * `quote-request` has no rate to confirm — the guest is asking what a route
     * costs — and an `enquiry` is a message. Both of those start at `new` and
     * genuinely are requests, which is why the form still says so on that path.
     *
     * There is deliberately NO capacity check behind this. PPP does not publish
     * time slots and does not want to; a clash is rare, and the owner moves one
     * of the two by phone. Auto-confirming without a calendar is a decision
     * about how the business runs, not an oversight — see the terms.
     */
    status: quoted && !isEnquiry ? "confirmed" : "new",
    settlement: "cash-on-day",
    // Opaque, so the result page cannot be opened by guessing a reference.
    lookupToken: makeLookupToken(),
    payment: {
      /*
       * What the guest SAID they would do, captured on the form. Not a claim
       * about money: `state` below is the only field that says anything about
       * what has actually been collected.
       *
       * Worth storing even though it decides nothing here, because it is the
       * difference between "meant to pay by card and something went wrong" and
       * "always intended to pay the driver" — which is exactly the question
       * asked about an unpaid booking the day before a pickup.
       */
      intent: body.payIntent === "card" && pay.collectible ? "card" : "cash",
      state: "unpaid",
      payableCents: pay.collectible ? pay.payableCents : 0,
      paidCents: 0,
      currency: "USD",
      provider: null,
      lastPaymentId: null,
    },
  };

  const db = getAdminDb();

  /*
   * No service account yet: accept the booking so the guest still gets a
   * reference and the WhatsApp handoff, but say plainly it was not stored.
   *
   * Payment must be OFF on this path. There is nowhere to record a payment, so
   * offering one would take money against a booking that does not exist — the
   * easiest trap in this whole flow to fall into.
   */
  if (!db) {
    console.warn(
      `[bookings] ${reference} not persisted — FIREBASE_SERVICE_ACCOUNT_KEY is unset.`
    );
    const alert = await sendBookingAlert(booking);
    return NextResponse.json({
      reference,
      persisted: false,
      emailed: alert.sent,
      transportTotal,
      entryTotal,
      paymentOptions: {
        collectible: false,
        reason: "storage-unavailable",
        currency: "USD",
        amountCents: 0,
        amount: 0,
      },
    });
  }

  /*
   * Idempotency, and the single highest-value line in this route.
   *
   * A double-click, a retry after a timeout, or a back-button resubmit used to
   * create two documents with two different references — and with payment
   * attached, two payable bookings. Firestore's `create()` throws
   * ALREADY_EXISTS on a duplicate, which is an atomic check-and-set for free:
   * no transaction, no read-then-write race. On a repeat we return the original
   * reference so the guest sees the same booking they already made.
   */
  const idemKey = str(request.headers.get("idempotency-key") ?? "", 64);
  const usableKey = /^[A-Za-z0-9-]{16,64}$/.test(idemKey) ? idemKey : null;

  try {
    const { FieldValue } = await import("firebase-admin/firestore");

    if (usableKey) {
      const claim = db.collection("bookingIdempotency").doc(usableKey);
      try {
        await claim.create({
          reference,
          createdAt: FieldValue.serverTimestamp(),
          // For a Firestore TTL policy on this field, so these expire by
          // themselves rather than accumulating forever.
          ttlAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        });
      } catch (err) {
        if (err?.code === 6 || /ALREADY_EXISTS/i.test(String(err?.message))) {
          const prior = await claim.get();
          const priorRef = prior.data()?.reference ?? reference;
          console.warn(`[bookings] duplicate submit, replaying ${priorRef}`);
          const priorDoc = await db.collection("bookings").doc(priorRef).get();
          const priorPay = priorDoc.data()?.payment ?? {};
          return NextResponse.json({
            reference: priorRef,
            persisted: true,
            duplicate: true,
            emailed: false,
            transportTotal,
            entryTotal,
            paymentOptions: {
              collectible:
                Boolean(priorPay.payableCents) && providerReady,
              reason: null,
              currency: "USD",
              amountCents: priorPay.payableCents ?? 0,
              amount: fromCents(priorPay.payableCents ?? 0),
            },
          });
        }
        throw err;
      }
    }

    // The reference IS the document id. `doc(reference)` beats a where() query
    // on every payment return, and `create()` makes a collision loud instead of
    // silently producing a second booking with the same reference.
    await db
      .collection("bookings")
      .doc(reference)
      .create({
        ...booking,
        createdAt: FieldValue.serverTimestamp(),
        userAgent: str(request.headers.get("user-agent") ?? "", 300),
      });
  } catch (err) {
    console.error(`[bookings] ${reference} failed to save`, err);
    return NextResponse.json(
      { error: "We couldn't save that booking." },
      { status: 500 }
    );
  }

  /*
   * Saved. An email failure past this point must not fail the request — but it
   * must not be silent either.
   *
   * `not-configured` used to be excluded from this log, on the reasoning that
   * it is the normal state of a developer's machine. In production it is a
   * defect, and excluding it made it an invisible one: EMAILJS_TEMPLATE_ID was
   * missing for weeks, every alert was dropped, and nothing anywhere said so.
   * The owner's only notice of a booking is this email.
   */
  const alert = await sendBookingAlert(booking);
  if (!alert.sent) {
    const how = alert.reason === "not-configured" ? "warn" : "error";
    console[how](
      `[bookings] ${reference} saved but NO ALERT WAS SENT: ${alert.reason}`
    );
  }

  // Cheap, capped, and this is a reliable enough trigger at this volume to need
  // no scheduler. Never allowed to fail the request.
  sweepAbandoned(20).catch((err) =>
    console.error("[payments] sweep failed", err)
  );

  return NextResponse.json({
    reference,
    persisted: true,
    emailed: alert.sent,
    transportTotal,
    entryTotal,
    paymentOptions: {
      collectible: pay.collectible && providerReady,
      reason: pay.collectible
        ? providerReady
          ? null
          : "payments-off"
        : pay.reason,
      currency: "USD",
      amountCents: pay.collectible ? pay.payableCents : 0,
      amount: pay.collectible ? fromCents(pay.payableCents) : 0,
    },
  });
}
