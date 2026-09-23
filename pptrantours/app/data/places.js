/**
 * Every pickup point the site can price from, by the name a guest would
 * actually recognise.
 *
 * Guests do not know they are "in the Falmouth band" — they know they are at
 * Iberostar Joia. So the resort is the one thing the site asks for, and
 * everything downstream is derived from it:
 *
 *   `zone`     which excursion price list applies
 *   `transfer` the airport transfer rate to and from Sangster (MBJ)
 *
 * He published excursion prices from five origins. The resorts outside them
 * are mapped to the nearest of those lists, or to one of the three derived
 * origins in `estimated-zones.js`.
 *
 * Every record also carries the hotel-search schema (09_DECISIONS.md, Q-03;
 * 07_HOTEL_SELECTION.md §6): `aliases` (extra search terms, renamed from the
 * old `aka`), `locality` (the search result's second line), `popularity`
 * (ordering for "Popular" and rank ties), `kind` ("hotel" | "pier" | "area"),
 * and `active` (hide without deleting).
 *
 * `active: false` + `pendingReview: true` marks a hotel added by mapping it
 * to an existing PPP price tier for the same area, rather than a rate the
 * owner quoted for that specific property. Q-03 is explicit that nothing
 * goes live unreviewed, so these are excluded from `activePlaces()` /
 * `searchHotels()` until Mr. Pugh confirms the tier and flips the flag. See
 * `docs/v2-ux/hotel-review-2026-09-23.csv` for the review sheet.
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

/**
 * Display grouping in the picker — geography, not price.
 *
 * `aliases` are extra terms a guest might type for the area itself — "MoBay",
 * "Ochi", "Runaway Bay" — indexed alongside every place in that area
 * (07_HOTEL_SELECTION.md §3.1).
 */
export const AREAS = [
  {
    key: "montego-bay",
    label: "Montego Bay",
    aliases: ["MoBay", "Mo Bay", "Rose Hall", "Ironshore"],
  },
  {
    key: "falmouth",
    label: "Falmouth & Trelawny",
    aliases: ["Trelawny", "Braco"],
  },
  {
    key: "hanover",
    label: "Hanover & Green Island",
    aliases: ["Green Island", "Lucea"],
  },
  {
    key: "ocho-rios",
    label: "Ocho Rios & St. Ann",
    aliases: ["Ochi", "Ocho", "Runaway Bay"],
  },
  {
    key: "negril",
    label: "Negril",
    aliases: ["Seven Mile Beach", "West End"],
  },
  {
    key: "south-coast",
    label: "South Coast",
    aliases: ["Whitehouse", "Treasure Beach", "Black River"],
  },
  { key: "piers", label: "Cruise piers", aliases: [] },
];

/**
 * @typedef {object} Place
 * @property {string}    key
 * @property {string}    name        as the guest would say it
 * @property {string}    area        AREAS key
 * @property {string?}   locality    second line in results, e.g. "Rose Hall"
 * @property {string?}   zone        ZONES key, or null if excursions are quote-only
 * @property {object?}   transfer    {oneWay, roundTrip} — per-person rates
 * @property {string[]?} aliases     extra search terms
 * @property {number}    popularity  ordering for "Popular" and rank ties
 * @property {"hotel"|"pier"|"area"} kind
 * @property {boolean}   active      false hides it from guest-facing search
 * @property {boolean?}  pendingReview  true = tier-assigned by dev, not yet owner-confirmed
 */

/**
 * Airport transfer rates, per person, so the list below stays readable and
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
  // ── Montego Bay ──────────────────────────────────────────────────────────
  { key: "toby-resort", name: "Toby Resort", area: "montego-bay", zone: MOBAY, transfer: t(5, 10), popularity: 3, kind: "hotel", active: true },
  { key: "royal-decameron-cornwall", name: "Royal Decameron Cornwall Beach", area: "montego-bay", zone: MOBAY, transfer: t(5, 10), aliases: ["Decameron"], popularity: 4, kind: "hotel", active: true },
  { key: "s-hotel", name: "S Hotel Jamaica", area: "montego-bay", zone: MOBAY, transfer: t(5, 10), popularity: 5, kind: "hotel", active: true },
  { key: "deja-resort", name: "Deja Resort", area: "montego-bay", zone: MOBAY, transfer: t(5, 10), popularity: 3, kind: "hotel", active: true },
  { key: "club-montego-bay", name: "Club Montego Bay", area: "montego-bay", zone: MOBAY, transfer: t(5, 10), popularity: 3, kind: "hotel", active: true },
  { key: "altamont", name: "Altamont Hotel", area: "montego-bay", zone: MOBAY, transfer: t(5, 10), aliases: ["Altamont West"], popularity: 3, kind: "hotel", active: true },
  { key: "hotel-39", name: "Hotel 39", area: "montego-bay", zone: MOBAY, transfer: t(5, 10), popularity: 2, kind: "hotel", active: true },
  { key: "caribic-house", name: "Caribic House Hotel", area: "montego-bay", zone: MOBAY, transfer: t(5, 10), popularity: 2, kind: "hotel", active: true },
  { key: "secrets-wild-orchid", name: "Secrets Wild Orchid", area: "montego-bay", zone: MOBAY, transfer: t(7.5, 15), popularity: 6, kind: "hotel", active: true },
  { key: "secrets-st-james", name: "Secrets St. James", area: "montego-bay", zone: MOBAY, transfer: t(7.5, 15), popularity: 6, kind: "hotel", active: true },
  { key: "breathless", name: "Breathless Montego Bay Resort & Spa", area: "montego-bay", zone: MOBAY, transfer: t(7.5, 15), popularity: 5, kind: "hotel", active: true },
  { key: "sandals-montego-bay", name: "Sandals Montego Bay", area: "montego-bay", zone: MOBAY, transfer: t(7.5, 15), popularity: 9, kind: "hotel", active: true },
  { key: "riu-montego-bay", name: "Riu Montego Bay", area: "montego-bay", zone: MOBAY, transfer: t(7.5, 15), popularity: 8, kind: "hotel", active: true },
  { key: "riu-palace", name: "Riu Palace Jamaica", area: "montego-bay", zone: MOBAY, transfer: t(7.5, 15), popularity: 6, kind: "hotel", active: true },
  { key: "riu-reggae", name: "Riu Reggae", area: "montego-bay", zone: MOBAY, transfer: t(7.5, 15), popularity: 6, kind: "hotel", active: true },
  { key: "sandals-royal-caribbean", name: "Sandals Royal Caribbean", area: "montego-bay", zone: MOBAY, transfer: t(7.5, 15), popularity: 7, kind: "hotel", active: true },
  { key: "zoetry", name: "Zoetry Montego Bay", area: "montego-bay", zone: MOBAY, transfer: t(7.5, 15), popularity: 5, kind: "hotel", active: true },
  { key: "half-moon", name: "Half Moon Resort", area: "montego-bay", locality: "Rose Hall", zone: MOBAY, transfer: t(10, 20), popularity: 9, kind: "hotel", active: true },
  { key: "jewel-grande", name: "Jewel Grande Montego Bay", area: "montego-bay", zone: MOBAY, transfer: t(10, 20), popularity: 6, kind: "hotel", active: true },
  { key: "iberostar-waves", name: "Iberostar Waves Rose Hall", area: "montego-bay", locality: "Rose Hall", zone: MOBAY, transfer: t(10, 20), popularity: 6, kind: "hotel", active: true },
  { key: "iberostar-selection", name: "Iberostar Selection Rose Hall Suites", area: "montego-bay", locality: "Rose Hall", zone: MOBAY, transfer: t(10, 20), popularity: 7, kind: "hotel", active: true },
  { key: "iberostar-joia", name: "Iberostar Joia Rose Hall", area: "montego-bay", locality: "Rose Hall", zone: MOBAY, transfer: t(10, 20), popularity: 8, kind: "hotel", active: true },

  // New Rose Hall / Montego Bay hotels, tier-mapped for owner review
  // (09_DECISIONS.md: "every new assignment is listed for owner review before launch").
  { key: "hyatt-ziva-rose-hall", name: "Hyatt Ziva Rose Hall", area: "montego-bay", locality: "Rose Hall", zone: MOBAY, transfer: t(10, 20), aliases: ["Hyatt Ziva"], popularity: 8, kind: "hotel", active: false, pendingReview: true },
  { key: "hyatt-zilara-rose-hall", name: "Hyatt Zilara Rose Hall", area: "montego-bay", locality: "Rose Hall", zone: MOBAY, transfer: t(10, 20), aliases: ["Hyatt Zilara"], popularity: 8, kind: "hotel", active: false, pendingReview: true },
  { key: "hilton-rose-hall", name: "Hilton Rose Hall Resort & Spa", area: "montego-bay", locality: "Rose Hall", zone: MOBAY, transfer: t(10, 20), popularity: 7, kind: "hotel", active: false, pendingReview: true },
  { key: "dreams-rose-hall", name: "Dreams Rose Hall Resort & Spa", area: "montego-bay", locality: "Rose Hall", zone: MOBAY, transfer: t(10, 20), popularity: 6, kind: "hotel", active: false, pendingReview: true },
  { key: "sea-castles", name: "Sea Castles Ocean Front Resort", area: "montego-bay", locality: "Rose Hall", zone: MOBAY, transfer: t(10, 20), popularity: 4, kind: "hotel", active: false, pendingReview: true },
  { key: "holiday-inn-rose-hall", name: "Holiday Inn Rose Hall Resort", area: "montego-bay", locality: "Rose Hall", zone: MOBAY, transfer: t(7.5, 15), aliases: ["Holiday Inn Montego Bay"], popularity: 5, kind: "hotel", active: false, pendingReview: true },

  // ── Falmouth & Trelawny ──────────────────────────────────────────────────
  { key: "excellence-oyster-bay", name: "Excellence Oyster Bay", area: "falmouth", zone: FALMOUTH, transfer: t(15, 30), popularity: 7, kind: "hotel", active: true },
  { key: "riu-aquarelle", name: "Riu Aquarelle", area: "falmouth", zone: FALMOUTH, transfer: t(15, 30), popularity: 5, kind: "hotel", active: true },
  { key: "royalton-blue-waters", name: "Royalton Blue Waters", area: "falmouth", zone: FALMOUTH, transfer: t(15, 30), popularity: 7, kind: "hotel", active: true },
  { key: "ocean-eden-bay", name: "Ocean Eden Bay", area: "falmouth", zone: FALMOUTH, transfer: t(17.5, 35), popularity: 5, kind: "hotel", active: true },
  { key: "ocean-coral-spring", name: "Ocean Coral Spring", area: "falmouth", zone: FALMOUTH, transfer: t(17.5, 35), aliases: ["Ocean Coral Springs"], popularity: 5, kind: "hotel", active: true },
  { key: "bahia-principe", name: "Bahia Principe Grand Jamaica", area: "falmouth", zone: FALMOUTH, transfer: t(20, 40), popularity: 6, kind: "hotel", active: true },
  { key: "franklyn-d", name: "Franklyn D. Resort & Spa", area: "falmouth", zone: FALMOUTH, transfer: t(20, 40), aliases: ["FDR"], popularity: 6, kind: "hotel", active: true },

  // New Falmouth & Trelawny hotels, tier-mapped for owner review.
  { key: "royalton-white-sands", name: "Royalton White Sands", area: "falmouth", zone: FALMOUTH, transfer: t(15, 30), popularity: 6, kind: "hotel", active: false, pendingReview: true },
  { key: "melia-braco-village", name: "Meliá Braco Village", area: "falmouth", locality: "Braco", zone: FALMOUTH, transfer: t(20, 40), popularity: 6, kind: "hotel", active: false, pendingReview: true },
  { key: "glistening-waters", name: "Glistening Waters Hotel & Attraction", area: "falmouth", zone: FALMOUTH, transfer: t(17.5, 35), popularity: 4, kind: "hotel", active: false, pendingReview: true },

  // ── Hanover & Green Island ───────────────────────────────────────────────
  { key: "round-hill", name: "Round Hill Hotel & Villas", area: "hanover", zone: MOBAY, transfer: t(10, 20), popularity: 8, kind: "hotel", active: true },
  { key: "tryall", name: "Tryall Club", area: "hanover", zone: MOBAY, transfer: t(12.5, 25), popularity: 7, kind: "hotel", active: true },
  { key: "grand-palladium", name: "Grand Palladium Jamaica", area: "hanover", locality: "Lucea", zone: PALLADIUM, transfer: t(15, 30), popularity: 7, kind: "hotel", active: true },
  { key: "lady-hamilton", name: "Grand Palladium Lady Hamilton", area: "hanover", locality: "Lucea", zone: PALLADIUM, transfer: t(15, 30), popularity: 6, kind: "hotel", active: true },
  { key: "princess-jamaica", name: "Princess Grand / Senses Jamaica", area: "hanover", locality: "Green Island", zone: PALLADIUM, transfer: t(25, 50), aliases: ["Princess Resort"], popularity: 6, kind: "hotel", active: true },

  // ── Ocho Rios & St. Ann ──────────────────────────────────────────────────
  { key: "riu-ocho-rios", name: "Riu Ocho Rios", area: "ocho-rios", zone: OCHO, transfer: t(25, 50), popularity: 5, kind: "hotel", active: true },
  { key: "sandals-dunns-river", name: "Sandals Dunns River", area: "ocho-rios", zone: OCHO, transfer: t(25, 50), popularity: 8, kind: "hotel", active: true },
  { key: "moon-palace", name: "Moon Palace Jamaica", area: "ocho-rios", zone: OCHO, transfer: t(25, 50), popularity: 7, kind: "hotel", active: true },
  { key: "sandals-ochi", name: "Sandals Ochi Beach Resort", area: "ocho-rios", zone: OCHO, transfer: t(25, 50), popularity: 7, kind: "hotel", active: true },
  { key: "sandals-royal-plantation", name: "Sandals Royal Plantation", area: "ocho-rios", zone: OCHO, transfer: t(25, 50), popularity: 8, kind: "hotel", active: true },
  { key: "jamaica-inn", name: "Jamaica Inn", area: "ocho-rios", zone: OCHO, transfer: t(25, 50), popularity: 7, kind: "hotel", active: true },
  { key: "couples-sans-souci", name: "Couples Sans Souci", area: "ocho-rios", zone: OCHO, transfer: t(30, 60), aliases: ["San Souci"], popularity: 7, kind: "hotel", active: true },
  { key: "couples-tower-isle", name: "Couples Tower Isle", area: "ocho-rios", zone: OCHO, transfer: t(30, 60), popularity: 6, kind: "hotel", active: true },
  { key: "goldeneye", name: "GoldenEye Resort", area: "ocho-rios", zone: OCHO, transfer: t(42.5, 85), popularity: 9, kind: "hotel", active: true },

  // New Ocho Rios / St. Ann hotels, tier-mapped for owner review.
  { key: "hibiscus-lodge", name: "Hibiscus Lodge Hotel", area: "ocho-rios", zone: OCHO, transfer: t(25, 50), popularity: 4, kind: "hotel", active: false, pendingReview: true },
  { key: "sandcastles-jamaica", name: "Sandcastles Jamaica", area: "ocho-rios", zone: OCHO, transfer: t(25, 50), popularity: 3, kind: "hotel", active: false, pendingReview: true },
  { key: "fishermans-point", name: "Fisherman's Point", area: "ocho-rios", zone: OCHO, transfer: t(25, 50), popularity: 3, kind: "hotel", active: false, pendingReview: true },
  // Runaway Bay: usable tier per 09_DECISIONS.md ($18 one way, exactly 2x round trip).
  { key: "jewel-paradise-cove", name: "Jewel Paradise Cove Beach Resort & Spa", area: "ocho-rios", locality: "Runaway Bay", zone: OCHO, transfer: t(18, 36), popularity: 6, kind: "hotel", active: false, pendingReview: true },
  { key: "cardiff-hotel-spa", name: "The Cardiff Hotel & Spa", area: "ocho-rios", locality: "Runaway Bay", zone: OCHO, transfer: t(18, 36), popularity: 4, kind: "hotel", active: false, pendingReview: true },

  // ── Negril ───────────────────────────────────────────────────────────────
  { key: "negril-beach", name: "Negril beach hotels (Seven Mile Beach)", area: "negril", locality: "Seven Mile Beach", zone: NEGRIL, transfer: t(25, 50), popularity: 5, kind: "area", active: true },
  { key: "negril-west-end", name: "Negril West End hotels", area: "negril", locality: "West End", zone: NEGRIL, transfer: t(30, 60), aliases: ["cliffs"], popularity: 4, kind: "area", active: true },

  // New Negril hotels, tier-mapped to the existing Seven Mile Beach / West End
  // rates for owner review.
  { key: "sandals-negril", name: "Sandals Negril", area: "negril", locality: "Seven Mile Beach", zone: NEGRIL, transfer: t(25, 50), popularity: 9, kind: "hotel", active: false, pendingReview: true },
  { key: "beaches-negril", name: "Beaches Negril", area: "negril", locality: "Seven Mile Beach", zone: NEGRIL, transfer: t(25, 50), popularity: 8, kind: "hotel", active: false, pendingReview: true },
  { key: "couples-negril", name: "Couples Negril", area: "negril", locality: "Seven Mile Beach", zone: NEGRIL, transfer: t(25, 50), popularity: 7, kind: "hotel", active: false, pendingReview: true },
  { key: "couples-swept-away", name: "Couples Swept Away", area: "negril", locality: "Seven Mile Beach", zone: NEGRIL, transfer: t(25, 50), popularity: 6, kind: "hotel", active: false, pendingReview: true },
  { key: "royalton-negril", name: "Royalton Negril", area: "negril", locality: "Seven Mile Beach", zone: NEGRIL, transfer: t(25, 50), popularity: 7, kind: "hotel", active: false, pendingReview: true },
  { key: "azul-beach-negril", name: "Azul Beach Resort Negril", area: "negril", locality: "Seven Mile Beach", zone: NEGRIL, transfer: t(25, 50), popularity: 5, kind: "hotel", active: false, pendingReview: true },
  { key: "hedonism-ii", name: "Hedonism II", area: "negril", locality: "Seven Mile Beach", zone: NEGRIL, transfer: t(25, 50), popularity: 7, kind: "hotel", active: false, pendingReview: true },
  { key: "grand-lido-negril", name: "Grand Lido Negril", area: "negril", locality: "Seven Mile Beach", zone: NEGRIL, transfer: t(25, 50), popularity: 5, kind: "hotel", active: false, pendingReview: true },
  { key: "riu-palace-tropical-bay", name: "Riu Palace Tropical Bay", area: "negril", locality: "Seven Mile Beach", zone: NEGRIL, transfer: t(25, 50), popularity: 6, kind: "hotel", active: false, pendingReview: true },
  { key: "coco-la-palm", name: "Coco La Palm Seaside Resort", area: "negril", locality: "Seven Mile Beach", zone: NEGRIL, transfer: t(25, 50), popularity: 4, kind: "hotel", active: false, pendingReview: true },
  { key: "firefly-beach-cottages", name: "Firefly Beach Cottages", area: "negril", locality: "Seven Mile Beach", zone: NEGRIL, transfer: t(25, 50), popularity: 3, kind: "hotel", active: false, pendingReview: true },
  { key: "white-sands-negril", name: "White Sands Negril", area: "negril", locality: "Seven Mile Beach", zone: NEGRIL, transfer: t(25, 50), popularity: 4, kind: "hotel", active: false, pendingReview: true },
  { key: "charela-inn", name: "Charela Inn", area: "negril", locality: "Seven Mile Beach", zone: NEGRIL, transfer: t(25, 50), popularity: 3, kind: "hotel", active: false, pendingReview: true },
  { key: "travellers-beach-resort", name: "Travellers Beach Resort", area: "negril", locality: "Seven Mile Beach", zone: NEGRIL, transfer: t(25, 50), popularity: 3, kind: "hotel", active: false, pendingReview: true },
  { key: "negril-palms", name: "Negril Palms Hotel", area: "negril", locality: "Seven Mile Beach", zone: NEGRIL, transfer: t(25, 50), popularity: 3, kind: "hotel", active: false, pendingReview: true },
  { key: "idle-awhile", name: "Idle Awhile Beach", area: "negril", locality: "Seven Mile Beach", zone: NEGRIL, transfer: t(25, 50), popularity: 4, kind: "hotel", active: false, pendingReview: true },
  { key: "rondel-village", name: "Rondel Village Resort & Spa", area: "negril", locality: "Seven Mile Beach", zone: NEGRIL, transfer: t(25, 50), popularity: 3, kind: "hotel", active: false, pendingReview: true },
  { key: "rockhouse", name: "Rockhouse Hotel", area: "negril", locality: "West End", zone: NEGRIL, transfer: t(30, 60), aliases: ["cliffs"], popularity: 8, kind: "hotel", active: false, pendingReview: true },
  { key: "tensing-pen", name: "Tensing Pen", area: "negril", locality: "West End", zone: NEGRIL, transfer: t(30, 60), aliases: ["cliffs"], popularity: 6, kind: "hotel", active: false, pendingReview: true },
  { key: "catcha-falling-star", name: "Catcha Falling Star", area: "negril", locality: "West End", zone: NEGRIL, transfer: t(30, 60), aliases: ["cliffs"], popularity: 5, kind: "hotel", active: false, pendingReview: true },
  { key: "xtabi-resort", name: "Xtabi Resort", area: "negril", locality: "West End", zone: NEGRIL, transfer: t(30, 60), aliases: ["cliffs"], popularity: 4, kind: "hotel", active: false, pendingReview: true },

  // ── South Coast ──────────────────────────────────────────────────────────
  { key: "sandals-south-coast", name: "Sandals South Coast", area: "south-coast", locality: "Whitehouse", zone: SOUTH, transfer: t(30, 60), aliases: ["Whitehouse"], popularity: 8, kind: "hotel", active: true },

  // New South Coast hotels, tier-mapped to the Whitehouse rate for owner
  // review — Braco and Treasure Beach/Kingston/Port Antonio one-way prices
  // are still unconfirmed ranges per 09_DECISIONS.md, so these carry the
  // nearest current published rate rather than a guess, pending Mr. Pugh's
  // sign-off.
  { key: "south-coast-all-inclusive", name: "South Coast All Inclusive", area: "south-coast", locality: "Whitehouse", zone: SOUTH, transfer: t(30, 60), popularity: 4, kind: "hotel", active: false, pendingReview: true },
  { key: "bluefields-on-the-bay", name: "Bluefields on the Bay", area: "south-coast", locality: "Whitehouse", zone: SOUTH, transfer: t(30, 60), popularity: 3, kind: "hotel", active: false, pendingReview: true },
  { key: "jakes-hotel", name: "Jake's Hotel", area: "south-coast", locality: "Treasure Beach", zone: SOUTH, transfer: t(30, 60), popularity: 5, kind: "hotel", active: false, pendingReview: true },
  { key: "idlers-rest", name: "Idlers' Rest Beach Hotel", area: "south-coast", locality: "Black River", zone: SOUTH, transfer: t(30, 60), popularity: 3, kind: "hotel", active: false, pendingReview: true },

  // ── Cruise piers ─────────────────────────────────────────────────────────
  { key: "mobay-cruise-pier", name: "Montego Bay Cruise Terminal", area: "piers", zone: "mobay-pier", transfer: null, aliases: ["cruise ship", "pier"], popularity: 5, kind: "pier", active: true },
  { key: "falmouth-cruise-pier", name: "Historic Falmouth Cruise Port", area: "piers", zone: "falmouth-pier", transfer: null, aliases: ["cruise ship", "pier"], popularity: 4, kind: "pier", active: true },
];

export function getPlace(key) {
  return PLACES.find((p) => p.key === key) ?? null;
}

export function getAreaLabel(key) {
  return AREAS.find((a) => a.key === key)?.label ?? key;
}

/** Every place a guest can actually search and book against. */
export function activePlaces() {
  return PLACES.filter((p) => p.active !== false);
}

/**
 * Places grouped for a picker, in AREAS order, empty groups dropped.
 *
 * `filter` narrows the list before grouping. The airport pickers pass
 * `(p) => p.transfer`, because the two cruise piers have no fare and offering
 * them would produce a resort the form cannot price. Only active places are
 * ever shown to a guest.
 */
export function placesByArea(filter) {
  const base = activePlaces();
  const list = filter ? base.filter(filter) : base;
  return AREAS.map((area) => ({
    ...area,
    places: list.filter((p) => p.area === area.key),
  })).filter((g) => g.places.length > 0);
}

/** Every place that can be an airport-transfer destination. */
export function transferPlaces() {
  return activePlaces().filter((p) => p.transfer);
}
