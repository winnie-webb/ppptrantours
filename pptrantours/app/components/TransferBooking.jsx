"use client";

import { useCallback, useRef, useState } from "react";
import { FaPlane, FaSyncAlt } from "react-icons/fa";
import { quoteTransfer, money } from "@/app/products/pricing";
import HotelSearch from "./HotelSearch";
import BookingForm, { Stepper } from "./BookingForm";
import { usePlace } from "./PlaceProvider";

/**
 * Booking an airport transfer, in two stages.
 *
 * Stage 1 answers the only question a guest actually has before they will
 * commit to filling in a form — "what will this cost me" — from three inputs
 * (hotel, direction, party size) with the price recalculating live as each
 * one changes, and says so explicitly (07_HOTEL_SELECTION.md's "state
 * changes are announced" principle, applied to a number rather than a
 * search result). Only once that price is shown and accepted does "Continue
 * with booking" reveal Stage 2 — flight details, guest details, payment —
 * which is `BookingForm` itself, told the direction and starting party size
 * so it prices exactly what Stage 1 just showed rather than re-asking.
 *
 * The hotel is the same "where are you staying" the rest of the site asks
 * with `HotelSearch` — 07 §2's "one component for every hotel choice" — so
 * picking a destination here also becomes the guest's remembered resort
 * everywhere else on the site, which is the common case (this transfer is
 * usually about their actual stay, not an errand for someone else).
 */
export default function TransferBooking({
  locale = "en",
  dict,
  /*
   * The product name, built on the server. Has to match what
   * /transfer/[place] builds for the same resort — the client posts
   * `tourTitle` and the API stores it verbatim.
   */
  titlePrefix = "Airport transfer to",
  paymentsEnabled = false,
  paypal = null,
}) {
  const t = dict?.fare ?? {};
  const { place, ready } = usePlace();

  const [stage, setStage] = useState(1);
  const [direction, setDirection] = useState("both");
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [booked, setBooked] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const formRef = useRef(null);

  const quote = place ? quoteTransfer(place.key, { direction, adults, children }) : null;

  const asTour = place
    ? {
        id: `transfer-${place.key}`,
        title: `${titlePrefix} ${place.name}`,
        kind: "transfer",
        duration: "Door to door",
        place,
      }
    : null;

  /*
   * Focus moves with the scroll, not after it, so a screen reader announces
   * Stage 2 rather than leaving the caret on a button that just disappeared.
   */
  const goToDetails = useCallback(() => {
    setStage(2);
    requestAnimationFrame(() => {
      const el = formRef.current;
      if (!el) return;
      el.focus({ preventScroll: true });
      el.scrollIntoView({ block: "start", behavior: "smooth" });
    });
  }, []);

  const backToStart = useCallback(() => {
    setStage(1);
    requestAnimationFrame(() => {
      document.getElementById("transfer-hotel")?.scrollIntoView({
        block: "start",
        behavior: "smooth",
      });
    });
  }, []);

  const bookAnother = useCallback(() => {
    setBooked(false);
    setStage(1);
    setFormKey((n) => n + 1);
  }, []);

  if (booked) {
    return (
      <button type="button" onClick={bookAnother} className="btn-ghost">
        {t.another ?? "Book another transfer"}
      </button>
    );
  }

  if (stage === 2 && asTour) {
    return (
      <div ref={formRef} tabIndex={-1} className="scroll-mt-24 outline-none">
        <BookingForm
          key={formKey}
          tour={asTour}
          locale={locale}
          dict={dict}
          mode="transfer"
          direction={direction}
          initialAdults={adults}
          initialChildren={children}
          onChangeSelection={backToStart}
          paymentsEnabled={paymentsEnabled}
          paypal={paypal}
          onBooked={() => setBooked(true)}
        />
      </div>
    );
  }

  const canContinue = Boolean(place && quote?.total != null);

  return (
    <div className="card space-y-6 p-6 sm:p-8">
      <div className="flex items-center gap-2.5 text-sm font-semibold text-ink/60">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-crimson-50 text-crimson-600">
          <FaPlane className="text-xs" />
        </span>
        {t.from ?? "From Sangster International (MBJ)"}
      </div>

      <div>
        <span className="label">{t.destination ?? "Which resort are we taking you to?"}</span>
        <HotelSearch variant="field" id="transfer-hotel" dict={dict} />
      </div>

      <div>
        <label htmlFor="transfer-type" className="label">
          {t.direction ?? "Transfer type"}
        </label>
        <select
          id="transfer-type"
          value={direction}
          onChange={(e) => setDirection(e.target.value)}
          className="field"
        >
          <option value="to-hotel">{t.toHotelOption ?? "Pick up (Airport to Hotel/Resort)"}</option>
          <option value="to-airport">
            {t.toAirportOption ?? "Drop off (Hotel/Resort to Airport)"}
          </option>
          <option value="both">{t.roundTripOption ?? "Pickup & Drop off (Round Trip)"}</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Stepper label={t.adults ?? "Adults"} value={adults} min={1} onChange={setAdults} />
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
      <p className="-mt-3 text-xs text-ink/60">
        {t.childrenFree ?? "Children under 5 ride free — they don't add to your total."}
      </p>

      {!ready || !place ? (
        <p className="flex items-start gap-2.5 rounded-xl bg-sand px-4 py-3 text-sm leading-relaxed text-ink/70">
          <FaSyncAlt className="mt-0.5 shrink-0 text-xs text-ink/35" />
          {t.chooseFirst ??
            "Choose your hotel and we'll calculate your price for you — no maths, nothing to work out."}
        </p>
      ) : (
        <div className="rounded-xl bg-ink px-5 py-4 text-white">
          {/*
            The explicit "this updates by itself" cue the owner asked for: not
            just a number that silently changes, but a stated fact that it
            does, so nothing here reads as needing a button pressed to price
            it.
          */}
          <p className="flex items-center gap-1.5 text-[0.7rem] font-medium uppercase tracking-wide text-white/50">
            <FaSyncAlt className="text-[0.6rem]" />
            {t.autoPriced ?? "Calculated automatically for you"}
          </p>
          <div className="mt-1.5 flex items-baseline justify-between gap-4">
            <span className="text-sm font-semibold">{t.total ?? "Total"}</span>
            <span className="shrink-0 font-display text-3xl font-semibold text-gold-400">
              {quote?.total != null ? money(quote.total) : t.askUs ?? "Ask us"}
            </span>
          </div>
          <p className="mt-1 text-xs text-white/60">{place.name}</p>
        </div>
      )}

      <button
        type="button"
        onClick={goToDetails}
        disabled={!canContinue}
        className="btn-primary w-full disabled:opacity-40"
      >
        {canContinue
          ? (t.continueWith ?? "Continue with booking · {amount}").replace(
              "{amount}",
              money(quote.total)
            )
          : t.continue ?? "Continue with booking"}
      </button>
    </div>
  );
}
