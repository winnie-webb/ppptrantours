import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { sendBookingAlert } from "@/lib/notify";
import { makeReference } from "@/lib/booking-shared";
import { priceBooking } from "@/app/products/product";

// firebase-admin needs Node built-ins; it cannot run on the edge runtime.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX = { name: 120, email: 200, phone: 40, hotel: 160, flight: 20, notes: 2000 };

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
  const adults = int(body.adults, 1, 30, 1);
  const children = int(body.children, 0, 30, 0);

  /*
   * Price is recomputed here and the client's `total` is discarded. The form
   * posts a number, and a posted number is just a claim — without this, anyone
   * could book a $400 airport transfer for $1 by editing the request.
   *
   * Enquiries have no tour attached and legitimately total zero.
   */
  let priced = null;
  if (!isEnquiry) {
    priced = priceBooking({
      tourId: body.tourId,
      pickupKey: body.pickupKey,
      adults,
      children,
    });

    if (!priced) {
      return NextResponse.json(
        { error: "That tour or pickup point is no longer available." },
        { status: 422 }
      );
    }
  }

  const reference = makeReference();
  const booking = {
    reference,
    type: isEnquiry ? "enquiry" : "booking",
    tourId: str(body.tourId, 60),
    tourTitle: str(body.tourTitle, 200),
    category: str(body.category, 10),
    pickupKey: priced ? priced.pickup.key : "",
    pickupLabel: priced ? priced.pickup.label : str(body.pickupLabel, 160),
    ratePerAdult: priced ? priced.rate : 0,
    adults,
    children,
    total: priced ? priced.total : 0,
    date: str(body.date, 30),
    time: str(body.time, 20),
    flightNumber: str(body.flightNumber, MAX.flight),
    hotel: str(body.hotel, MAX.hotel),
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
      total: booking.total,
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

  // `total` is the server's own figure, not the one that was posted — the
  // caller can reconcile it against what the guest was shown.
  return NextResponse.json({
    reference,
    persisted: true,
    emailed: alert.sent,
    total: booking.total,
  });
}
