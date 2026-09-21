/**
 * Prices the owner has not quoted, derived from the ones he has.
 *
 * Kept out of `catalogue.js` on purpose: everything in that file came from
 * him and should stay auditable against his messages. Everything in this one
 * is ours.
 *
 * These are no longer flagged to the guest as indicative, and no longer block
 * card payment. The charge is transport only, a derived rate is still a real
 * number in the right band, and holding a third of the resort list back from
 * paying cost far more than the precision was worth.
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
 * Every rate is a multiple of $5 — a quarter of the multiple-of-$20 base each
 * was derived as — because that is true of 118 of his own 120 figures.
 *
 * Regenerate: scratchpad/gen_estimates.mjs
 */

/** Origins he serves but has never published an excursion price from. */
export const ESTIMATED_ZONES = [
  { key: "ocho-rios-hotels", label: "Ocho Rios & St. Ann hotels", short: "Ocho Rios" },
  { key: "negril-hotels", label: "Negril hotels", short: "Negril" },
  { key: "south-coast-hotels", label: "South Coast hotels", short: "South Coast" },
];

/** `{ tourId: { zoneKey: perPersonRate } }`, in the same unit as `z()`. */
export const ESTIMATED = {
  "blue-hole": {
    "ocho-rios-hotels": 20,
    "negril-hotels": 85,
    "south-coast-hotels": 90,
  },
  "dunns-river-falls": {
    "ocho-rios-hotels": 20,
    "negril-hotels": 75,
    "south-coast-hotels": 80,
  },
  "mystic-mountain": {
    "ocho-rios-hotels": 20,
    "negril-hotels": 75,
    "south-coast-hotels": 80,
  },
  "dolphin-cove-ocho-rios": {
    "ocho-rios-hotels": 20,
    "negril-hotels": 75,
    "south-coast-hotels": 80,
  },
  "bob-marley-nine-mile": {
    "ocho-rios-hotels": 20,
    "negril-hotels": 85,
    "south-coast-hotels": 90,
  },
  "dolphin-cove-montego-bay": {
    "palladium": 25,
    "ocho-rios-hotels": 45,
    "negril-hotels": 45,
    "south-coast-hotels": 50,
  },
  "rose-hall-great-house": {
    "ocho-rios-hotels": 45,
    "negril-hotels": 45,
    "south-coast-hotels": 50,
  },
  "montego-bay-highlights": {
    "ocho-rios-hotels": 55,
    "negril-hotels": 55,
    "south-coast-hotels": 65,
  },
  "sand-and-saddle": {
    "palladium": 25,
    "ocho-rios-hotels": 45,
    "negril-hotels": 45,
    "south-coast-hotels": 50,
  },
  "river-rapids-tubing": {
    "ocho-rios-hotels": 40,
    "negril-hotels": 60,
    "south-coast-hotels": 65,
  },
  "martha-brae-rafting": {
    "ocho-rios-hotels": 50,
    "negril-hotels": 75,
    "south-coast-hotels": 80,
  },
  "luminous-lagoon": {
    "mobay-pier": 30,
    "falmouth-pier": 25,
    "ocho-rios-hotels": 40,
    "negril-hotels": 60,
    "south-coast-hotels": 65,
  },
  "negril-seven-mile-beach": {
    "falmouth-pier": 65,
    "ocho-rios-hotels": 75,
    "negril-hotels": 20,
    "south-coast-hotels": 40,
  },
  "ricks-cafe": {
    "falmouth-pier": 65,
    "ocho-rios-hotels": 75,
    "negril-hotels": 20,
    "south-coast-hotels": 40,
  },
  "ys-falls": {
    "falmouth-pier": 80,
    "ocho-rios-hotels": 80,
    "negril-hotels": 50,
    "south-coast-hotels": 25,
  },
  "black-river-safari": {
    "falmouth-pier": 80,
    "ocho-rios-hotels": 80,
    "negril-hotels": 50,
    "south-coast-hotels": 25,
  },
  "appleton-estate": {
    "falmouth-pier": 85,
    "ocho-rios-hotels": 95,
    "negril-hotels": 60,
    "south-coast-hotels": 30,
  },
  "combo-blue-hole-dunns-river": {
    "mobay-hotels": 65,
    "falmouth-hotels": 60,
    "falmouth-pier": 65,
    "palladium": 85,
    "ocho-rios-hotels": 25,
    "negril-hotels": 110,
    "south-coast-hotels": 115,
  },
  "combo-ys-falls-black-river": {
    "mobay-hotels": 60,
    "falmouth-hotels": 90,
    "falmouth-pier": 100,
    "ocho-rios-hotels": 100,
    "negril-hotels": 60,
    "south-coast-hotels": 30,
  },
  "combo-appleton-ys-falls": {
    "mobay-hotels": 75,
    "falmouth-hotels": 105,
    "falmouth-pier": 110,
    "palladium": 90,
    "ocho-rios-hotels": 120,
    "negril-hotels": 75,
    "south-coast-hotels": 40,
  },
  "combo-negril-beach-ricks-cafe": {
    "mobay-hotels": 50,
    "falmouth-hotels": 65,
    "falmouth-pier": 70,
    "palladium": 40,
    "ocho-rios-hotels": 85,
    "negril-hotels": 20,
    "south-coast-hotels": 45,
  },
  "combo-sand-saddle-river-rapids": {
    "mobay-hotels": 25,
    "falmouth-hotels": 25,
    "falmouth-pier": 40,
    "ocho-rios-hotels": 60,
    "negril-hotels": 75,
    "south-coast-hotels": 80,
  },
  "combo-martha-brae-doctors-cave": {
    "mobay-hotels": 45,
    "falmouth-hotels": 50,
    "falmouth-pier": 50,
    "palladium": 65,
    "ocho-rios-hotels": 95,
    "negril-hotels": 120,
    "south-coast-hotels": 130,
  },
  "combo-dunns-river-mystic-mountain": {
    "mobay-hotels": 50,
    "mobay-pier": 50,
    "falmouth-hotels": 45,
    "falmouth-pier": 45,
    "palladium": 65,
    "ocho-rios-hotels": 20,
    "negril-hotels": 85,
    "south-coast-hotels": 90,
  },
};
