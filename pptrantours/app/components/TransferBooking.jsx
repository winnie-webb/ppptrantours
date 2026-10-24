"use client";

import { useCallback, useRef, useState } from "react";
import { FaPlane, FaSyncAlt } from "react-icons/fa";
import { quoteTransfer, money } from "@/app/products/pricing";
import HotelSearch from "./HotelSearch";
import DirectionPicker from "./DirectionPicker";
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
  // No default: the guest chooses the transfer type (owner's call, 2026-10-24).
  const [direction, setDirection] = useState(null);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [booked, setBooked] = useState(false);
  const [formKey, setFormKey] = useState(0);
  const formRef = useRef(null);

  const quote =
    place && direction ? quoteTransfer(place.key, { direction, adults, children }) : null;
  const priced = ready && Boolean(place) && Boolean(direction);

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

  const canContinue = Boolean(priced && quote?.total != null);

  return (
    <div className="card space-y-6 p-6 sm:p-8">
      <div className="flex items-center gap-2.5 text-sm font-semibold text-ink/60">
        <span className="grid h-8 w-8 place-items-center rounded-lg bg-crimson-50 text-crimson-600">
          <FaPlane className="text-xs" />
        </span>
        {t.from ?? "From Sangster International (MBJ)"}
      </div>

      <div>
        <span className="label">{t.destination ?? "Where are you staying?"}</span>
        <HotelSearch variant="field" id="transfer-hotel" dict={dict} />
      </div>

      <DirectionPicker value={direction} onChange={setDirection} t={t} />

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

      {!priced ? (
        /*
          One quiet line in the exact spot the price will appear, so the guest
          learns where to look and that nothing needs working out. It used to
          be a large yellow banner under the hotel box; the owner wanted less
          on screen.
        */
        <p className="text-balance text-center text-sm font-bold leading-snug text-ink">
          <FaSyncAlt className="mr-1.5 inline align-[-1px] text-xs text-crimson-600" />
          {t.chooseFirst ??
            "Just select your hotel and transfer type — your price is calculated automatically."}
        </p>
      ) : (
        <div className="rounded-xl bg-ink px-5 py-4 text-white">
          {/*
            The explicit "this updates by itself" cue the owner asked for: not
            just a number that silently changes, but a stated fact that it
            does, so nothing here reads as needing a button pressed to price
            it.
          */}
          <p className="flex items-center gap-2 text-sm font-semibold text-gold-300">
            <FaSyncAlt className="text-xs" />
            {t.autoPriced ?? "Calculated automatically for you"}
          </p>
          <div className="mt-1.5 flex items-baseline justify-between gap-4">
            <span className="text-sm font-semibold">{t.total ?? "Total"}</span>
            {/* Keyed on the figure so every recalculation visibly lands. */}
            <span
              key={quote?.total ?? "ask"}
              aria-live="polite"
              className="shrink-0 animate-fade-up font-display text-3xl font-semibold text-gold-400"
            >
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
        {/* The price is shown once, in the box above — not repeated here. */}
        {t.continue ?? "Continue with booking"}
      </button>
    </div>
  );
}
