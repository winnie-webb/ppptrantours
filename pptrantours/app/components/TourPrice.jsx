"use client";

import { money, lowestTransport } from "@/app/products/pricing";
import { usePlace } from "./PlaceProvider";

/**
 * The price on a card.
 *
 * Three states, and the third is the one that matters. Before the guest names
 * a resort we can only show the cheapest run anywhere ("from $180"). Once they
 * have, we show their actual price. And where the owner never published a rate
 * from their resort we say so and invite the question, rather than quietly
 * falling back to a number that is not theirs.
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

  const amount = band ? band.price : floor;
  if (amount == null) {
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
      <span className="block text-[0.68rem] font-medium uppercase tracking-wider text-ink/45">
        {band ? t.fromYourResort ?? "From your resort" : t.from ?? "From"}
      </span>
      <span className="font-display text-2xl font-semibold text-crimson-700">
        {money(amount)}
      </span>
      <span className="ml-1 text-xs text-ink/45">
        {t.perVehicle ?? "for up to 4"}
      </span>
    </div>
  );
}
