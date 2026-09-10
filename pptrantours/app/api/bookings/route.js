import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { sendBookingAlert } from "@/lib/notify";
import { makeReference } from "@/lib/booking-shared";
import { filterProductById } from "@/app/products/product";
import { quoteExcursion, quoteTransfer } from "@/app/products/pricing";
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

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
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

  const isEnquiry = body.type === "enquiry";
  const isTransfer = body.kind === "transfer";
  const adults = int(body.adults, 1, 30, 1);
  const children = int(body.children, 0, 30, 0);
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
      transportTotal = q.transport?.total ?? null;
      entryTotal = q.entry?.total ?? 0;
      entryLines = (q.entry?.lines ?? []).map(
        (l) => `${l.label}${l.option ? ` (${l.option})` : ""}: $${l.amount.toFixed(2)}`
      );
      quoted = transportTotal != null;
    }
  }

  const reference = makeReference();
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
    date: str(body.date, 30),
    time: str(body.time, 20),
    returnDate: str(body.returnDate, 30),
    returnFlight: str(body.returnFlight, MAX.flight),
    flightNumber: str(body.flightNumber, MAX.flight),
    subject: str(body.subject, 120),
    name,
    email,
    phone: str(body.phone, MAX.phone),
    notes: str(body.notes, MAX.notes),
    status: "new",
  };

  const db = getAdminDb();

  // No service account yet: accept the booking so the guest still gets a
  // reference and the WhatsApp handoff, but say plainly it was not stored.
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
    });
  }

  try {
    const { FieldValue } = await import("firebase-admin/firestore");
    await db.collection("bookings").add({
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

  // Saved. An email failure past this point must not fail the request.
  const alert = await sendBookingAlert(booking);
  if (!alert.sent && alert.reason !== "not-configured") {
    console.error(`[bookings] ${reference} saved but alert failed: ${alert.reason}`);
  }

  return NextResponse.json({
    reference,
    persisted: true,
    emailed: alert.sent,
    transportTotal,
    entryTotal,
  });
}
