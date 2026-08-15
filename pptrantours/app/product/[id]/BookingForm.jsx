"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  FaWhatsapp,
  FaCheckCircle,
  FaMinus,
  FaPlus,
  FaLock,
  FaSpinner,
  FaExclamationTriangle,
} from "react-icons/fa";
import { CHILD_RATE, formatPrice } from "@/app/products/product";
import { createBooking } from "@/lib/bookings";
import { site } from "@/app/data/site";

export default function BookingForm({ tour }) {
  const isTransfer = tour.category === "at";

  const [pickupKey, setPickupKey] = useState(tour.pickups[0]?.key ?? "");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [form, setForm] = useState({
    date: "",
    time: "",
    flightNumber: "",
    hotel: "",
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  const [status, setStatus] = useState("idle"); // idle | sending | done | error
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const pickup = useMemo(
    () => tour.pickups.find((p) => p.key === pickupKey) ?? tour.pickups[0],
    [tour.pickups, pickupKey]
  );

  const rate = pickup?.price ?? tour.priceLowest;
  const total = rate * adults + rate * CHILD_RATE * children;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setError("");

    try {
      const res = await createBooking({
        tourId: tour.id,
        tourTitle: tour.title,
        category: tour.category,
        pickupKey: pickup?.key ?? "",
        pickupLabel: pickup?.label ?? "",
        ratePerAdult: rate,
        adults,
        children,
        total,
        ...form,
      });
      setResult(res);
      setStatus("done");
    } catch (err) {
      console.error("Booking failed", err);
      setError(
        "We couldn't save that booking. Please try again, or send it to us on WhatsApp and we'll confirm by hand."
      );
      setStatus("error");
    }
  };

  if (status === "done" && result) {
    return (
      <div className="card p-8 text-center">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-crimson-50 text-2xl text-crimson-600">
          <FaCheckCircle />
        </span>
        <h3 className="mt-5 font-display text-2xl font-semibold text-ink">
          Request received.
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">
          Your reference is{" "}
          <span className="font-semibold text-ink">{result.reference}</span>. Keep it —
          quoting it gets you an answer fastest. We&apos;ll confirm your driver and
          exact pickup time by email.
        </p>

        {!result.persisted && (
          <p className="mx-auto mt-5 max-w-sm rounded-xl bg-gold-200/40 px-4 py-3 text-xs leading-relaxed text-ink/70">
            Online booking storage isn&apos;t switched on for this site yet. Send the
            details straight to us on WhatsApp below and we&apos;ll lock it in.
          </p>
        )}

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <a
            href={result.whatsappUrl}
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
          >
            <FaWhatsapp className="text-lg" />
            Confirm on WhatsApp
          </a>
          <Link href="/tours" className="btn-ghost">
            Browse more tours
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card overflow-hidden">
      {/* Price header */}
      <div className="border-b border-ink/[0.07] bg-sand px-6 py-5">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-ink/45">
              From
            </p>
            <p className="font-display text-3xl font-semibold text-crimson-700">
              {formatPrice(tour.priceLowest)}
              <span className="ml-1.5 text-sm font-medium text-ink/45">/ person</span>
            </p>
          </div>
          <span className="rounded-full bg-crimson-600/10 px-3 py-1.5 text-xs font-semibold text-crimson-700">
            {tour.duration}
          </span>
        </div>
      </div>

      <div className="space-y-5 p-6">
        {/* Pickup */}
        <div>
          <label htmlFor="pickup" className="label">
            {isTransfer ? "Drop-off area" : "Pickup area"}
          </label>
          <select
            id="pickup"
            value={pickupKey}
            onChange={(e) => setPickupKey(e.target.value)}
            className="field"
          >
            {tour.pickups.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label} — {formatPrice(p.price)} pp
              </option>
            ))}
          </select>
          <p className="mt-1.5 text-xs text-ink/45">
            Not listed? Pick the closest and tell us in the notes — we cover the
            whole island.
          </p>
        </div>

        {/* Travellers */}
        <div className="grid grid-cols-2 gap-4">
          <Stepper
            label="Adults"
            value={adults}
            min={1}
            onChange={setAdults}
            hint={`${formatPrice(rate)} each`}
          />
          <Stepper
            label="Children"
            value={children}
            min={0}
            onChange={setChildren}
            hint={`${formatPrice(rate * CHILD_RATE)} each`}
          />
        </div>

        {/* When */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className="label">
              {isTransfer ? "Arrival date" : "Tour date"}
            </label>
            <input
              id="date"
              type="date"
              required
              value={form.date}
              onChange={set("date")}
              className="field"
            />
          </div>
          <div>
            <label htmlFor="time" className="label">
              {isTransfer ? "Landing time" : "Pickup time"}
            </label>
            <input
              id="time"
              type="time"
              value={form.time}
              onChange={set("time")}
              className="field"
            />
          </div>
        </div>

        {isTransfer && (
          <div>
            <label htmlFor="flightNumber" className="label">
              Flight number
            </label>
            <input
              id="flightNumber"
              type="text"
              placeholder="e.g. AA 1573"
              value={form.flightNumber}
              onChange={set("flightNumber")}
              className="field"
            />
            <p className="mt-1.5 text-xs text-ink/45">
              We track it and adjust for delays at no extra charge.
            </p>
          </div>
        )}

        <div>
          <label htmlFor="hotel" className="label">
            Hotel, villa or pier
          </label>
          <input
            id="hotel"
            type="text"
            placeholder="e.g. Riu Montego Bay"
            value={form.hotel}
            onChange={set("hotel")}
            className="field"
          />
        </div>

        <div className="hairline" />

        {/* Guest */}
        <div>
          <label htmlFor="name" className="label">
            Full name
          </label>
          <input
            id="name"
            type="text"
            required
            value={form.name}
            onChange={set("name")}
            className="field"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="email" className="label">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={set("email")}
              className="field"
            />
          </div>
          <div>
            <label htmlFor="phone" className="label">
              Phone / WhatsApp
            </label>
            <input
              id="phone"
              type="tel"
              value={form.phone}
              onChange={set("phone")}
              className="field"
            />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="label">
            Anything we should know?
          </label>
          <textarea
            id="notes"
            rows={3}
            placeholder="Car seats, extra stops, dietary needs, a second attraction you'd like to add…"
            value={form.notes}
            onChange={set("notes")}
            className="field resize-none"
          />
        </div>

        {/* Total */}
        <div className="rounded-xl bg-ink px-5 py-4 text-white">
          <div className="flex items-center justify-between text-sm text-white/60">
            <span>
              {adults} adult{adults === 1 ? "" : "s"}
              {children > 0 && `, ${children} child${children === 1 ? "" : "ren"}`}
            </span>
            <span>{formatPrice(rate)} pp</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between border-t border-white/10 pt-3">
            <span className="text-sm font-semibold">Estimated total</span>
            <span className="font-display text-3xl font-semibold text-gold-400">
              ${total.toFixed(2)}
            </span>
          </div>
          <p className="mt-2 text-[0.7rem] leading-relaxed text-white/45">
            Transport only. Attraction entry fees are paid at the gate and quoted
            separately, so you always know what&apos;s ours and what isn&apos;t.
          </p>
        </div>

        {status === "error" && (
          <p className="flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
            <FaExclamationTriangle className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={status === "sending"}
          className="btn-primary w-full disabled:opacity-60"
        >
          {status === "sending" ? (
            <>
              <FaSpinner className="animate-spin" />
              Sending…
            </>
          ) : (
            "Request this booking"
          )}
        </button>

        <p className="flex items-center justify-center gap-2 text-xs text-ink/45">
          <FaLock className="text-[0.65rem]" />
          No payment taken now — we confirm availability first.
        </p>

        <a
          href={site.contact.whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="btn-ghost w-full"
        >
          <FaWhatsapp className="text-base text-crimson-600" />
          Rather just message us?
        </a>
      </div>
    </form>
  );
}

function Stepper({ label, value, min, onChange, hint }) {
  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-ink/15 p-1.5">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink/5 text-ink/70 transition hover:bg-ink/10 disabled:opacity-30"
        >
          <FaMinus className="text-[0.6rem]" />
        </button>
        <span className="flex-1 text-center text-sm font-semibold text-ink">
          {value}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange(Math.min(30, value + 1))}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink/5 text-ink/70 transition hover:bg-ink/10"
        >
          <FaPlus className="text-[0.6rem]" />
        </button>
      </div>
      <p className="mt-1.5 text-xs text-ink/45">{hint}</p>
    </div>
  );
}
