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
  FaMapMarkerAlt,
  FaInfoCircle,
} from "react-icons/fa";
import {
  quoteExcursion,
  quoteTransfer,
  money,
  perPerson,
  VEHICLE_CAPACITY,
  MAX_PARTY,
} from "@/app/products/pricing";
import { getPlace } from "@/app/data/places";
import { createBooking } from "@/lib/bookings";
import { site } from "@/app/data/site";
import { localePath } from "@/app/i18n/config";
import { usePlace } from "./PlaceProvider";

/**
 * One form for both halves of the catalogue.
 *
 * `mode="tour"`     the guest's resort decides the price, and the gates are
 *                   itemised beside it but never added to what we charge.
 * `mode="transfer"` the destination resort decides it, plus one-way or return.
 *
 * The two share every guest-detail field and the whole submit path, which is
 * why they are one component rather than two that drift apart.
 */
export default function BookingForm({ tour, locale = "en", dict, mode = "tour" }) {
  const isTransfer = mode === "transfer";
  const t = dict?.booking ?? {};
  const { place, zone, ready, openPicker } = usePlace();

  // A transfer page is *about* one resort, so it fixes its own destination
  // rather than using whatever the guest picked for excursions.
  const transferPlace = isTransfer ? tour.place : null;

  const [tripType, setTripType] = useState("round-trip");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [choices, setChoices] = useState({});
  const [addons, setAddons] = useState([]);
  const [form, setForm] = useState({
    date: "",
    time: "",
    flightNumber: "",
    returnDate: "",
    returnFlight: "",
    name: "",
    email: "",
    phone: "",
    notes: "",
  });

  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const quote = useMemo(() => {
    if (isTransfer) {
      return quoteTransfer(transferPlace.key, { tripType, adults, children });
    }
    return quoteExcursion(tour, {
      zoneKey: zone,
      adults,
      children,
      choices,
      addons,
    });
  }, [isTransfer, transferPlace, tripType, tour, zone, adults, children, choices, addons]);

  const pax = adults + children;
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // A tour needs a resort before it can be priced; a transfer already has one.
  const needsPlace = !isTransfer && ready && !place;
  const unpriced = !isTransfer && ready && place && !quote.transport;

  const onSubmit = async (e) => {
    e.preventDefault();
    setStatus("sending");
    setError("");

    try {
      const res = await createBooking({
        tourId: tour.id,
        tourTitle: tour.title,
        kind: isTransfer ? "transfer" : tour.kind,
        placeKey: isTransfer ? transferPlace.key : place?.key ?? "",
        placeLabel: isTransfer ? transferPlace.name : place?.name ?? "",
        zoneKey: isTransfer ? "" : zone ?? "",
        tripType: isTransfer ? tripType : "",
        adults,
        children,
        choices,
        addons,
        transportTotal: quote.transport?.total ?? null,
        entryTotal: quote.entry?.total ?? 0,
        entryLines: (quote.entry?.lines ?? []).map(
          (l) => `${l.label}${l.option ? ` (${l.option})` : ""}: ${money(l.amount)}`
        ),
        total: quote.dayTotal,
        ...form,
      });
      setResult(res);
      setStatus("done");
    } catch (err) {
      console.error("Booking failed", err);
      setError(
        t.errorSaving ??
          "We couldn't save that booking. Please try again, or send it to us on WhatsApp and we'll confirm by hand."
      );
      setStatus("error");
    }
  };

  if (status === "done" && result) {
    return <Success result={result} locale={locale} dict={dict} />;
  }

  return (
    <form onSubmit={onSubmit} className="card overflow-hidden">
      <PriceHeader
        quote={quote}
        tour={tour}
        isTransfer={isTransfer}
        needsPlace={needsPlace}
        unpriced={unpriced}
        dict={dict}
      />

      <div className="space-y-5 p-6">
        {/* Where from / where to */}
        {isTransfer ? (
          <div>
            <span className="label">{t.tripType ?? "Trip type"}</span>
            <div className="grid grid-cols-2 gap-2 rounded-xl border border-ink/15 p-1.5">
              {[
                { key: "round-trip", label: t.roundTrip ?? "Round trip" },
                { key: "one-way", label: t.oneWay ?? "One way" },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setTripType(opt.key)}
                  aria-pressed={tripType === opt.key}
                  className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${
                    tripType === opt.key
                      ? "bg-crimson-600 text-white shadow-sm"
                      : "text-ink/60 hover:bg-ink/5"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-ink/45">
              {t.transferTo ?? "To"}{" "}
              <span className="font-semibold text-ink/70">
                {transferPlace.name}
              </span>
            </p>
          </div>
        ) : (
          <div>
            <span className="label">{t.stayingAt ?? "Where are you staying?"}</span>
            <button
              type="button"
              onClick={openPicker}
              className="flex w-full items-center gap-3 rounded-xl border border-ink/15 px-4 py-3 text-left transition hover:border-crimson-300 hover:bg-crimson-50/40"
            >
              <FaMapMarkerAlt
                className={`shrink-0 text-sm ${
                  place ? "text-crimson-600" : "text-ink/30"
                }`}
              />
              <span
                className={`flex-1 text-sm ${
                  place ? "font-semibold text-ink" : "text-ink/50"
                }`}
              >
                {ready && place
                  ? place.name
                  : t.choosePlace ?? "Choose your hotel or pier"}
              </span>
              <span className="text-xs font-semibold text-crimson-700">
                {ready && place ? t.change ?? "Change" : t.choose ?? "Choose"}
              </span>
            </button>
          </div>
        )}

        {/* Party size */}
        <div className="grid grid-cols-2 gap-4">
          <Stepper
            label={t.adults ?? "Adults"}
            value={adults}
            min={1}
            onChange={setAdults}
          />
          <Stepper
            label={t.children ?? "Children"}
            value={children}
            min={0}
            onChange={setChildren}
          />
        </div>
        <p className="-mt-2 flex items-start gap-2 text-xs leading-relaxed text-ink/50">
          <FaInfoCircle className="mt-0.5 shrink-0 text-ink/30" />
          {pax <= VEHICLE_CAPACITY
            ? t.vehicleNote ??
              `One private vehicle covers up to ${VEHICLE_CAPACITY} people for the same price.`
            : t.extraNote ??
              `${pax} people — the price above includes ${
                pax - VEHICLE_CAPACITY
              } extra beyond the first ${VEHICLE_CAPACITY}.`}
        </p>

        {/* Entry-fee choices */}
        {!isTransfer &&
          (tour.entry?.components ?? [])
            .filter((c) => c.kind === "choice")
            .map((c) => (
              <div key={c.key}>
                <label htmlFor={`choice-${c.key}`} className="label">
                  {c.label}
                </label>
                <select
                  id={`choice-${c.key}`}
                  value={choices[c.key] ?? c.options[0].key}
                  onChange={(e) =>
                    setChoices((prev) => ({ ...prev, [c.key]: e.target.value }))
                  }
                  className="field"
                >
                  {c.options.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label} — {o.from ? `${t.fromWord ?? "from"} ` : ""}
                      {money(o.adult)}
                      {o.child != null && o.child !== o.adult
                        ? ` / ${money(o.child)} ${t.childWord ?? "child"}`
                        : ""}
                    </option>
                  ))}
                </select>
                <p className="mt-1.5 text-xs text-ink/45">
                  {t.gateNote ?? "Paid at the gate, not to us."}
                </p>
              </div>
            ))}

        {/* Optional extras at the attraction */}
        {!isTransfer && (tour.entry?.addons ?? []).length > 0 && (
          <div className="space-y-2">
            <span className="label">{t.addons ?? "Optional extras"}</span>
            {tour.entry.addons.map((a) => (
              <label
                key={a.key}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-ink/15 px-4 py-3 transition hover:bg-crimson-50/40"
              >
                <input
                  type="checkbox"
                  checked={addons.includes(a.key)}
                  onChange={(e) =>
                    setAddons((prev) =>
                      e.target.checked
                        ? [...prev, a.key]
                        : prev.filter((k) => k !== a.key)
                    )
                  }
                  className="h-4 w-4 accent-crimson-600"
                />
                <span className="flex-1 text-sm text-ink/80">{a.label}</span>
                <span className="text-sm font-semibold text-ink/60">
                  {money(a.adult)}
                </span>
              </label>
            ))}
          </div>
        )}

        {/* When */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="date" className="label">
              {isTransfer ? t.arrivalDate ?? "Arrival date" : t.tourDate ?? "Tour date"}
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
              {isTransfer ? t.landingTime ?? "Landing time" : t.pickupTime ?? "Pickup time"}
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
          <>
            <div>
              <label htmlFor="flightNumber" className="label">
                {t.flightNumber ?? "Arrival flight number"}
              </label>
              <input
                id="flightNumber"
                type="text"
                placeholder="AA 1573"
                value={form.flightNumber}
                onChange={set("flightNumber")}
                className="field"
              />
              <p className="mt-1.5 text-xs text-ink/45">
                {t.flightNote ??
                  "We track it and adjust for delays at no extra charge."}
              </p>
            </div>

            {tripType === "round-trip" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="returnDate" className="label">
                    {t.returnDate ?? "Return date"}
                  </label>
                  <input
                    id="returnDate"
                    type="date"
                    value={form.returnDate}
                    onChange={set("returnDate")}
                    className="field"
                  />
                </div>
                <div>
                  <label htmlFor="returnFlight" className="label">
                    {t.returnFlight ?? "Return flight"}
                  </label>
                  <input
                    id="returnFlight"
                    type="text"
                    placeholder="AA 1574"
                    value={form.returnFlight}
                    onChange={set("returnFlight")}
                    className="field"
                  />
                </div>
              </div>
            )}
          </>
        )}

        <div className="hairline" />

        <div>
          <label htmlFor="name" className="label">
            {t.name ?? "Full name"}
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
              {t.email ?? "Email"}
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
              {t.phone ?? "Phone / WhatsApp"}
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
            {t.notes ?? "Anything we should know?"}
          </label>
          <textarea
            id="notes"
            rows={3}
            placeholder={
              t.notesPlaceholder ??
              "Car seats, extra stops, a second attraction you'd like to add…"
            }
            value={form.notes}
            onChange={set("notes")}
            className="field resize-none"
          />
        </div>

        <Breakdown
          quote={quote}
          isTransfer={isTransfer}
          tripType={tripType}
          adults={adults}
          children={children}
          needsPlace={needsPlace}
          unpriced={unpriced}
          dict={dict}
        />

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
              {t.sending ?? "Sending…"}
            </>
          ) : unpriced || needsPlace ? (
            t.requestQuote ?? "Request a price"
          ) : (
            t.submit ?? "Request this booking"
          )}
        </button>

        <p className="flex items-center justify-center gap-2 text-xs text-ink/45">
          <FaLock className="text-[0.65rem]" />
          {t.noPayment ?? "No payment taken now — we confirm availability first."}
        </p>

        <a
          href={site.contact.whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="btn-ghost w-full"
        >
          <FaWhatsapp className="text-base text-crimson-600" />
          {t.ratherMessage ?? "Rather just message us?"}
        </a>
      </div>
    </form>
  );
}

/* ── Pieces ─────────────────────────────────────────────────────────────────── */

function PriceHeader({ quote, tour, isTransfer, needsPlace, unpriced, dict }) {
  const t = dict?.booking ?? {};
  // The party size is known here, so this per-head figure is exact rather
  // than the "from" estimate the cards have to use.
  const each = quote.transport
    ? perPerson(quote.transport.total, quote.pax)
    : null;

  return (
    <div className="border-b border-ink/[0.07] bg-sand px-6 py-5">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-ink/45">
            {isTransfer
              ? t.transferPrice ?? "Private transfer"
              : t.transportLabel ?? "Transport"}
          </p>
          {quote.transport ? (
            <>
              <p className="font-display text-3xl font-semibold text-crimson-700">
                {money(each)}
                <span className="ml-1.5 text-sm font-medium text-ink/45">
                  {dict?.price?.perPerson ?? "/ person"}
                </span>
              </p>
              <p className="text-xs text-ink/45">
                {money(quote.transport.total)}{" "}
                {t.perVehicleLong ?? "per vehicle"}
              </p>
            </>
          ) : (
            <p className="font-display text-2xl font-semibold text-crimson-700">
              {needsPlace
                ? t.pickResortFirst ?? "Pick your resort"
                : t.askUsPrice ?? "We'll quote it"}
            </p>
          )}
        </div>
        <span className="rounded-full bg-crimson-600/10 px-3 py-1.5 text-xs font-semibold text-crimson-700">
          {dict?.durations?.[tour.duration] ?? tour.duration}
        </span>
      </div>
    </div>
  );
}

function Breakdown({
  quote,
  isTransfer,
  tripType,
  adults,
  children,
  needsPlace,
  unpriced,
  dict,
}) {
  const t = dict?.booking ?? {};
  const { transport, entry } = quote;

  /*
   * No transport figure covers three different situations, and this must catch
   * all of them before touching `transport`:
   *
   *   - the server render, where localStorage has not been read yet so we do
   *     not know the resort (`ready` is false, so `needsPlace` is too);
   *   - the guest genuinely has not picked one;
   *   - they have, and the owner publishes no rate for that run.
   *
   * The first two say the same thing to the guest. Only the third is different.
   */
  if (!transport) {
    return (
      <div className="rounded-xl bg-gold-200/40 px-5 py-4 text-sm leading-relaxed text-ink/70">
        {unpriced
          ? t.unpricedHint ??
            "We haven't published a set rate from your resort for this one. Send the request through and we'll come back with a firm price — same day, no markup."
          : t.pickResortHint ??
            "Tell us which resort you're staying at and the exact price for your group appears here."}
      </div>
    );
  }

  const party =
    `${adults} ${adults === 1 ? t.adult ?? "adult" : t.adults ?? "adults"}` +
    (children > 0
      ? `, ${children} ${
          children === 1 ? t.child ?? "child" : t.childrenWord ?? "children"
        }`
      : "");

  return (
    <div className="overflow-hidden rounded-xl bg-ink text-white">
      <div className="space-y-2.5 px-5 py-4">
        <div className="flex items-baseline justify-between gap-4 text-sm">
          <span className="text-white/70">
            {isTransfer
              ? tripType === "round-trip"
                ? t.roundTrip ?? "Round trip"
                : t.oneWay ?? "One way"
              : t.transportLabel ?? "Transport"}
            <span className="ml-1.5 text-white/40">({party})</span>
          </span>
          <span className="shrink-0 font-semibold">
            {money(transport.total)}
          </span>
        </div>

        <div className="flex items-baseline justify-between gap-4 text-xs text-white/45">
          <span>{dict?.booking?.worksOutAt ?? "Works out at"}</span>
          <span className="shrink-0">
            {money(perPerson(transport.total, adults + children))}{" "}
            {dict?.price?.perPerson ?? "/ person"}
          </span>
        </div>

        {transport.extraPax > 0 && (
          <p className="text-xs text-white/40">
            {t.extraBreakdown ??
              `${money(transport.base)} for the first ${VEHICLE_CAPACITY}, plus ${
                transport.extraPax
              } × ${money(transport.extra)}`}
          </p>
        )}

        <p className="text-[0.7rem] leading-relaxed text-white/45">
          {transport.est
            ? t.estimatedNote ??
              "Indicative for your resort — he has not published a set rate from here, so we confirm the exact price before you pay anything."
            : t.transportIsOurs ??
              "This is what PPP charges. Nothing is added to it."}
        </p>
      </div>

      {entry && entry.lines.length > 0 && (
        <div className="space-y-2 border-t border-white/10 px-5 py-4">
          <p className="text-[0.68rem] font-semibold uppercase tracking-wider text-white/50">
            {t.gatesLabel ?? "Paid at the gate"}
          </p>
          {entry.lines.map((line) => (
            <div
              key={line.key + (line.addon ? "-addon" : "")}
              className="flex items-baseline justify-between gap-4 text-sm"
            >
              <span className="text-white/70">
                {line.label}
                {line.option && (
                  <span className="text-white/40"> · {line.option}</span>
                )}
              </span>
              <span className="shrink-0 text-white/80">
                {line.from ? `${t.fromWord ?? "from"} ` : ""}
                {money(line.amount)}
              </span>
            </div>
          ))}
          <p className="text-[0.7rem] leading-relaxed text-white/45">
            {t.gatesNote ??
              "Attraction tickets, paid on the day. We never resell them or add to them."}
          </p>
        </div>
      )}

      <div className="flex items-baseline justify-between border-t border-white/10 bg-white/[0.04] px-5 py-4">
        <span className="text-sm font-semibold">
          {entry && entry.lines.length > 0
            ? t.dayTotal ?? "Your day, all in"
            : t.total ?? "Total"}
        </span>
        <span className="text-right">
          <span className="block font-display text-3xl font-semibold text-gold-400">
            {quote.from ? (
              <span className="mr-1 text-base font-medium text-white/50">
                {t.fromWord ?? "from"}
              </span>
            ) : null}
            {money(quote.dayTotal)}
          </span>
          <span className="block text-xs text-white/45">
            {money(perPerson(quote.dayTotal, adults + children))}{" "}
            {dict?.price?.perPerson ?? "/ person"}
          </span>
        </span>
      </div>
    </div>
  );
}

function Success({ result, locale, dict }) {
  const t = dict?.booking ?? {};
  return (
    <div className="card p-8 text-center">
      <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-crimson-50 text-2xl text-crimson-600">
        <FaCheckCircle />
      </span>
      <h3 className="mt-5 font-display text-2xl font-semibold text-ink">
        {t.doneTitle ?? "Request received."}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-ink/60">
        {t.doneRef ?? "Your reference is"}{" "}
        <span className="font-semibold text-ink">{result.reference}</span>.{" "}
        {t.doneBody ??
          "Keep it — quoting it gets you an answer fastest. We'll confirm your driver and exact pickup time by email."}
      </p>

      {!result.persisted && (
        <p className="mx-auto mt-5 max-w-sm rounded-xl bg-gold-200/40 px-4 py-3 text-xs leading-relaxed text-ink/70">
          {t.notPersisted ??
            "Online booking storage isn't switched on for this site yet. Send the details straight to us on WhatsApp below and we'll lock it in."}
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
          {t.confirmWhatsApp ?? "Confirm on WhatsApp"}
        </a>
        <Link href={localePath(locale, "/tours")} className="btn-ghost">
          {t.browseMore ?? "Browse more tours"}
        </Link>
      </div>
    </div>
  );
}

function Stepper({ label, value, min, onChange }) {
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
          onClick={() => onChange(Math.min(MAX_PARTY, value + 1))}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink/5 text-ink/70 transition hover:bg-ink/10"
        >
          <FaPlus className="text-[0.6rem]" />
        </button>
      </div>
    </div>
  );
}
