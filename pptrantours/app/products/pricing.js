/**
 * Every number the site quotes comes out of this file.
 *
 * The rule that shapes all of it: **PPP charges for the vehicle, the attraction
 * charges for the head.** Transport is one price for up to four people with a
 * per-head rate after that; entry fees are per person and are paid at the gate,
 * never to us. Mixing the two up would misquote every booking, so they are
 * priced separately and only added together at the very end, clearly labelled.
 *
 * The browser and the API route both import this. If they ever disagreed, a
 * guest would be shown one total and charged another.
 */
import { VEHICLE_CAPACITY } from "@/app/data/catalogue";
import { getPlace } from "@/app/data/places";

export { VEHICLE_CAPACITY };

export const MAX_PARTY = 30;

/* ── Transport ─────────────────────────────────────────────────────────────── */

/**
 * Transport for an excursion, from one zone.
 *
 * @returns {{base:number, extra:number, extraPax:number, total:number}|null}
 *   null when the owner has published no price for that zone — the caller must
 *   show an "ask us" path rather than a number.
 */
export function priceTransport(tour, zoneKey, pax) {
  const band = tour?.zones?.[zoneKey];
  if (!band) return null;

  const people = clampPax(pax);
  const extraPax = Math.max(0, people - VEHICLE_CAPACITY);

  return {
    base: band.price,
    extra: band.extra,
    extraPax,
    total: band.price + band.extra * extraPax,
    /*
     * True when this band was derived by us rather than quoted by him.
     *
     * This used not to be returned at all, which meant `booking.estimatedNote`
     * in the booking form — already translated into ten languages, and reading
     * "we confirm the exact price before you pay anything" — had never once
     * rendered. Harmless while nothing could be charged. Load-bearing now:
     * `payable()` below refuses to collect against a figure carrying this flag.
     */
    est: Boolean(band.est),
  };
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
  const base = round ? place.transfer.roundTrip : place.transfer.oneWay;
  const extra = round
    ? place.transfer.roundTripExtra
    : place.transfer.oneWayExtra;

  const people = clampPax(pax);
  const extraPax = Math.max(0, people - VEHICLE_CAPACITY);

  return { base, extra, extraPax, total: base + extra * extraPax, round };
}

/* ── Entry fees ────────────────────────────────────────────────────────────── */

/**
 * What the gates will cost, itemised.
 *
 * `from` propagates up: if any single line is a "starts at" figure (the Dolphin
 * Cove programmes are), the whole estimate is a "from" and the UI must say so
 * rather than presenting it as a firm total.
 *
 * @param {object} tour
 * @param {{adults:number, children:number, choices?:object, addons?:string[]}} party
 * @returns {{lines:Array, total:number, from:boolean}}
 */
export function priceEntry(tour, { adults, children, choices = {}, addons = [] }) {
  const lines = [];
  let from = false;

  for (const c of tour?.entry?.components ?? []) {
    const line = priceComponent(c, adults, children, choices);
    if (line) {
      lines.push(line);
      if (line.from) from = true;
    }
  }

  for (const a of tour?.entry?.addons ?? []) {
    if (!addons.includes(a.key)) continue;
    const line = priceComponent(a, adults, children, choices);
    if (line) {
      lines.push({ ...line, addon: true });
      if (line.from) from = true;
    }
  }

  return {
    lines,
    total: lines.reduce((sum, l) => sum + l.amount, 0),
    from,
  };
}

function priceComponent(c, adults, children, choices) {
  if (c.kind === "person") {
    return {
      key: c.key ?? c.label,
      label: c.label,
      detail: describeHeads(c, adults, children),
      amount: c.adult * adults + (c.child ?? 0) * children,
      from: Boolean(c.from),
    };
  }

  if (c.kind === "choice") {
    const chosen =
      c.options.find((o) => o.key === choices[c.key]) ?? c.options[0];
    return {
      key: c.key,
      label: c.label,
      option: chosen.label,
      detail: describeHeads(chosen, adults, children),
      amount: chosen.adult * adults + (chosen.child ?? 0) * children,
      from: Boolean(chosen.from),
    };
  }

  if (c.kind === "unit") {
    // A Martha Brae raft seats two adults; a child under 12 rides free with
    // them. Three adults therefore need two rafts, not one and a half.
    const units = Math.max(1, Math.ceil(adults / c.per));
    return {
      key: c.key ?? c.label,
      label: c.label,
      detail: `${units} × ${c.unit} at ${money(c.price)}`,
      amount: units * c.price,
      from: false,
    };
  }

  return null;
}

function describeHeads(rate, adults, children) {
  const parts = [];
  if (adults > 0) parts.push(`${adults} × ${money(rate.adult)}`);
  if (children > 0 && rate.child != null) {
    parts.push(`${children} × ${money(rate.child)}`);
  }
  return parts.join(" + ");
}

/* ── The whole day ─────────────────────────────────────────────────────────── */

/**
 * Transport plus gates, kept apart in the result so the UI can be honest about
 * which half of the money is ours.
 */
export function quoteExcursion(
  tour,
  { zoneKey, zoneEst = false, adults, children, choices, addons }
) {
  const pax = clampPax(adults + children);
  const base = priceTransport(tour, zoneKey, pax);
  const entry = priceEntry(tour, { adults, children, choices, addons });

  /*
   * Two independent ways a transport figure can be provisional, and either is
   * enough to make it so:
   *
   *   band.est   he never published a price for this zone, so we derived one
   *   zoneEst    he never said which price list this resort belongs to, so we
   *              inferred that too — the figure is his, the mapping is not
   *
   * 19 of the 46 resorts carry `zoneEst`. The 46 airport-transfer rates
   * themselves are all his, transcribed from the WhatsApp thread, so nothing
   * equivalent is needed on `priceTransfer`.
   */
  const transport = base ? { ...base, est: base.est || Boolean(zoneEst) } : null;

  return {
    pax,
    transport,
    entry,
    // Null transport means "ask us", so there is no day total to show yet.
    dayTotal: transport ? transport.total + entry.total : null,
    from: entry.from,
  };
}

export function quoteTransfer(placeKey, { tripType, adults, children }) {
  const pax = clampPax(adults + children);
  const transport = priceTransfer(placeKey, tripType, pax);
  return { pax, transport, entry: null, dayTotal: transport?.total ?? null };
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
 * Entry fees are the attraction's money, handed over at the gate (see the
 * header of this file). Collecting a share of them into PPP's merchant account
 * would mean owing it straight back out again, and it would break the promise
 * made on every tour page that PPP never touches gate money. Never pass
 * `quote.dayTotal` to this function.
 *
 * Three reasons a booking is not collectible, all already representable in the
 * data rather than invented here:
 *
 *   no-transport    the owner publishes no rate from that resort for that tour.
 *                   The page shows "Ask us" and there is no number to charge.
 *   estimated       the figure is our inference, not his rate, and the form
 *                   already promises the guest we confirm it before they pay.
 *   below-minimum   WiPay rejects anything under $1.00 USD.
 *
 * @returns {{collectible: boolean, reason: string|null, payableCents: number}}
 */
export function payable(quote) {
  const total = quote?.transport?.total;

  if (total == null) {
    return { collectible: false, reason: "no-transport", payableCents: 0 };
  }
  if (quote.transport.est) {
    return { collectible: false, reason: "estimated", payableCents: 0 };
  }

  const payableCents = toCents(total);
  if (!Number.isFinite(payableCents) || payableCents < 100) {
    return { collectible: false, reason: "below-minimum", payableCents: 0 };
  }

  return { collectible: true, reason: null, payableCents };
}

/* ── Shop-window figures ───────────────────────────────────────────────────── */

/**
 * Cheapest transport across every zone a tour is priced from — the "from $X" on
 * a card, when we do not yet know where the guest is staying.
 */
export function lowestTransport(tour) {
  const bands = Object.values(tour?.zones ?? {});
  if (bands.length === 0) return null;
  return Math.min(...bands.map((b) => b.price));
}

/** Cheapest one-way transfer in a group of places. */
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

/** "up to 4 people" / "6 people" — the unit a transport price is quoted in. */
export function describeVehicle(pax) {
  return pax <= VEHICLE_CAPACITY
    ? `up to ${VEHICLE_CAPACITY} people`
    : `${pax} people`;
}

/**
 * The same money, divided by heads.
 *
 * A whole-vehicle figure is what the guest actually pays, but $200 next to a
 * competitor's "$50pp" reads as four times the price when it is the same price.
 * So the per-head figure leads and the vehicle total sits beside it — the
 * division is presentation, never a separate charge, and both numbers are
 * always shown together so nobody can mistake one for the other.
 *
 * Where the party size is not yet known (a card in a grid), callers pass
 * `VEHICLE_CAPACITY`: four is the most people the base price covers, so it
 * yields the lowest per-head figure the tour can reach — which is exactly what
 * "from" means, and why it must never appear without that qualifier.
 */
export function perPerson(total, pax) {
  const heads = Math.max(1, Number.parseInt(pax, 10) || 1);
  return total / heads;
}

function clampPax(n) {
  const v = Number.parseInt(n, 10);
  if (!Number.isFinite(v)) return 1;
  return Math.min(MAX_PARTY, Math.max(1, v));
}
