"use client";

import { money, lowestTransport } from "@/app/products/pricing";
import { usePlace } from "./PlaceProvider";

/**
 * The price on a card.
 *
 * The per-head rate, on its own.
 *
 * It used to carry "minimum 4 people" underneath. That reads as a condition of
 * booking rather than a billing floor — the owner's words: it "leads me to
 * believe that unless I have four persons, I couldn't do it alone or with two
 * persons". A solo traveller who believes that does not book at all. The party
 * size is asked for on the booking page and the price follows from it; nothing
 * on a card needs to pre-empt that.
 *
 * This figure is now the stored rate rather than a total divided by an assumed
 * party size, which is what stopped the card and the booking page printing two
 * different per-head numbers for the same tour.
 *
 * Before the guest names a resort we show the cheapest run anywhere; once they
 * have, we show their actual rate.
 *
 * Where the owner published no rate from their resort we used to replace the
 * number with "Ask us". That punished the guest for answering the one question
 * the site keeps asking them: the card said "From $50 / person" until they
 * picked their hotel, and then the price vanished. We keep the floor figure and
 * say we'll confirm theirs instead — the number was never a promise for a
 * specific resort anyway, which is what "From" means.
 */
export default function TourPrice({ tour, dict, align = "left" }) {
  const { place, zone, ready } = usePlace();
  const t = dict?.price ?? {};

  const band = zone ? tour.zones?.[zone] : null;
  const floor = lowestTransport(tour);
  const known = ready && place;

  // Their resort is known but unpriced: show the floor, labelled as a floor.
  const unpricedForPlace = known && !band;

  const wrap = align === "right" ? "text-right" : "";

  const rate = band ? band.rate : floor;
  if (rate == null) {
    return (
      <div className={wrap}>
        <span className="font-display text-lg font-semibold text-crimson-700">
          {t.askUs ?? "Ask us"}
        </span>
      </div>
    );
  }

  return (
    <div className={wrap}>
      <span className="block text-xs font-medium uppercase tracking-wider text-ink/70">
        {band ? t.fromYourResort ?? "From your resort" : t.from ?? "From"}
      </span>
      <span className="font-display text-2xl font-semibold text-crimson-700">
        {money(rate)}
      </span>
      <span className="ml-1 text-xs text-ink/70">
        {t.perPerson ?? "/ person"}
      </span>
      {unpricedForPlace && (
        <span className="block text-xs leading-snug text-ink/70">
          {t.confirmYours ?? "we'll confirm yours"}
        </span>
      )}
    </div>
  );
}
