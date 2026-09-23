"use client";

import { useCallback, useRef, useState } from "react";
import { FaPlane, FaSyncAlt } from "react-icons/fa";
import { quoteTransfer, money, describeDirection } from "@/app/products/pricing";
import HotelSearch from "./HotelSearch";
import BookingForm, { Stepper } from "./BookingForm";
import { usePlace } from "./PlaceProvider";

const DIRECTIONS = ["to-hotel", "to-airport", "both"];

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
        <span className="label">{t.direction ?? "Which way?"}</span>
        <div className="grid grid-cols-3 gap-1.5 rounded-xl border border-ink/15 p-1.5">
          {DIRECTIONS.map((key) => {
            const label =
              key === "to-hotel"
                ? t.toHotel ?? "Airport → hotel"
                : key === "to-airport"
                  ? t.toAirport ?? "Hotel → airport"
                  : t.roundTrip ?? "Round trip";
            return (
              <button
                key={key}
                type="button"
                onClick={() => setDirection(key)}
                aria-pressed={direction === key}
                className={`min-h-[44px] rounded-lg px-2 py-2 text-xs font-semibold transition sm:text-sm ${
                  direction === key
                    ? "bg-crimson-600 text-white shadow-sm"
                    : "text-ink/60 hover:bg-ink/5"
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Stepper label={t.adults ?? "Adults"} value={adults} min={1} onChange={setAdults} />
        <Stepper label={t.children ?? "Children"} value={children} min={0} onChange={setChildren} />
      </div>

      {!ready || !place ? (
        <p className="rounded-xl bg-sand px-4 py-3 text-sm leading-relaxed text-ink/70">
          {t.chooseFirst ??
            "Choose your hotel above and the price appears here — it updates automatically as you change anything on this page."}
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
            {t.autoPriced ?? "Price updates automatically"}
          </p>
          <div className="mt-1.5 flex items-baseline justify-between gap-4">
            <span className="text-sm font-semibold">
              {t[
                direction === "both"
                  ? "roundTrip"
                  : direction === "to-airport"
                    ? "toAirport"
                    : "toHotel"
              ] ?? describeDirection(direction)}
            </span>
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
