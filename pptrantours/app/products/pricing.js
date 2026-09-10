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
export function quoteExcursion(tour, { zoneKey, adults, children, choices, addons }) {
  const pax = clampPax(adults + children);
  const transport = priceTransport(tour, zoneKey, pax);
  const entry = priceEntry(tour, { adults, children, choices, addons });

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

function clampPax(n) {
  const v = Number.parseInt(n, 10);
  if (!Number.isFinite(v)) return 1;
  return Math.min(MAX_PARTY, Math.max(1, v));
}
