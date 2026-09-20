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
 * Before the guest names a resort we show the cheapest run anywhere; once they
 * have, we show their actual price.
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

  /*
   * One number on a card, not two and a caveat.
   *
   * This used to print the per-head figure and then "{total} per vehicle · up
   * to 4" underneath it, which is three lines of pricing on every card in a
   * grid of twenty-four. The per-vehicle basis is a real and important point,
   * but it belongs on the booking page next to the thing being bought — which
   * is where the form and the transparency note now make it.
   */
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
      {unpricedForPlace && (
        <span className="mt-0.5 block text-[0.68rem] leading-snug text-ink/40">
          {t.confirmYours ?? "we'll confirm yours"}
        </span>
      )}
    </div>
  );
}
