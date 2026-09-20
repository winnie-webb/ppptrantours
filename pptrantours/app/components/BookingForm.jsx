"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  FaCreditCard,
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
import { createBooking, startPayment } from "@/lib/bookings";
import { site } from "@/app/data/site";
import { localePath } from "@/app/i18n/config";
import { usePlace } from "./PlaceProvider";
import PayPalCheckout from "./PayPalCheckout";

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
/**
 * Today, in the guest's own timezone, as the `yyyy-mm-dd` that `<input
 * type="date">` wants. Used as `min` so nobody can request a trip for last
 * Tuesday — the server rejects past dates too, this just stops the mistake
 * being made.
 *
 * Deliberately NOT computed during render: the server prerenders this form, and
 * a date baked in at build time would be wrong by the time anyone sees it and
 * would mismatch on hydration. It is filled in from an effect after mount, so
 * the first client render matches the server's exactly.
 */
/**
 * The message under a field that failed validation.
 *
 * `role="alert"` so a screen reader announces it when it appears, and the id
 * matches what the input points `aria-describedby` at.
 */
function FieldError({ id, children }) {
  if (!children) return null;
  return (
    <p
      id={id}
      role="alert"
      className="mt-1.5 flex items-start gap-1.5 text-xs font-medium text-red-700"
    >
      <FaExclamationTriangle className="mt-0.5 shrink-0 text-[0.65rem]" />
      {children}
    </p>
  );
}

function todayISO() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

/**
 * The asterisk beside a required field's label.
 *
 * `aria-hidden` because the input already carries `required` + `aria-required`,
 * which is what a screen reader announces; the glyph is for everyone reading
 * the form with their eyes. Only three of the eight fields here are required
 * and there was previously no way at all to tell which.
 */
function Req() {
  return (
    <span aria-hidden="true" className="ml-0.5 text-crimson-600">
      *
    </span>
  );
}

export default function BookingForm({
  tour,
  locale = "en",
  dict,
  mode = "tour",
  paymentsEnabled = false,
  /*
   * { clientId, currency } for the inline PayPal/card buttons, or null. Read
   * on the server at build time, same as `paymentsEnabled` — the client id is
   * public (it is in the SDK script URL on every PayPal site); the secret it
   * pairs with never leaves the server.
   */
  paypal = null,
}) {
  const isTransfer = mode === "transfer";
  // Memoised because `?? {}` mints a new object every render, which would make
  // the validation callback — and so the whole error map — recompute each time.
  const t = useMemo(() => dict?.booking ?? {}, [dict]);
  const { place, zone, ready, openPicker, choiceCount } = usePlace();

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
  const [honeypot, setHoneypot] = useState("");

  /*
   * Inline validation.
   *
   * `required` plus type="email" left the browser to police this, which gives
   * one native bubble on the first bad field and nothing at all for the cases
   * that actually cost a booking: a date in the past, a name of two letters, a
   * phone number too short to call back. The server checks all of this and
   * returns a single red banner — by which point the guest has lost which field
   * was wrong.
   *
   * `touched` keeps an error from appearing while someone is still typing their
   * email for the first time. After a submit attempt everything is treated as
   * touched, so nothing stays hidden once they have tried to send it.
   */
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  /*
   * Whether the resort was confirmed FOR THIS BOOKING.
   *
   * The resort is remembered in localStorage across the whole visit, so a guest
   * who picked one yesterday, or while pricing a different tour, arrives here
   * with it already filled in. That is helpful for browsing and dangerous at
   * the point of booking: the pickup address is the one thing on this form
   * nobody re-reads, and getting it wrong means a driver at the wrong hotel.
   *
   * So a remembered resort starts UNCONFIRMED and the form will not submit
   * until the guest says it is right. Picking one here counts as saying so;
   * inheriting one silently does not.
   */
  const [placeAgreed, setPlaceAgreed] = useState(false);

  /*
   * `choiceCount` is the provider's count of explicit picks in this page
   * session, so a resort the guest chose a moment ago needs no second
   * agreement while one restored from storage does. Plain derivation — no ref
   * read during render, no effect to keep in step.
   */
  const placeConfirmed = placeAgreed || choiceCount > 0;

  /*
   * How the guest intends to settle, chosen HERE rather than offered after the
   * booking exists.
   *
   * Defaults to cash, and that default is deliberate. Most of PPP's money
   * arrives in the vehicle, the terms promise cash is always available, and
   * pre-selecting the option that charges a card is the kind of default that
   * gets a business a chargeback rather than a customer. Card is an equal,
   * visible choice — not a nudge.
   */
  const [payMethod, setPayMethod] = useState("cash");

  /*
   * The date floors are written straight onto the DOM nodes rather than held in
   * state. `min` is a client-only value — a date baked in at build time would be
   * stale — and setting it through state would mean an extra render of the whole
   * form on mount purely to add one attribute. The outbound leg cannot be in the
   * past; the return leg cannot precede the outbound.
   */
  const dateRef = useRef(null);
  const returnDateRef = useRef(null);

  /*
   * One idempotency key per submission attempt, regenerated after a successful
   * one so a guest booking two tours in the same session gets two bookings
   * rather than a replay of the first.
   *
   * Both this and the dwell timestamp are set in an effect, not during render:
   * crypto.randomUUID() and Date.now() would differ between the server render
   * and the client and mismatch on hydration.
   */
  const idemKey = useRef(null);
  const openedAt = useRef(0);
  useEffect(() => {
    if (!idemKey.current) {
      idemKey.current =
        globalThis.crypto?.randomUUID?.() ??
        `k-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    }
    openedAt.current = Date.now();
  }, []);

  useEffect(() => {
    const today = todayISO();
    if (dateRef.current) dateRef.current.min = today;
    if (returnDateRef.current) returnDateRef.current.min = form.date || today;
  }, [form.date, tripType]);

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

  /** A remembered resort the guest has not yet said is still right. */
  const needsPlaceConfirm = !isTransfer && ready && Boolean(place) && !placeConfirmed;

  /*
   * The whole of validation, in one place, run on blur and again on submit.
   * Mirrors the server's rules in app/api/bookings/route.js rather than
   * inventing softer ones — a field this accepts and the server rejects is the
   * worst of both.
   */
  const validate = useCallback(() => {
    const errs = {};
    const req = t.errRequired ?? "Please fill this in.";

    if (!form.date) errs.date = req;
    else if (form.date < todayISO())
      errs.date = t.errDatePast ?? "Please choose today or a later date.";

    if (!form.name.trim()) errs.name = req;
    else if (form.name.trim().length < 2)
      errs.name = t.errNameShort ?? "Please give the name the booking is under.";

    if (!form.email.trim()) errs.email = req;
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim()))
      errs.email = t.errEmail ?? "That doesn't look like an email address.";

    // Optional, but a number we cannot ring is worse than no number.
    const digits = form.phone.replace(/\D/g, "");
    if (form.phone.trim() && digits.length < 7)
      errs.phone = t.errPhone ?? "That number looks too short to call back.";

    if (isTransfer && tripType === "round-trip" && form.returnDate && form.date) {
      if (form.returnDate < form.date)
        errs.returnDate =
          t.errReturnBeforeArrival ?? "Your return cannot be before you arrive.";
    }

    if (needsPlaceConfirm)
      errs.place = t.errConfirmPlace ?? "Please confirm where you are staying.";
    else if (needsPlace)
      errs.place = t.errPickPlace ?? "Please choose where you are staying.";

    return errs;
  }, [form, isTransfer, tripType, needsPlace, needsPlaceConfirm, t]);

  // Derived, not stored: the errors are a pure function of the form's values,
  // so there is nothing to keep in sync and no effect to run.
  const fieldErrors = useMemo(() => validate(), [validate]);

  const showError = (key) =>
    (submitAttempted || touched[key]) && fieldErrors[key] ? fieldErrors[key] : null;

  const blur = (key) => () => setTouched((prev) => ({ ...prev, [key]: true }));

  /*
   * Whether paying by card is even on the table.
   *
   * Mirrors `payable()` in app/products/pricing.js rather than asking the
   * server, because this decides what the guest SEES and the form has every
   * input already. The server re-derives it anyway and is the one that binds —
   * offering a card option the server would refuse costs a confused guest, not
   * a mispriced booking.
   *
   * An estimated fare is excluded on purpose: it is our inference, not the
   * owner's published rate, and the form promises we confirm it before anyone
   * pays.
   *
   * `paymentsEnabled` comes from the server, and it is the half the form
   * cannot work out alone: whether a payment provider is actually configured.
   * Without it this offered "Pay now by card" whenever a price existed, the
   * server then refused to collect, and the redirect was skipped in silence -
   * so choosing card and choosing cash produced identical screens. Offering a
   * payment method that cannot be honoured is worse than offering none.
   */
  const canOfferCard = Boolean(
    paymentsEnabled &&
      !needsPlace &&
      !unpriced &&
      quote.transport &&
      !quote.transport.est
  );

  /*
   * What the form will actually DO, as opposed to what was last clicked.
   *
   * A guest can pick card and then change resort to one with no published rate.
   * Derived during render rather than corrected by an effect: an effect would
   * mean a render showing "Book and pay now" for a booking that cannot be paid
   * for, followed by a second render fixing it. There is no external system to
   * synchronise here, so there is nothing for an effect to do.
   *
   * `payMethod` stays as the guest left it, so picking a priced resort again
   * restores their choice instead of silently forgetting it.
   */
  const payIntent = canOfferCard ? payMethod : "cash";

  const onSubmit = async (e) => {
    e.preventDefault();

    /*
     * Validation gates the send. `noValidate` on the form means the browser is
     * no longer doing this for us, which is the point — one consistent set of
     * messages in the guest's own language beats a native bubble in the
     * browser's.
     *
     * The first bad field is focused, because on a phone the error can easily
     * be off-screen above the button that was just pressed.
     */
    setSubmitAttempted(true);
    const errs = validate();
    const firstBad = Object.keys(errs)[0];
    if (firstBad) {
      setError("");
      setStatus("idle");
      const el =
        firstBad === "place"
          ? document.getElementById("place-field")
          : document.getElementById(firstBad);
      el?.scrollIntoView({ block: "center", behavior: "smooth" });
      el?.focus?.({ preventScroll: true });
      return;
    }

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
        // Abuse signals. `company` is the honeypot and must stay empty; a real
        // guest never sees the field.
        company: honeypot,
        formOpenedAt: openedAt.current,
        payIntent,
        ...form,
      }, { idempotencyKey: idemKey.current });
      setResult(res);
      setStatus("done");
      // A fresh key, so a second booking in the same session is a second
      // booking rather than a replay of this one.
      idemKey.current =
        globalThis.crypto?.randomUUID?.() ??
        `k-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      /*
       * Card was chosen, so go straight to PayPal rather than showing a
       * confirmation the guest has to click past.
       *
       * THE BOOKING IS ALREADY SAVED at this point, and that ordering is the
       * whole reason this is safe to do. If the payment never starts, or the
       * guest abandons PayPal, or their connection drops, the booking still
       * exists and the owner still has it — they simply pay the driver. The
       * reverse ordering, taking money before the booking is recorded, is how a
       * charge ends up with nothing attached to it.
       *
       * A failure here is NOT rethrown: falling through leaves the success
       * screen rendered with its own pay button and an explanation, which is a
       * far better place to land than the form's error state telling someone
       * their booking failed when it did not.
       */
      if (payIntent === "card" && res.paymentOptions?.collectible) {
        try {
          const url = await startPayment(res.reference);
          window.location.assign(url);
        } catch (payErr) {
          console.error("Payment could not start", payErr);
        }
      }
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
    return (
      <Success
        result={result}
        locale={locale}
        dict={dict}
        // Whether the card route was ATTEMPTED. Reaching this screen with
        // "card" set means the redirect did not happen, so the screen says so
        // instead of pretending the guest chose to pay later.
        payMethod={payIntent}
        paypal={paypal}
        quoted={!unpriced && !needsPlace}
      />
    );
  }

  return (
    // noValidate: validation is ours now, so the messages are translated and
    // every field's problem is stated next to it rather than one at a time.
    <form noValidate onSubmit={onSubmit} className="card relative overflow-hidden">
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
          <div id="place-field" tabIndex={-1}>
            <span className="label">{t.stayingAt ?? "Where are you staying?"}</span>

            {/*
              A resort carried over from earlier in the visit is stated loudly
              and has to be agreed to. It is the one field on this form a guest
              will not re-read, and the cost of it being wrong is a driver at
              the wrong hotel on the morning of a tour — so it is deliberately
              not a quiet pre-filled input.
            */}
            {needsPlaceConfirm ? (
              <div className="rounded-xl border-2 border-gold-400 bg-gold-200/25 p-4">
                <p className="flex items-start gap-2 text-xs font-semibold uppercase tracking-wide text-ink/70">
                  <FaExclamationTriangle className="mt-0.5 shrink-0 text-gold-600" />
                  {t.rememberedTitle ?? "Check this is still right"}
                </p>
                <p className="mt-2.5 font-display text-xl font-semibold leading-snug text-ink">
                  {place.name}
                </p>
                <p className="mt-1.5 text-xs leading-relaxed text-ink/60">
                  {t.rememberedBody ??
                    "We saved this earlier in your visit. Your price and your pickup are both for this hotel."}
                </p>
                <div className="mt-3.5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setPlaceAgreed(true)}
                    className="btn-primary flex-1 !py-2 text-sm"
                  >
                    {t.yesCorrect ?? "Yes, that's right"}
                  </button>
                  <button
                    type="button"
                    onClick={openPicker}
                    className="btn-ghost flex-1 !py-2 text-sm"
                  >
                    {t.changeHotel ?? "No, change it"}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={openPicker}
                aria-describedby={showError("place") ? "place-err" : undefined}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition hover:border-crimson-300 hover:bg-crimson-50/40 ${
                  showError("place") ? "border-red-400" : "border-ink/15"
                }`}
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
            )}
            <FieldError id="place-err">{showError("place")}</FieldError>
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
              <Req />
            </label>
            <input
              id="date"
              ref={dateRef}
              type="date"
              required
              aria-required="true"
              aria-invalid={showError("date") ? "true" : undefined}
              aria-describedby={showError("date") ? "date-err" : undefined}
              value={form.date}
              onChange={set("date")}
              onBlur={blur("date")}
              className={`field ${showError("date") ? "border-red-400" : ""}`}
            />
            <FieldError id="date-err">{showError("date")}</FieldError>
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
                    ref={returnDateRef}
                    type="date"
                    aria-invalid={showError("returnDate") ? "true" : undefined}
                    aria-describedby={
                      showError("returnDate") ? "returnDate-err" : undefined
                    }
                    value={form.returnDate}
                    onChange={set("returnDate")}
                    onBlur={blur("returnDate")}
                    className={`field ${
                      showError("returnDate") ? "border-red-400" : ""
                    }`}
                  />
                  <FieldError id="returnDate-err">
                    {showError("returnDate")}
                  </FieldError>
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
            <Req />
          </label>
          <input
            id="name"
            type="text"
            required
            aria-required="true"
            aria-invalid={showError("name") ? "true" : undefined}
            aria-describedby={showError("name") ? "name-err" : undefined}
            autoComplete="name"
            value={form.name}
            onChange={set("name")}
            onBlur={blur("name")}
            className={`field ${showError("name") ? "border-red-400" : ""}`}
          />
          <FieldError id="name-err">{showError("name")}</FieldError>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="email" className="label">
              {t.email ?? "Email"}
              <Req />
            </label>
            <input
              id="email"
              type="email"
              required
              aria-required="true"
              aria-invalid={showError("email") ? "true" : undefined}
              aria-describedby={showError("email") ? "email-err" : undefined}
              autoComplete="email"
              value={form.email}
              onChange={set("email")}
              onBlur={blur("email")}
              className={`field ${showError("email") ? "border-red-400" : ""}`}
            />
            <FieldError id="email-err">{showError("email")}</FieldError>
          </div>
          <div>
            <label htmlFor="phone" className="label">
              {t.phone ?? "Phone / WhatsApp"}
            </label>
            <input
              id="phone"
              type="tel"
              autoComplete="tel"
              aria-invalid={showError("phone") ? "true" : undefined}
              aria-describedby={showError("phone") ? "phone-err" : undefined}
              value={form.phone}
              onChange={set("phone")}
              onBlur={blur("phone")}
              className={`field ${showError("phone") ? "border-red-400" : ""}`}
            />
            <FieldError id="phone-err">{showError("phone")}</FieldError>
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
          childCount={children}
          needsPlace={needsPlace}
          unpriced={unpriced}
          dict={dict}
        />

        {status === "error" && (
          <p
            role="alert"
            className="flex items-start gap-2.5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            <FaExclamationTriangle className="mt-0.5 shrink-0" />
            {error}
          </p>
        )}

        {/*
          Honeypot. Positioned off-screen rather than display:none, because some
          form-fillers skip hidden fields but not absolutely-positioned ones.
          aria-hidden and tabIndex -1 keep it away from screen readers and the
          tab order, so no real guest can reach it. autoComplete off stops a
          browser helpfully filling it in and locking someone out.
        */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden"
        >
          <label htmlFor="company">Company</label>
          <input
            id="company"
            name="company"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        <p className="text-xs text-ink/60">
          <span aria-hidden="true" className="text-crimson-600">
            *
          </span>{" "}
          {t.requiredNote ?? "Required. Everything else helps but is optional."}
        </p>

        {/*
          How they want to pay, asked BEFORE the booking is made rather than
          offered afterwards. Two equal options, cash pre-selected — see the
          note on the payMethod state for why that default is not an accident.
        */}
        {canOfferCard && (
          <div>
            <span className="label">{t.payHowLabel ?? "How would you like to pay?"}</span>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                {
                  key: "cash",
                  icon: null,
                  label: t.payCash ?? "Pay the driver on the day",
                  hint: t.payCashHint ?? "Cash, US or Jamaican dollars",
                },
                {
                  key: "card",
                  icon: <FaCreditCard className="text-sm" />,
                  label: t.payCard ?? "Pay now by card",
                  hint: t.payCardHint ?? "Secure checkout, no account needed",
                },
              ].map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => setPayMethod(opt.key)}
                  aria-pressed={payMethod === opt.key}
                  className={`rounded-xl border p-3 text-left transition ${
                    payMethod === opt.key
                      ? "border-crimson-600 bg-crimson-50/60 ring-1 ring-crimson-600"
                      : "border-ink/15 hover:border-ink/30"
                  }`}
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                    {opt.icon}
                    {opt.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink/60">
                    {opt.hint}
                  </span>
                </button>
              ))}
            </div>
          </div>
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
            /*
             * Still a request, and still says so. There is no published rate
             * for this route, so the guest is asking what it costs — nothing
             * has been agreed and nothing can be confirmed.
             */
            t.requestQuote ?? "Request a price"
          ) : payIntent === "card" ? (
            <>
              <FaCreditCard className="text-base" />
              {t.submitAndPay ?? "Book and pay now"}
            </>
          ) : (
            t.submit ?? "Confirm this booking"
          )}
        </button>

        <p className="flex items-center justify-center gap-2 text-center text-xs text-ink/60">
          <FaLock className="shrink-0 text-[0.65rem]" />
          {unpriced || needsPlace
            ? t.noPaymentQuote ??
              "No payment taken — we come back with a firm price, same day."
            : payIntent === "card"
              ? t.payNote ??
                "You'll be taken to a secure checkout. Card details never touch this site."
              : t.cashNote ??
                "Nothing to pay now. Settle with your driver on the day."}
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
  childCount,
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
    (childCount > 0
      ? `, ${childCount} ${
          childCount === 1 ? t.child ?? "child" : t.childrenWord ?? "children"
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
            {money(perPerson(transport.total, adults + childCount))}{" "}
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
            {money(perPerson(quote.dayTotal, adults + childCount))}{" "}
            {dict?.price?.perPerson ?? "/ person"}
          </span>
        </span>
      </div>
    </div>
  );
}

/**
 * The screen after a booking is accepted.
 *
 * Two equal choices are offered, and paying is always the optional one: the
 * booking already exists by the time this renders, so a guest who closes the
 * tab loses nothing. That ordering is the whole design — the booking is written
 * first, the payment session second, never the other way round.
 *
 * The card option only appears when the SERVER said it could. `collectible`
 * comes back from /api/bookings, where payable() has already refused anything
 * that is a quote request, carries an indicative price, or has nowhere to be
 * recorded because no service account is configured.
 */
function Success({ result, locale, dict, payMethod, quoted, paypal }) {
  const t = dict?.booking ?? {};
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  /*
   * The inline buttons are the intended path; the hosted-page redirect is what
   * is left when PayPal's script cannot load. `sdkDown` flips on that failure
   * so the old button reappears rather than leaving a guest with no way to pay.
   */
  const [sdkDown, setSdkDown] = useState(false);
  const [settled, setSettled] = useState(null);

  const options = result.paymentOptions;
  /*
   * `result.persisted` gates this too. There is nothing to pay for if the
   * booking was never written: /api/payments/start looks the reference up and
   * would 404, so offering a card here only produces an error after the guest
   * has committed to paying. The WhatsApp handoff becomes the primary action
   * instead, which is what the unsaved screen needs anyway.
   */
  const canPay = Boolean(
    result.persisted && options?.collectible && options.amountCents > 0
  );
  const useButtons = canPay && Boolean(paypal?.clientId) && !sdkDown;

  const goToPayment = async () => {
    setPaying(true);
    setPayError("");
    try {
      const url = await startPayment(result.reference);
      // A top-level navigation, not an iframe: the hosted page sets framing
      // headers. Assigned here in the handler's continuation rather than from
      // an effect, or Safari may treat it as a popup.
      window.location.assign(url);
    } catch (err) {
      console.error("Payment could not start", err);
      setPaying(false);
      setPayError(
        t.payStartFailed ??
          "We couldn't open the payment page. Your booking is safe — you can pay your driver on the day, or message us."
      );
    }
  };

  /*
   * A booking that was never written must not look like one that was.
   *
   * `lib/bookings.js` deliberately swallows a 5xx and mints a client-side
   * reference rather than losing the guest — the intent is right, a dead
   * database should not end the conversation. What was wrong was the screen it
   * produced: the same green tick, the same "You're booked.", the same
   * reference, and a footnote blaming storage not being "switched on" — the
   * wrong explanation for a transient 500, in the least prominent type on the
   * card. A guest read that as confirmed and walked away with a reference
   * matching nothing.
   *
   * So the unsaved case gets its own head: a warning mark, a title that says
   * it is not confirmed, and the WhatsApp handoff as the primary action rather
   * than an afterthought. The reference is still shown, because it is what
   * ties their message to the details they typed.
   */
  const saved = result.persisted;

  return (
    <div className="card p-8 text-center">
      <span
        className={`mx-auto grid h-14 w-14 place-items-center rounded-full text-2xl ${
          saved ? "bg-crimson-50 text-crimson-600" : "bg-gold-200/50 text-gold-600"
        }`}
      >
        {saved ? <FaCheckCircle /> : <FaExclamationTriangle />}
      </span>
      <h3 className="mt-5 font-display text-2xl font-semibold text-ink">
        {!saved
          ? t.notSavedTitle ?? "Not confirmed yet"
          : quoted
            ? t.doneTitle ?? "You're booked."
            : t.doneQuoteTitle ?? "Request received."}
      </h3>

      {saved ? (
        <p className="mt-2 text-sm leading-relaxed text-ink/60">
          {t.doneRef ?? "Your reference is"}{" "}
          <span className="font-semibold text-ink">{result.reference}</span>.{" "}
          {quoted
            ? t.doneBody ??
              "Keep it — quoting it gets you an answer fastest. Your driver and exact pickup time follow by WhatsApp or email shortly."
            : t.doneQuoteBody ??
              "Keep it — quoting it gets you an answer fastest. We'll come back with a firm price, same day, and you can confirm from there."}
        </p>
      ) : (
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          {t.notSavedBody ??
            "We couldn't save this booking just now, so nobody has it yet. Send it to us on WhatsApp below and we'll confirm it by hand — it takes a moment and nothing is lost."}
        </p>
      )}

      {/*
        The safety net for the mismatch above. `canOfferCard` should stop a
        guest ever reaching this screen having asked to pay by card when we
        cannot take one - but if the server refuses for a reason the form could
        not see, saying so beats confirming in silence and leaving them to
        wonder whether they were charged.
      */}
      {payMethod === "card" && !canPay && (
        <p className="mx-auto mt-6 max-w-sm rounded-xl bg-gold-200/40 px-4 py-3 text-xs leading-relaxed text-ink/70">
          {t.payUnavailable ??
            "Card payment isn't available for this booking right now. Nothing was charged and your booking stands - settle with your driver on the day, or message us to pay another way."}
        </p>
      )}

      {canPay && (
        <div className="mt-7 rounded-xl bg-sand px-5 py-5">
          <p className="text-sm font-semibold text-ink">
            {payMethod === "card"
              ? t.payDidntOpen ?? "The payment page didn't open"
              : t.payHow ?? "Want to pay now instead?"}
          </p>
          <p className="mt-1.5 text-xs leading-relaxed text-ink/60">
            {payMethod === "card"
              ? t.payDidntOpenBody ??
                "Your booking is confirmed either way — nothing was charged. Try again below, or just settle with your driver on the day."
              : t.payOptional ??
                "Paying now is optional and changes nothing about your booking. You can always settle with your driver, in cash."}
          </p>

          <p className="mt-3 font-display text-2xl font-semibold text-ink">
            {money(options.amount)}
          </p>

          {useButtons ? (
            <div className="mt-4 text-left">
              <PayPalCheckout
                clientId={paypal.clientId}
                currency={paypal.currency}
                reference={result.reference}
                dict={dict}
                onFallback={() => setSdkDown(true)}
                onSettled={setSettled}
              />
            </div>
          ) : (
            <>
          <button
            type="button"
            onClick={goToPayment}
            disabled={paying}
            className="btn-primary mt-4 w-full disabled:opacity-60"
          >
            {paying ? (
              <>
                <FaSpinner className="animate-spin" />
                {t.payRedirecting ?? "Opening secure payment…"}
              </>
            ) : (
              <>
                <FaCreditCard className="text-base" />
                {(t.payNow ?? "Pay {amount} by card now").replace(
                  "{amount}",
                  money(options.amount)
                )}
              </>
            )}
          </button>

          <p className="mt-3 flex items-center justify-center gap-2 text-[0.7rem] text-ink/60">
            <FaLock className="text-[0.6rem]" />
            {t.paySecureNote ??
              "Card details are entered on our payment provider's own page and never touch this site."}
          </p>
            </>
          )}

          {/*
            The outcome of an inline payment, read from what our own capture
            route decided — never from what the browser thinks happened.
          */}
          {settled && (
            <div
              role="status"
              className={`mt-4 rounded-lg px-3 py-2.5 text-xs leading-relaxed ${
                settled.ok
                  ? "bg-green-50 text-green-800"
                  : "bg-gold-200/40 text-ink/70"
              }`}
            >
              {settled.ok
                ? t.payDone ?? "Payment received. Thank you — you're all set."
                : settled.state === "cancelled"
                  ? t.payCancelled ??
                    "Payment cancelled — nothing was charged. Your booking still stands."
                  : settled.state === "pending"
                    ? t.payPending ??
                      "Your payment is clearing. Don't pay again — we'll confirm by email."
                    : t.payUnsure ??
                      "We couldn't confirm that payment. Nothing may have been charged — message us before trying again."}
              {settled.resultPath && (
                <Link
                  href={settled.resultPath}
                  className="ml-1 font-semibold underline"
                >
                  {t.payViewReceipt ?? "View details"}
                </Link>
              )}
            </div>
          )}

          {payError && (
            <p
              role="alert"
              className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"
            >
              {payError}
            </p>
          )}
        </div>
      )}

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <a
          href={result.whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className={canPay ? "btn-ghost" : "btn-primary"}
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
