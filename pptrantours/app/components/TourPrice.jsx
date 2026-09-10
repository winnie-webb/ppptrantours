"use client";

import {
  money,
  perPerson,
  lowestTransport,
  VEHICLE_CAPACITY,
} from "@/app/products/pricing";
import { usePlace } from "./PlaceProvider";

/**
 * The price on a card.
 *
 * Leads with the per-head figure, because that is the unit every other tour
 * site quotes in and a bare "$200" reads as four times a competitor's "$50pp"
 * when it is the same money. The vehicle total sits directly underneath, so the
 * card never implies that two travellers pay half of four.
 *
 * Three states, and the third is the one that matters. Before the guest names a
 * resort we can only show the cheapest run anywhere. Once they have, we show
 * their actual price. And where the owner never published a rate from their
 * resort we say so and invite the question, rather than quietly falling back to
 * a number that is not theirs.
 */
export default function TourPrice({ tour, dict, align = "left" }) {
  const { place, zone, ready } = usePlace();
  const t = dict?.price ?? {};

  const band = zone ? tour.zones?.[zone] : null;
  const floor = lowestTransport(tour);
  const known = ready && place;

  const wrap = align === "right" ? "text-right" : "";

  // Owner published no rate from this guest's resort.
  if (known && !band) {
    return (
      <div className={wrap}>
        <span className="block text-[0.68rem] font-medium uppercase tracking-wider text-ink/45">
          {t.fromYourResort ?? "From your resort"}
        </span>
        <span className="font-display text-lg font-semibold text-crimson-700">
          {t.askUs ?? "Ask us"}
        </span>
        <span className="ml-1 text-xs text-ink/45">
          {t.weWillQuote ?? "we'll quote it"}
        </span>
      </div>
    );
  }

  const vehicle = band ? band.price : floor;
  if (vehicle == null) {
    return (
      <div className={wrap}>
        <span className="font-display text-lg font-semibold text-crimson-700">
          {t.askUs ?? "Ask us"}
        </span>
      </div>
    );
  }

  const basis = (t.vehicleBasis ?? "{amount} per vehicle · up to {capacity}")
    .replace("{amount}", money(vehicle))
    .replace("{capacity}", String(VEHICLE_CAPACITY));

  return (
    <div className={wrap}>
      <span className="block text-[0.68rem] font-medium uppercase tracking-wider text-ink/45">
        {band ? t.fromYourResort ?? "From your resort" : t.from ?? "From"}
      </span>
      <span className="font-display text-2xl font-semibold text-crimson-700">
        {money(perPerson(vehicle, VEHICLE_CAPACITY))}
      </span>
      <span className="ml-1 text-xs text-ink/45">
        {t.perPerson ?? "/ person"}
      </span>
      <span className="mt-0.5 block text-[0.68rem] leading-snug text-ink/40">
        {basis}
      </span>
    </div>
  );
}
