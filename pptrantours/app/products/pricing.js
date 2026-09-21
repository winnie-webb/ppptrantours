/**
 * Every number the site quotes comes out of this file.
 *
 * The rule that shapes all of it: **transport is per person with a four-person
 * minimum, and transport is the only thing PPP prices.** The total is
 * `rate * max(4, pax)`, so one, two, three and four people pay the same and
 * the fifth guest onward each add the plain rate.
 *
 * ATTRACTION ADMISSION IS NOT PRICED HERE, BY DECISION (Winston, 2026-09-21).
 * The gates are the attraction's business, the guest pays them directly, and
 * the site quotes one number: what PPP charges to drive them. An earlier
 * version itemised gate fees beside the fare and printed a combined "day
 * total", which put three numbers on a booking form that needs one. Do not
 * bring entry-fee arithmetic back into this file.
 *
 * The browser and the API route both import this. If they ever disagreed, a
 * guest would be shown one total and charged another.
 */
import { MIN_BILLED_PAX } from "@/app/data/catalogue";
import { getPlace } from "@/app/data/places";

export { MIN_BILLED_PAX };

/**
 * No cap on party size — the owner takes any number and hires in what it needs.
 *
 * This was 30, which silently stopped the stepper and clamped anything larger.
 * The guard that is left exists only so a hand-posted body cannot put an absurd
 * integer through the price arithmetic; no real party will ever reach it.
 */
export const MAX_PARTY = 999;

/**
 * Heads charged for, which is not the same as heads travelling.
 *
 * The floor is the whole commercial model: a solo guest still occupies the
 * driver's day, so four is the least anyone is billed for. It is also the
 * reason the site can honestly say that the more people join, the less each
 * pays.
 */
export function billedPax(pax) {
  return Math.max(MIN_BILLED_PAX, clampPax(pax));
}

/* ── Transport ─────────────────────────────────────────────────────────────── */

/**
 * Transport for an excursion, from one zone.
 *
 * `rate` is the per-head figure and `minimum` is what a party of fewer than
 * four pays; `billed` says how many heads the total was actually struck on, so
 * the UI can explain a total without recomputing it.
 *
 * @returns {{rate:number, billed:number, pax:number, minimum:number,
 *   atMinimum:boolean, total:number}|null}
 *   null when the owner has published no rate for that zone — the caller must
 *   show an "ask us" path rather than a number.
 */
export function priceTransport(tour, zoneKey, pax) {
  const band = tour?.zones?.[zoneKey];
  if (!band) return null;
  return quote(band.rate, pax);
}

/**
 * Transport for an airport transfer, to or from Sangster.
 *
 * @param {string} tripType "one-way" | "round-trip"
 */
export function priceTransfer(placeKey, tripType, pax) {
  const place = getPlace(placeKey);
  if (!place?.transfer) return null;

  const round = tripType === "round-trip";
  const rate = round ? place.transfer.roundTrip : place.transfer.oneWay;
  if (rate == null) return null;

  return { ...quote(rate, pax), round };
}

/** The one piece of transport arithmetic on the site. */
function quote(rate, pax) {
  const people = clampPax(pax);
  const billed = billedPax(people);

  return {
    rate,
    billed,
    pax: people,
    minimum: rate * MIN_BILLED_PAX,
    // Below the floor the guest is paying for heads that are not travelling,
    // which is the one thing the page must never leave unexplained.
    atMinimum: people < MIN_BILLED_PAX,
    total: rate * billed,
  };
}

/* ── One quote, one number ─────────────────────────────────────────────────── */

/**
 * What this excursion costs, which is the transport and nothing else.
 *
 * `transport` is kept alongside `total` because the payment path needs the
 * structured figure (see `payable`), not because there is a second number to
 * show. The form prints `total`.
 */
export function quoteExcursion(tour, { zoneKey, adults, children }) {
  const pax = clampPax(adults + children);
  const transport = priceTransport(tour, zoneKey, pax);

  /*
   * A derived rate is no longer distinguished here.
   *
   * It used to be: a band we worked out, or a resort whose price list we had
   * inferred, came back flagged, and `payable()` then refused to collect
   * against it. That put seventeen of the forty-eight resorts — a third of the
   * list — on an "ask us" path with no way to pay, to protect a figure that is
   * transport only and is in the right band either way. The flag is gone and
   * the provenance lives in the header of estimated-zones.js, where it belongs.
   */

  // Null transport means "ask us", so there is no total to show yet.
  return { pax, transport, total: transport?.total ?? null };
}

export function quoteTransfer(placeKey, { tripType, adults, children }) {
  const pax = clampPax(adults + children);
  const transport = priceTransfer(placeKey, tripType, pax);
  return { pax, transport, total: transport?.total ?? null };
}

/* ── What may actually be collected ────────────────────────────────────────── */

/**
 * Money is handled in integer cents everywhere past this point.
 *
 * A one-cent float error in a payment path surfaces as a hash or amount check
 * that fails at 3am against a real card, so dollars never reach the provider or
 * a comparison — they are converted once, here.
 */
export function toCents(dollars) {
  return Math.round(Number(dollars) * 100);
}

export function fromCents(cents) {
  return Number(cents) / 100;
}

/**
 * What PPP may charge online for a quote, and whether it may charge at all.
 *
 * THE BASIS IS `transport.total`, AND ONLY `transport.total`.
 *
 * It is the same figure as `quote.total` now that transport is the only thing
 * priced, and it is read from `transport` deliberately: if anything is ever
 * added to a quote again, this must keep charging the fare and nothing else.
 *
 * Two reasons a booking is not collectible, both already representable in the
 * data rather than invented here:
 *
 *   no-transport    the owner publishes no rate from that resort for that tour.
 *                   The page shows "Ask us" and there is no number to charge.
 *   below-minimum   PayPal rejects an order under $0.01, and a transfer
 *                   priced under a dollar is a data error rather than a fare.
 *                   The $1.00 floor is kept from the WiPay era on that basis.
 *
 * @returns {{collectible: boolean, reason: string|null, payableCents: number}}
 */
export function payable(quote) {
  const total = quote?.transport?.total;

  if (total == null) {
    return { collectible: false, reason: "no-transport", payableCents: 0 };
  }

  const payableCents = toCents(total);
  if (!Number.isFinite(payableCents) || payableCents < 100) {
    return { collectible: false, reason: "below-minimum", payableCents: 0 };
  }

  return { collectible: true, reason: null, payableCents };
}

/* ── Shop-window figures ───────────────────────────────────────────────────── */

/**
 * Cheapest per-person rate across every zone a tour is priced from — the
 * "from $X / person" on a card, when we do not yet know where the guest is
 * staying.
 *
 * A rate, not a total. It is the same number the booking page will show once
 * the guest names a resort, which is the whole point: the card and the form
 * used to print two different per-head figures for the same tour.
 */
export function lowestTransport(tour) {
  const bands = Object.values(tour?.zones ?? {});
  if (bands.length === 0) return null;
  return Math.min(...bands.map((b) => b.rate));
}

/**
 * What a party of four or fewer actually pays at this rate.
 *
 * Shop-window copy needs both numbers: the rate is the headline, but "$7.50 one
 * way" is not a fare anybody is ever charged — the smallest cheque is $30. Any
 * sentence quoting a single amount for a trip wants this, not the rate.
 */
export function minimumFare(rate) {
  return rate == null ? null : rate * MIN_BILLED_PAX;
}

/** Cheapest one-way transfer rate in a group of places. */
export function lowestTransfer(placeKeys) {
  const rates = placeKeys
    .map((k) => getPlace(k)?.transfer?.oneWay)
    .filter((n) => typeof n === "number");
  return rates.length ? Math.min(...rates) : null;
}

/** Whether this tour can be priced at all from where the guest is staying. */
export function isPricedFrom(tour, zoneKey) {
  return Boolean(zoneKey && tour?.zones?.[zoneKey]);
}

/* ── Formatting ────────────────────────────────────────────────────────────── */

export function money(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "—";
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

/*
 * `describeVehicle()` and `perPerson()` stood here and are deliberately gone.
 *
 * `perPerson(total, pax)` divided the total by the party actually travelling,
 * so a couple booking a $50/person tour were shown "$100 / person" on the
 * booking page and "$50 / person" on the card that sent them there. The rate is
 * stored now, so there is nothing to derive and no second number to disagree
 * with. Do not reintroduce it: below the four-head floor, total ÷ pax is not a
 * price anybody is charged.
 */

function clampPax(n) {
  const v = Number.parseInt(n, 10);
  if (!Number.isFinite(v)) return 1;
  return Math.min(MAX_PARTY, Math.max(1, v));
}
