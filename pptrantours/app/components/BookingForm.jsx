"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FaWhatsapp,
  FaCheckCircle,
  FaMinus,
  FaPlus,
  FaLock,
  FaSpinner,
  FaExclamationTriangle,
  FaInfoCircle,
  FaCreditCard,
  FaPaypal,
} from "react-icons/fa";
import {
  quoteExcursion,
  quoteTransfer,
  money,
  MAX_PARTY,
  describeDirection,
} from "@/app/products/pricing";
import { getPlace } from "@/app/data/places";
import { createBooking, startPayment } from "@/lib/bookings";
import { localePath } from "@/app/i18n/config";
import { usePlace } from "./PlaceProvider";
import HotelSearch from "./HotelSearch";
import PayPalCheckout from "./PayPalCheckout";
import { useBookingDraft, clearBookingDraft } from "./booking/useBookingDraft";

/**
 * One form for both halves of the catalogue.
 *
 * `mode="tour"`     the guest's resort decides the price.
 * `mode="transfer"` the destination resort decides it, plus one-way or return.
 *
 * Either way the form quotes ONE number, the transport, because that is the
 * only thing PPP sells. Attraction admission is not priced, chosen or
 * collected here.
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
      className="mt-1.5 flex items-start gap-1.5 text-sm font-medium text-red-700"
    >
      <FaExclamationTriangle className="mt-1 shrink-0 text-xs" />
      {children}
    </p>
  );
}

function todayISO() {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

/* ── Answers handed over from elsewhere ─────────────────────────────────────
 *
 * The homepage fare widget asks for direction and party size before it links
 * to a transfer page. Without this the form opened on its own defaults — round
 * trip, two adults — and the guest re-entered what they had just said.
 *
 * Read through `useSyncExternalStore` rather than `useSearchParams()` or an
 * effect. The hook would push all 460 statically generated transfer pages
 * behind a Suspense boundary or into client rendering to serve two optional
 * integers; an effect would mean calling setState on mount. This renders the
 * server's empty snapshot first and the real query on hydration, so the markup
 * matches and the values are still only a default the guest can change.
 */
const subscribeToNothing = () => () => {};
const readSearch = () => window.location.search;
const noSearch = () => "";

const VALID_DIRECTIONS = ["to-hotel", "to-airport", "both"];

function parseHandoff(search) {
  const q = new URLSearchParams(search);

  const direction = q.get("direction");
  // `trip=one-way|round-trip` is the old two-way query param — kept working
  // for any link or bookmark still carrying it.
  const legacyTrip = q.get("trip");
  const pax = Number.parseInt(q.get("pax") ?? "", 10);

  return {
    direction: VALID_DIRECTIONS.includes(direction)
      ? direction
      : legacyTrip === "one-way"
        ? "to-hotel"
        : legacyTrip === "round-trip"
          ? "both"
          : null,
    pax: Number.isFinite(pax) && pax >= 1 && pax <= MAX_PARTY ? pax : null,
  };
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
  /*
   * Fired once the booking is saved, for a host that renders something around
   * this form. /transfers keeps a resort picker above it; without this signal
   * that picker stays live beside a confirmation screen, so changing the
   * resort appears to do nothing.
   */
  onBooked,
  /*
   * Transfer mode has two ways to arrive at a direction: a standalone page
   * like /transfer/[place] has no "stage 1" ahead of it, so the form owns its
   * own three-way toggle. TransferBooking's two-stage flow decides the
   * direction (and the party size) in its own Stage 1, with the price already
   * shown and confirmed before "Continue" — so passing `direction` here
   * switches the form to a read-only summary of that choice, with
   * `onChangeSelection` wired to a "Change" link back to Stage 1. Both modes
   * share the same validation, pricing and submit path; only this one prop
   * decides which UI renders.
   */
  direction: controlledDirection = null,
  initialAdults = null,
  initialChildren = null,
  onChangeSelection = null,
}) {
  const isTransfer = mode === "transfer";
  // Memoised because `?? {}` mints a new object every render, which would make
  // the validation callback — and so the whole error map — recompute each time.
  const t = useMemo(() => dict?.booking ?? {}, [dict]);
  const { place, zone, ready } = usePlace();
  const router = useRouter();

  // A transfer page is *about* one resort, so it fixes its own destination
  // rather than using whatever the guest picked for excursions.
  const transferPlace = isTransfer ? tour.place : null;

  /*
   * Direction and party size are DERIVED, not stored.
   *
   * `null` means "the guest has not touched this control", so a value handed
   * over in the query string wins until they do, and their own choice wins
   * from then on. Storing them instead would mean writing state on mount to
   * apply the handoff.
   */
  const search = useSyncExternalStore(
    subscribeToNothing,
    readSearch,
    noSearch
  );
  const handoff = useMemo(() => parseHandoff(search), [search]);

  const [directionChoice, setDirectionChoice] = useState(null);
  const direction =
    controlledDirection ?? directionChoice ?? handoff.direction ?? "both";

  const [adultChoice, setAdults] = useState(null);
  const adults = adultChoice ?? handoff.pax ?? initialAdults ?? 2;

  const [children, setChildren] = useState(initialChildren ?? 0);
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
  const draftKey = `ppp.draft.${tour.id}`;
  useBookingDraft(draftKey, form, setForm);

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
  }, [form.date, direction]);

  const quote = useMemo(() => {
    if (isTransfer) {
      return quoteTransfer(transferPlace.key, { direction, adults, children });
    }
    return quoteExcursion(tour, { zoneKey: zone, adults, children });
  }, [isTransfer, transferPlace, direction, tour, zone, adults, children]);

  // Q-12 (09_DECISIONS.md): a flight number is required for the arrival leg —
  // "to-hotel" outright, and the outbound leg of "both" — because that is the
  // flight PPP tracks to meet the guest. It stays optional for a departure
  // ("to-airport"), where there is no one to meet at the airport end.
  const needsArrivalFlight = isTransfer && (direction === "to-hotel" || direction === "both");

  const pax = adults + children;
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // A tour needs a resort before it can be priced; a transfer already has one.
  const needsPlace = !isTransfer && ready && !place;
  const unpriced = !isTransfer && ready && place && !quote.transport;

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

    if (isTransfer && direction === "both" && form.returnDate && form.date) {
      if (form.returnDate < form.date)
        errs.returnDate =
          t.errReturnBeforeArrival ?? "Your return cannot be before you arrive.";
    }

    if (needsArrivalFlight && !form.flightNumber.trim())
      errs.flightNumber = t.errFlightNumber ?? "Please add your arrival flight number.";

    if (needsPlace)
      errs.place = t.errPickPlace ?? "Please choose where you are staying.";

    return errs;
  }, [form, isTransfer, direction, needsArrivalFlight, needsPlace, t]);

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
   * A derived rate is no longer excluded. It used to be, which put a third of
   * the resort list on an "ask us" path with no way to pay — see the note in
   * `quoteExcursion`.
   *
   * `paymentsEnabled` comes from the server, and it is the half the form
   * cannot work out alone: whether a payment provider is actually configured.
   * Without it this offered "Pay now by card" whenever a price existed, the
   * server then refused to collect, and the redirect was skipped in silence -
   * so choosing card and choosing cash produced identical screens. Offering a
   * payment method that cannot be honoured is worse than offering none.
   */
  const canOfferCard = Boolean(
    paymentsEnabled && !needsPlace && !unpriced && quote.transport
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
        direction: isTransfer ? direction : "",
        adults,
        children,
        transportTotal: quote.transport?.total ?? null,
        total: quote.total,
        // Abuse signals. `company` is the honeypot and must stay empty; a real
        // guest never sees the field.
        company: honeypot,
        formOpenedAt: openedAt.current,
        payIntent,
        ...form,
      }, { idempotencyKey: idemKey.current });
      setResult(res);
      onBooked?.(res);
      clearBookingDraft(draftKey);
      // A fresh key, so a second booking in the same session is a second
      // booking rather than a replay of this one.
      idemKey.current =
        globalThis.crypto?.randomUUID?.() ??
        `k-${Date.now()}-${Math.random().toString(36).slice(2)}`;

      /*
       * Card was chosen and there are no inline buttons to pay with instead,
       * so go straight to PayPal's hosted checkout rather than landing on the
       * booking page only to bounce off it again.
       *
       * THE BOOKING IS ALREADY SAVED at this point, and that ordering is the
       * whole reason this is safe to do. If the payment never starts, or the
       * guest abandons PayPal, or their connection drops, the booking still
       * exists and the owner still has it — they simply pay the driver. The
       * reverse ordering, taking money before the booking is recorded, is how a
       * charge ends up with nothing attached to it.
       *
       * A failure here falls through to the booking-page navigation below
       * rather than rethrowing: that page has its own "pay now" button, which
       * is a far better place to land than the form's error state telling
       * someone their booking failed when it did not.
       */
      const hasInlineButtons = Boolean(paypal?.clientId);
      if (payIntent === "card" && res.paymentOptions?.collectible && !hasInlineButtons) {
        try {
          const url = await startPayment(res.reference);
          window.location.assign(url);
          return;
        } catch (payErr) {
          console.error("Payment could not start", payErr);
        }
      }

      /*
       * Every other case lands on the booking's own persistent page
       * (08_IMPLEMENTATION_PLAN.md Phase 4) — a real navigation, not local
       * state, so the confirmation survives a reload or a link opened from
       * the confirmation email later. `token` gates that page; without one
       * (storage was unavailable, so there is no real record to link to)
       * the confirmation renders in place instead, same as before.
       */
      if (res.persisted && res.token) {
        router.push(
          `${localePath(locale, `/booking/${res.reference}`)}?p=${encodeURIComponent(res.token)}`
        );
        return;
      }

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
        isTransfer={isTransfer}
      />
    );
  }

  return (
    // noValidate: validation is ours now, so the messages are translated and
    // every field's problem is stated next to it rather than one at a time.
    <form noValidate onSubmit={onSubmit} className="card relative overflow-hidden">
      {/*
        No price banner sits above the fields any more.

        It printed the per-head rate big and the total small underneath, which
        is two numbers for a form that quotes one, and it sat above the party
        steppers — so on a 390px phone the figure moved while the guest was
        looking at the control that moved it. The single total now renders
        directly beneath the steppers, where it can be watched changing. The
        tour and transfer pages still carry the shop-window "from" price.
      */}
      <div className="space-y-7 p-6">
        {/*
          The one thing to say before the fields, said once.

          The four-person rule used to sit under the total, where it read as a
          caveat on the number rather than an explanation of it. Up here it is
          read before there is a figure to doubt, and it doubles as the promise
          that nothing needs adding up by hand.
        */}
        <p className="-mb-2 flex items-start gap-2 rounded-xl bg-sand px-4 py-3 text-xs leading-relaxed text-ink/60">
          <FaInfoCircle className="mt-0.5 shrink-0 text-ink/30" />
          {t.autoNote ??
            "Relax — your total is calculated automatically as you fill this in. Nothing to work out yourself."}
        </p>

        <Section title={t.sectionTrip ?? "Your trip"}>
        {/* Where from / where to */}
        {isTransfer ? (
          onChangeSelection ? (
            /*
             * Chosen already, in TransferBooking's Stage 1 — where the price
             * was live and confirmed before "Continue" ever appeared. Redoing
             * that choice here as a second, editable toggle would let it drift
             * from the price already shown; "Change" goes back to the one
             * place that recalculates it.
             */
            <div className="flex items-center justify-between gap-3 rounded-xl border border-ink/15 bg-sand px-4 py-3">
              <div>
                <span className="block text-sm font-semibold text-ink">
                  {describeDirection(direction) &&
                    (t[
                      direction === "both"
                        ? "roundTrip"
                        : direction === "to-airport"
                          ? "toAirport"
                          : "toHotel"
                    ] ?? describeDirection(direction))}
                </span>
                <span className="mt-0.5 block text-xs text-ink/60">{transferPlace.name}</span>
              </div>
              <button
                type="button"
                onClick={onChangeSelection}
                className="shrink-0 rounded-full border border-ink/15 bg-white px-3.5 py-1.5 text-xs font-semibold text-ink/75 transition hover:border-crimson-300 hover:text-crimson-700"
              >
                {t.change ?? "Change"}
              </button>
            </div>
          ) : (
            <div>
              <label htmlFor="transfer-type" className="label">
                {t.direction ?? "Transfer type"}
              </label>
              <select
                id="transfer-type"
                value={direction}
                onChange={(e) => setDirectionChoice(e.target.value)}
                className="field"
              >
                <option value="to-hotel">
                  {t.toHotelOption ?? "Pick up (Airport to Hotel/Resort)"}
                </option>
                <option value="to-airport">
                  {t.toAirportOption ?? "Drop off (Hotel/Resort to Airport)"}
                </option>
                <option value="both">{t.roundTripOption ?? "Pickup & Drop off (Round Trip)"}</option>
              </select>
              <p className="mt-1.5 text-xs text-ink/70">
                {t.transferTo ?? "To"}{" "}
                <span className="font-semibold text-ink/70">
                  {transferPlace.name}
                </span>
              </p>
            </div>
          )
        ) : (
          <div>
            <span className="label">{t.stayingAt ?? "Where are you staying?"}</span>
            {/*
              A resort carried over from earlier in the visit shows a quiet
              "From your last visit" line rather than blocking the form on a
              second agreement — the pre-submit summary card repeats the
              hotel, which is the guest's real chance to catch a wrong one.
            */}
            <HotelSearch
              variant="field"
              id="place-field"
              dict={dict}
              error={showError("place")}
              describedBy={showError("place") ? "place-err" : undefined}
            />
            <FieldError id="place-err">{showError("place")}</FieldError>
          </div>
        )}

        {/*
          Q-02 (09_DECISIONS.md): PPP sets the pickup time from the flight,
          the guest never chooses one. So the primary date/time/flight block
          below asks for the ARRIVAL leg whenever one exists ("to-hotel" or
          "both") — that is the flight PPP actually tracks — and only asks for
          the DEPARTURE leg here when the booking is departure-only
          ("to-airport"), where there is no arrival leg to ask about instead.
        */}
        {/* When */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="date" className="label">
              {isTransfer
                ? direction === "to-airport"
                  ? t.departureDate ?? "Departure date"
                  : t.arrivalDate ?? "Arrival date"
                : t.tourDate ?? "Tour date"}
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
              {isTransfer
                ? direction === "to-airport"
                  ? t.departureTime ?? "Departure flight time"
                  : t.landingTime ?? "Arrival flight time"
                : t.pickupTime ?? "Pickup time"}
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
                {direction === "to-airport"
                  ? t.departureFlightNumber ?? "Departure flight number"
                  : t.flightNumber ?? "Arrival flight number"}
                {needsArrivalFlight && <Req />}
              </label>
              <input
                id="flightNumber"
                type="text"
                placeholder="AA 1573"
                required={needsArrivalFlight}
                aria-required={needsArrivalFlight ? "true" : undefined}
                aria-invalid={showError("flightNumber") ? "true" : undefined}
                aria-describedby={
                  showError("flightNumber") ? "flightNumber-err" : undefined
                }
                value={form.flightNumber}
                onChange={set("flightNumber")}
                onBlur={blur("flightNumber")}
                className={`field ${showError("flightNumber") ? "border-red-400" : ""}`}
              />
              <FieldError id="flightNumber-err">{showError("flightNumber")}</FieldError>
              <p className="mt-1.5 text-xs text-ink/70">
                {direction === "to-airport"
                  ? t.pickupFromFlightNote ??
                    "We work out your pickup time from this flight — no need to tell us one."
                  : t.flightNote ??
                    "We track it and meet you inside arrivals. We'll confirm your hotel pickup time once we have it."}
              </p>
            </div>

            {direction === "both" && (
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="returnDate" className="label">
                    {t.returnDate ?? "Departure date"}
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
                    {t.returnFlight ?? "Departure flight number"}
                  </label>
                  <input
                    id="returnFlight"
                    type="text"
                    placeholder="AA 1574"
                    value={form.returnFlight}
                    onChange={set("returnFlight")}
                    className="field"
                  />
                  <p className="mt-1.5 text-xs text-ink/70">
                    {t.pickupFromFlightNote ??
                      "Optional — we work out your pickup time from your hotel either way."}
                  </p>
                </div>
              </div>
            )}
          </>
        )}

        </Section>

        <Section title={t.sectionParty ?? "Who's coming"}>
        {/* Party size */}
        <div className="grid grid-cols-2 gap-4">
          <Stepper
            label={t.adults ?? "Adults"}
            value={adults}
            min={1}
            onChange={setAdults}
          />
          <Stepper
            label={t.children ?? "Children (under 5)"}
            value={children}
            min={0}
            onChange={setChildren}
          />
        </div>
        {/*
          Q-06 (09_DECISIONS.md): under 5s ride free and never add to the
          total. Blatant on the form, not tucked in an FAQ, per the owner.
        */}
        <p className="-mt-2 text-xs text-ink/60">
          {t.childrenFree ?? "Children under 5 ride free — they don't add to your total."}
        </p>
        <Price
          quote={quote}
          isTransfer={isTransfer}
          direction={direction}
          needsPlace={needsPlace}
          unpriced={unpriced}
          dict={dict}
        />

        </Section>

        <Section title={t.sectionDetails ?? "Your details"}>

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

        </Section>

        <Section title={canOfferCard ? t.sectionPay ?? "How you'll pay" : null}>
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

        {/*
          How they want to pay, asked BEFORE the booking is made rather than
          offered afterwards. Two equal options, cash pre-selected — see the
          note on the payMethod state for why that default is not an accident.
        */}
        {canOfferCard && (
          <div>
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
                  icon: <FaPaypal className="shrink-0 text-xl text-[#003087]" aria-hidden="true" />,
                  label: t.payCardPaypal ?? "Pay now by card or PayPal",
                  hint: t.payCardHint ?? "Secured by PayPal — no account needed",
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
          ) : unpriced || needsPlace || quote.total == null ? (
            /*
             * Still a request, and still says so. There is no published rate
             * for this route — or, on the very first pre-hydration paint,
             * simply no price computed yet — so the guest is asking what it
             * costs rather than confirming a number that doesn't exist.
             */
            t.requestQuote ?? "Request a price"
          ) : payIntent === "card" ? (
            <>
              <FaCreditCard className="text-base" />
              {(t.submitAndPay ?? "Book and pay now · {amount}").replace(
                "{amount}",
                money(quote.total)
              )}
            </>
          ) : (
            (t.submit ?? "Confirm this booking · {amount}").replace(
              "{amount}",
              money(quote.total)
            )
          )}
        </button>

        {(unpriced || needsPlace || payIntent === "card") && (
          <p className="flex items-center justify-center gap-2 text-center text-xs text-ink/60">
            <FaLock className="shrink-0 text-[0.65rem]" />
            {unpriced || needsPlace
              ? t.noPaymentQuote ??
                "No payment taken — we come back with a firm price, same day."
              : t.payNote ??
                "You'll be taken to a secure checkout. Card details never touch this site."}
          </p>
        )}
        </Section>
      </div>
    </form>
  );
}

/**
 * One labelled block of the form.
 *
 * The form is fourteen inputs on a phone, and it used to run as a single
 * undifferentiated column with the price banner at the top and the breakdown
 * below the personal details — so the number moved while the guest was looking
 * somewhere else. Five headings, and the price sitting directly after the
 * fields that change it, is the whole fix.
 */
function Section({ title, children }) {
  return (
    <section className="space-y-5">
      {title && (
        <h3 className="border-b border-ink/10 pb-2 text-lg font-bold text-ink">
          {title}
        </h3>
      )}
      {children}
    </section>
  );
}

/* ── Pieces ─────────────────────────────────────────────────────────────────── */

/**
 * The one number on this form.
 *
 * It used to be three: a per-head rate in the banner, a transport subtotal
 * with its arithmetic, an itemised gate-fee block, and a combined "your day,
 * all in". PPP sells transport, the attraction sells admission, and quoting
 * both made the form read like an invoice the guest had to audit. The owner's
 * ruling (2026-09-21): show what PPP charges, once.
 *
 * `needsPlace` and `unpriced` are two different silences and only the second
 * is worth explaining: on the server render localStorage has not been read, so
 * "no resort yet" is also the state every guest starts in.
 */
function Price({ quote, isTransfer, direction, needsPlace, unpriced, dict }) {
  const t = dict?.booking ?? {};

  if (!quote.transport) {
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

  /*
   * A transfer's direction belongs on the same line as its price: a round
   * trip fare is double a one-way one, so the biggest number on the form is
   * meaningless without it. The toggle that sets it is above, but on a phone
   * it is off-screen by the time the total is read.
   */
  const label = isTransfer
    ? (t[
        direction === "both"
          ? "roundTrip"
          : direction === "to-airport"
            ? "toAirport"
            : "toHotel"
      ] ?? describeDirection(direction))
    : t.total ?? "Total";

  return (
    <div className="rounded-xl bg-ink px-5 py-4 text-white">
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-semibold">{label}</span>
        <span className="shrink-0 font-display text-3xl font-semibold text-gold-400">
          {money(quote.total)}
        </span>
      </div>
      {/*
        Nothing under the number.

        The four-person rule is stated once, at the top of the form, before
        there is a figure for it to look like a caveat on.
      */}
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
function Success({
  result,
  locale,
  dict,
  payMethod,
  quoted,
  paypal,
  isTransfer,
}) {
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

  /*
   * Settled and taken. Not just `settled` — a cancelled or pending outcome
   * leaves the guest with something still to do, so the pay block stays.
   */
  const paid = Boolean(settled?.ok);

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
          {/*
            "The payment page didn't open" belongs only to the redirect flow,
            where arriving here with card selected meant the redirect had
            failed. With the buttons below, arriving here is the normal path —
            saying something went wrong would be a lie, and an alarming one on
            the screen where the guest is about to pay.
          */}
          {/*
            Everything above the outcome is an invitation to pay, so once the
            payment has actually landed it all has to go. Leaving it up printed
            "Paying now is optional" and the amount still owing directly above
            "Payment received", which reads as though the payment had not
            counted.
          */}
          {!paid && (
            <>
              <p className="text-sm font-semibold text-ink">
                {useButtons
                  ? payMethod === "card"
                    ? t.payFinish ?? "Finish your payment"
                    : t.payHow ?? "Want to pay now instead?"
                  : payMethod === "card"
                    ? t.payDidntOpen ?? "The payment page didn't open"
                    : t.payHow ?? "Want to pay now instead?"}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-ink/60">
                {useButtons
                  ? t.payOptional ??
                    "Paying now is optional and changes nothing about your booking. You can always settle with your driver, in cash."
                  : payMethod === "card"
                    ? t.payDidntOpenBody ??
                      "Your booking is confirmed either way — nothing was charged. Try again below, or just settle with your driver on the day."
                    : t.payOptional ??
                      "Paying now is optional and changes nothing about your booking. You can always settle with your driver, in cash."}
              </p>

              <p className="mt-3 font-display text-2xl font-semibold text-ink">
                {money(options.amount)}
              </p>
            </>
          )}

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

          <p className="mt-3 flex items-center justify-center gap-2 text-xs text-ink/60">
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
              className={`rounded-lg px-3 py-2.5 text-xs leading-relaxed ${
                paid ? "" : "mt-4"
              } ${
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
          <FaWhatsapp className="text-lg text-whatsapp" />
          {t.confirmWhatsApp ?? "Confirm on WhatsApp"}
        </a>
        {/*
          An airport transfer is not a tour, and this screen used to end by
          offering to "browse more tours" whichever had just been booked — the
          one word the owner does not want anywhere near a transfer.
        */}
        <Link
          href={localePath(locale, isTransfer ? "/transfers" : "/tours")}
          className="btn-ghost"
        >
          {isTransfer
            ? t.browseTransfers ?? "See all transfer rates"
            : t.browseMore ?? "Browse more tours"}
        </Link>
      </div>
    </div>
  );
}

/**
 * A -/+ counter.
 *
 * `onChange` is the state setter itself, so the updates are functional rather
 * than computed from the captured `value`. Tapping + twice inside one render
 * used to land on one increment, because both handlers read the same stale
 * value — invisible when a person clicks and re-renders in between, and very
 * visible to a fast thumb on a phone.
 *
 * There is no upper bound. The owner takes any number of passengers.
 */
export function Stepper({ label, value, min, onChange }) {
  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex items-center gap-2 rounded-xl border border-ink/25 p-1">
        <button
          type="button"
          aria-label={`Decrease ${label}`}
          onClick={() => onChange((v) => Math.max(min, v - 1))}
          disabled={value <= min}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-ink/5 text-ink transition hover:bg-ink/10 disabled:opacity-30"
        >
          <FaMinus className="text-xs" />
        </button>
        <span aria-live="polite" className="flex-1 text-center text-lg font-bold text-ink">
          {value}
        </span>
        <button
          type="button"
          aria-label={`Increase ${label}`}
          onClick={() => onChange((v) => v + 1)}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-ink/5 text-ink transition hover:bg-ink/10"
        >
          <FaPlus className="text-xs" />
        </button>
      </div>
    </div>
  );
}
