/**
 * Every pickup point the site can price from, by the name a guest would
 * actually recognise.
 *
 * Guests do not know they are "in the Falmouth band" — they know they are at
 * Iberostar Joia. So the resort is the one thing the site asks for, and
 * everything downstream is derived from it:
 *
 *   `zone`     which excursion price list applies
 *   `zoneEst`  true when that pairing is our inference, not his instruction
 *   `transfer` the airport transfer rate to and from Sangster (MBJ)
 *
 * He published excursion prices from five origins. The resorts outside them
 * are mapped to the nearest of those lists, or to one of the three derived
 * origins in `estimated-zones.js`, and every such resort carries `zoneEst`
 * so the page can say the figure is indicative.
 */

import { ESTIMATED_ZONES } from "./estimated-zones.js";

/** The five excursion price lists the owner supplied. */
export const QUOTED_ZONES = [
  { key: "mobay-hotels", label: "Montego Bay hotels", short: "Montego Bay" },
  { key: "mobay-pier", label: "Montego Bay cruise pier", short: "MoBay pier" },
  {
    key: "falmouth-hotels",
    label: "Falmouth & Trelawny hotels",
    short: "Falmouth",
  },
  {
    key: "falmouth-pier",
    label: "Falmouth cruise pier",
    short: "Falmouth pier",
  },
  {
    key: "palladium",
    label: "Grand Palladium / Lady Hamilton",
    short: "Grand Palladium",
  },
];

/**
 * Every origin the site can price from.
 *
 * The three appended here are places he drives from but has never published a
 * rate for. Their prices are derived rather than quoted, and are marked as
 * such wherever they are shown.
 */
export const ZONES = [
  ...QUOTED_ZONES,
  ...ESTIMATED_ZONES.map((z) => ({ ...z, est: true })),
];

/** Display grouping in the picker — geography, not price. */
export const AREAS = [
  { key: "montego-bay", label: "Montego Bay" },
  { key: "falmouth", label: "Falmouth & Trelawny" },
  { key: "hanover", label: "Hanover & Green Island" },
  { key: "ocho-rios", label: "Ocho Rios & St. Ann" },
  { key: "negril", label: "Negril" },
  { key: "south-coast", label: "South Coast" },
  { key: "piers", label: "Cruise piers" },
];

/**
 * @typedef {object} Place
 * @property {string}    key
 * @property {string}    name      as the guest would say it
 * @property {string}    area      AREAS key
 * @property {string?}   zone      ZONES key, or null if excursions are quote-only
 * @property {object?}   transfer  {oneWay, roundTrip} — per-person rates
 * @property {string[]?} aka       extra search terms
 */

/**
 * Airport transfer rates, per person, so the 46 below stay readable and
 * checkable.
 *
 * Both numbers are per head, and a party is billed for at least four of them.
 * The separate `oneWayExtra`/`roundTripExtra` figures these replaced had
 * drifted on thirteen of the rows — $30 one way with a $10 fifth head, when
 * the four who paid the $30 were being charged $7.50 each.
 */
const t = (oneWay, roundTrip) => ({ oneWay, roundTrip });

const MOBAY = "mobay-hotels";
const FALMOUTH = "falmouth-hotels";
const PALLADIUM = "palladium";
const OCHO = "ocho-rios-hotels";
const NEGRIL = "negril-hotels";
const SOUTH = "south-coast-hotels";

export const PLACES = [
  // Montego Bay
  { key: "toby-resort", name: "Toby Resort", area: "montego-bay", zone: MOBAY, transfer: t(5, 10) },
  { key: "royal-decameron-cornwall", name: "Royal Decameron Cornwall Beach", area: "montego-bay", zone: MOBAY, transfer: t(5, 10), aka: ["Decameron"] },
  { key: "s-hotel", name: "S Hotel Jamaica", area: "montego-bay", zone: MOBAY, transfer: t(5, 10) },
  { key: "deja-resort", name: "Deja Resort", area: "montego-bay", zone: MOBAY, transfer: t(5, 10) },
  { key: "club-montego-bay", name: "Club Montego Bay", area: "montego-bay", zone: MOBAY, transfer: t(5, 10) },
  { key: "altamont", name: "Altamont Hotel", area: "montego-bay", zone: MOBAY, transfer: t(5, 10), aka: ["Altamont West"] },
  { key: "hotel-39", name: "Hotel 39", area: "montego-bay", zone: MOBAY, transfer: t(5, 10) },
  { key: "caribic-house", name: "Caribic House Hotel", area: "montego-bay", zone: MOBAY, transfer: t(5, 10) },
  { key: "secrets-wild-orchid", name: "Secrets Wild Orchid", area: "montego-bay", zone: MOBAY, transfer: t(7.5, 15) },
  { key: "secrets-st-james", name: "Secrets St. James", area: "montego-bay", zone: MOBAY, transfer: t(7.5, 15) },
  { key: "breathless", name: "Breathless Montego Bay Resort & Spa", area: "montego-bay", zone: MOBAY, transfer: t(7.5, 15) },
  { key: "sandals-montego-bay", name: "Sandals Montego Bay", area: "montego-bay", zone: MOBAY, transfer: t(7.5, 15) },
  { key: "riu-montego-bay", name: "Riu Montego Bay", area: "montego-bay", zone: MOBAY, transfer: t(7.5, 15) },
  { key: "riu-palace", name: "Riu Palace Jamaica", area: "montego-bay", zone: MOBAY, transfer: t(7.5, 15) },
  { key: "riu-reggae", name: "Riu Reggae", area: "montego-bay", zone: MOBAY, transfer: t(7.5, 15) },
  { key: "sandals-royal-caribbean", name: "Sandals Royal Caribbean", area: "montego-bay", zone: MOBAY, transfer: t(7.5, 15) },
  { key: "zoetry", name: "Zoetry Montego Bay", area: "montego-bay", zone: MOBAY, transfer: t(7.5, 15) },
  { key: "half-moon", name: "Half Moon Resort", area: "montego-bay", zone: MOBAY, transfer: t(10, 20) },
  { key: "jewel-grande", name: "Jewel Grande Montego Bay", area: "montego-bay", zone: MOBAY, transfer: t(10, 20) },
  { key: "iberostar-waves", name: "Iberostar Waves Rose Hall", area: "montego-bay", zone: MOBAY, transfer: t(10, 20) },
  { key: "iberostar-selection", name: "Iberostar Selection Rose Hall Suites", area: "montego-bay", zone: MOBAY, transfer: t(10, 20) },
  { key: "iberostar-joia", name: "Iberostar Joia Rose Hall", area: "montego-bay", zone: MOBAY, transfer: t(10, 20) },

  // Falmouth & Trelawny
  { key: "excellence-oyster-bay", name: "Excellence Oyster Bay", area: "falmouth", zone: FALMOUTH, transfer: t(15, 30) },
  { key: "riu-aquarelle", name: "Riu Aquarelle", area: "falmouth", zone: FALMOUTH, transfer: t(15, 30) },
  { key: "royalton-blue-waters", name: "Royalton Blue Waters", area: "falmouth", zone: FALMOUTH, transfer: t(15, 30) },
  { key: "ocean-eden-bay", name: "Ocean Eden Bay", area: "falmouth", zone: FALMOUTH, transfer: t(17.5, 35) },
  { key: "ocean-coral-spring", name: "Ocean Coral Spring", area: "falmouth", zone: FALMOUTH, transfer: t(17.5, 35), aka: ["Ocean Coral Springs"] },
  { key: "bahia-principe", name: "Bahia Principe Grand Jamaica", area: "falmouth", zone: FALMOUTH, zoneEst: true, transfer: t(20, 40) },
  { key: "franklyn-d", name: "Franklyn D. Resort & Spa", area: "falmouth", zone: FALMOUTH, zoneEst: true, transfer: t(20, 40), aka: ["FDR"] },

  // Hanover & Green Island
  { key: "round-hill", name: "Round Hill Hotel & Villas", area: "hanover", zone: MOBAY, zoneEst: true, transfer: t(10, 20) },
  { key: "tryall", name: "Tryall Club", area: "hanover", zone: MOBAY, zoneEst: true, transfer: t(12.5, 25) },
  { key: "grand-palladium", name: "Grand Palladium Jamaica", area: "hanover", zone: PALLADIUM, transfer: t(15, 30) },
  { key: "lady-hamilton", name: "Grand Palladium Lady Hamilton", area: "hanover", zone: PALLADIUM, transfer: t(15, 30) },
  { key: "princess-jamaica", name: "Princess Grand / Senses Jamaica", area: "hanover", zone: PALLADIUM, zoneEst: true, transfer: t(25, 50), aka: ["Princess Resort"] },

  // Ocho Rios & St. Ann
  { key: "riu-ocho-rios", name: "Riu Ocho Rios", area: "ocho-rios", zone: OCHO, zoneEst: true, transfer: t(25, 50) },
  { key: "sandals-dunns-river", name: "Sandals Dunns River", area: "ocho-rios", zone: OCHO, zoneEst: true, transfer: t(25, 50) },
  { key: "moon-palace", name: "Moon Palace Jamaica", area: "ocho-rios", zone: OCHO, zoneEst: true, transfer: t(25, 50) },
  { key: "sandals-ochi", name: "Sandals Ochi Beach Resort", area: "ocho-rios", zone: OCHO, zoneEst: true, transfer: t(25, 50) },
  { key: "sandals-royal-plantation", name: "Sandals Royal Plantation", area: "ocho-rios", zone: OCHO, zoneEst: true, transfer: t(25, 50) },
  { key: "jamaica-inn", name: "Jamaica Inn", area: "ocho-rios", zone: OCHO, zoneEst: true, transfer: t(25, 50) },
  { key: "couples-sans-souci", name: "Couples Sans Souci", area: "ocho-rios", zone: OCHO, zoneEst: true, transfer: t(30, 60), aka: ["San Souci"] },
  { key: "couples-tower-isle", name: "Couples Tower Isle", area: "ocho-rios", zone: OCHO, zoneEst: true, transfer: t(30, 60) },
  { key: "goldeneye", name: "GoldenEye Resort", area: "ocho-rios", zone: OCHO, zoneEst: true, transfer: t(42.5, 85) },

  // Negril
  { key: "negril-beach", name: "Negril beach hotels (Seven Mile Beach)", area: "negril", zone: NEGRIL, zoneEst: true, transfer: t(25, 50) },
  { key: "negril-west-end", name: "Negril West End hotels", area: "negril", zone: NEGRIL, zoneEst: true, transfer: t(30, 60), aka: ["cliffs"] },

  // South Coast
  { key: "sandals-south-coast", name: "Sandals South Coast", area: "south-coast", zone: SOUTH, zoneEst: true, transfer: t(30, 60), aka: ["Whitehouse"] },

  // Cruise piers
  { key: "mobay-cruise-pier", name: "Montego Bay Cruise Terminal", area: "piers", zone: "mobay-pier", transfer: null, aka: ["cruise ship", "pier"] },
  { key: "falmouth-cruise-pier", name: "Historic Falmouth Cruise Port", area: "piers", zone: "falmouth-pier", transfer: null, aka: ["cruise ship", "pier"] },
];

export function getPlace(key) {
  return PLACES.find((p) => p.key === key) ?? null;
}

export function getZone(key) {
  return ZONES.find((z) => z.key === key) ?? null;
}

export function getAreaLabel(key) {
  return AREAS.find((a) => a.key === key)?.label ?? key;
}

/**
 * Places grouped for a picker, in AREAS order, empty groups dropped.
 *
 * `filter` narrows the list before grouping. The airport pickers pass
 * `(p) => p.transfer`, because the two cruise piers have no fare and offering
 * them would produce a resort the form cannot price.
 */
export function placesByArea(filter) {
  const list = filter ? PLACES.filter(filter) : PLACES;
  return AREAS.map((area) => ({
    ...area,
    places: list.filter((p) => p.area === area.key),
  })).filter((g) => g.places.length > 0);
}

/** Every place that can be an airport-transfer destination. */
export function transferPlaces() {
  return PLACES.filter((p) => p.transfer);
}

/**
 * Loose name match for the picker's search box. Matches the resort name, its
 * area and any `aka`, so "cliffs", "FDR" and "Negril" all find something.
 */
export function searchPlaces(input) {
  const q = input.trim().toLowerCase();
  if (!q) return PLACES;
  return PLACES.filter((p) =>
    [p.name, getAreaLabel(p.area), ...(p.aka ?? [])]
      .join(" ")
      .toLowerCase()
      .includes(q)
  );
}
