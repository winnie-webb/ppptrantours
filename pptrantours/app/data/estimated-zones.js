/**
 * Prices the owner has not quoted, derived from the ones he has.
 *
 * Kept out of `catalogue.js` on purpose: everything in that file came from
 * him and should stay auditable against his messages. Everything in this one
 * is ours, is marked `est: true` where it is merged, and is labelled in the
 * UI as indicative rather than published.
 *
 * How each number was reached:
 *
 * 1. **Gaps in the five zones he priced.** His own matrix gives a stable ratio
 *    between zones once you group by where the attraction is — a Falmouth
 *    guest pays 0.89x a MoBay guest for Ocho Rios but 1.33x for Negril. The
 *    missing cell is the tour's Montego Bay price times that ratio.
 *
 * 2. **Falmouth cruise pier.** He never priced Negril or the South Coast from
 *    it, and there is no ratio to borrow, so those use the flat $20
 *    premium the pier carries over the Falmouth hotels everywhere else. A
 *    multiplier would have turned a three-hour drive into a fantasy.
 *
 * 3. **Combos.** A second stop adds a fraction of the cheaper leg — 0.11 where
 *    the two are minutes apart, 0.80 where the day doubles back. Each combo
 *    uses the factor from the zone he did price; the one combo he has never
 *    priced at all (Dunn's River & Mystic Mountain) uses the smallest observed
 *    factor, because those two are the closest pair on the island.
 *
 * 4. **Ocho Rios, Negril and South Coast origins.** He runs from these resorts
 *    but has published nothing from them, so there is no figure to interpolate.
 *    These come from what his data says each leg between two areas is worth,
 *    read symmetrically: MoBay to Ocho Rios is $180, so Ocho Rios to MoBay is
 *    about the same. **These are the softest numbers here** — confirm them
 *    before quoting a guest.
 *
 * Every base is a multiple of $20 and every `extra` is a quarter of it,
 * because that is true of 118 of his own 120 figures.
 *
 * Regenerate: scratchpad/gen_estimates.mjs
 */

/** Origins he serves but has never published an excursion price from. */
export const ESTIMATED_ZONES = [
  { key: "ocho-rios-hotels", label: "Ocho Rios & St. Ann hotels", short: "Ocho Rios" },
  { key: "negril-hotels", label: "Negril hotels", short: "Negril" },
  { key: "south-coast-hotels", label: "South Coast hotels", short: "South Coast" },
];

/** `{ tourId: { zoneKey: basePrice } }` — `extra` is derived, never stored. */
export const ESTIMATED = {
  "blue-hole": {
    "ocho-rios-hotels": 80,
    "negril-hotels": 340,
    "south-coast-hotels": 360,
  },
  "dunns-river-falls": {
    "ocho-rios-hotels": 80,
    "negril-hotels": 300,
    "south-coast-hotels": 320,
  },
  "mystic-mountain": {
    "ocho-rios-hotels": 80,
    "negril-hotels": 300,
    "south-coast-hotels": 320,
  },
  "dolphin-cove-ocho-rios": {
    "ocho-rios-hotels": 80,
    "negril-hotels": 300,
    "south-coast-hotels": 320,
  },
  "bob-marley-nine-mile": {
    "ocho-rios-hotels": 80,
    "negril-hotels": 340,
    "south-coast-hotels": 360,
  },
  "dolphin-cove-montego-bay": {
    "palladium": 100,
    "ocho-rios-hotels": 180,
    "negril-hotels": 180,
    "south-coast-hotels": 200,
  },
  "rose-hall-great-house": {
    "ocho-rios-hotels": 180,
    "negril-hotels": 180,
    "south-coast-hotels": 200,
  },
  "montego-bay-highlights": {
    "ocho-rios-hotels": 220,
    "negril-hotels": 220,
    "south-coast-hotels": 260,
  },
  "sand-and-saddle": {
    "palladium": 100,
    "ocho-rios-hotels": 180,
    "negril-hotels": 180,
    "south-coast-hotels": 200,
  },
  "river-rapids-tubing": {
    "ocho-rios-hotels": 160,
    "negril-hotels": 240,
    "south-coast-hotels": 260,
  },
  "martha-brae-rafting": {
    "ocho-rios-hotels": 200,
    "negril-hotels": 300,
    "south-coast-hotels": 320,
  },
  "luminous-lagoon": {
    "mobay-pier": 120,
    "falmouth-pier": 100,
    "ocho-rios-hotels": 160,
    "negril-hotels": 240,
    "south-coast-hotels": 260,
  },
  "negril-seven-mile-beach": {
    "falmouth-pier": 260,
    "ocho-rios-hotels": 300,
    "negril-hotels": 80,
    "south-coast-hotels": 160,
  },
  "ricks-cafe": {
    "falmouth-pier": 260,
    "ocho-rios-hotels": 300,
    "negril-hotels": 80,
    "south-coast-hotels": 160,
  },
  "ys-falls": {
    "falmouth-pier": 320,
    "ocho-rios-hotels": 320,
    "negril-hotels": 200,
    "south-coast-hotels": 100,
  },
  "black-river-safari": {
    "falmouth-pier": 320,
    "ocho-rios-hotels": 320,
    "negril-hotels": 200,
    "south-coast-hotels": 100,
  },
  "appleton-estate": {
    "falmouth-pier": 340,
    "ocho-rios-hotels": 380,
    "negril-hotels": 240,
    "south-coast-hotels": 120,
  },
  "combo-blue-hole-dunns-river": {
    "mobay-hotels": 260,
    "falmouth-hotels": 240,
    "falmouth-pier": 260,
    "palladium": 340,
    "ocho-rios-hotels": 100,
    "negril-hotels": 440,
    "south-coast-hotels": 460,
  },
  "combo-ys-falls-black-river": {
    "mobay-hotels": 240,
    "falmouth-hotels": 360,
    "falmouth-pier": 400,
    "ocho-rios-hotels": 400,
    "negril-hotels": 240,
    "south-coast-hotels": 120,
  },
  "combo-appleton-ys-falls": {
    "mobay-hotels": 300,
    "falmouth-hotels": 420,
    "falmouth-pier": 440,
    "palladium": 360,
    "ocho-rios-hotels": 480,
    "negril-hotels": 300,
    "south-coast-hotels": 160,
  },
  "combo-negril-beach-ricks-cafe": {
    "mobay-hotels": 200,
    "falmouth-hotels": 260,
    "falmouth-pier": 280,
    "palladium": 160,
    "ocho-rios-hotels": 340,
    "negril-hotels": 80,
    "south-coast-hotels": 180,
  },
  "combo-sand-saddle-river-rapids": {
    "mobay-hotels": 100,
    "falmouth-hotels": 100,
    "falmouth-pier": 160,
    "ocho-rios-hotels": 240,
    "negril-hotels": 300,
    "south-coast-hotels": 320,
  },
  "combo-martha-brae-doctors-cave": {
    "mobay-hotels": 180,
    "falmouth-hotels": 200,
    "falmouth-pier": 200,
    "palladium": 260,
    "ocho-rios-hotels": 380,
    "negril-hotels": 480,
    "south-coast-hotels": 520,
  },
  "combo-dunns-river-mystic-mountain": {
    "mobay-hotels": 200,
    "mobay-pier": 200,
    "falmouth-hotels": 180,
    "falmouth-pier": 180,
    "palladium": 260,
    "ocho-rios-hotels": 80,
    "negril-hotels": 340,
    "south-coast-hotels": 360,
  },
};
