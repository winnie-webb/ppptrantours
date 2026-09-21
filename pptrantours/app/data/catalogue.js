/**
 * The catalogue, exactly as the owner priced it.
 *
 * Two things about this data drive the whole pricing UI, and both differ from
 * how the site used to work:
 *
 * 1. **Transport is per person, with a four-person minimum.** Every `zones`
 *    figure is a per-head rate, and a party is billed for at least four heads:
 *    `rate * max(4, pax)`. So one, two, three and four people all pay the same,
 *    and the fifth guest onward each pay the plain rate. The more people join,
 *    the less each pays — which is the offer, not a vehicle thrown in.
 *
 * 2. **Entry fees are not ours.** They are listed here so a guest can see the
 *    true cost of the day up front, but they are paid at the gate. The owner is
 *    emphatic about this: PPP never resells or marks up an attraction ticket.
 *
 * A zone missing from a tour's `zones` map is not an oversight — it means the
 * owner published no price for that run, and the site asks instead of guessing.
 */

import { ESTIMATED } from "./estimated-zones.js";

/**
 * A transport rate, per person.
 *
 * One number, deliberately. This used to be `z(price, extra)` — a four-person
 * base AND a per-head rate — with nothing enforcing that the second was a
 * quarter of the first. Fifteen rows had drifted out of step, so a party of
 * five was charged an extra head at a figure that did not match the fare the
 * other four had paid. With a single rate that row is unrepresentable.
 */
const z = (rate) => ({ rate });

/** Nobody is billed for fewer heads than this, however few actually travel. */
export const MIN_BILLED_PAX = 4;

/* ── Entry-fee components ────────────────────────────────────────────────────
 * Shared where two tours charge the same gate, so a price change is one edit.
 *
 *   kind "person"  adult/child rate per head
 *   kind "choice"  guest picks one package (Mystic Mountain, Dolphin Cove)
 *   kind "unit"    priced by the thing, not the head (a Martha Brae raft)
 */

const ENTRY_BLUE_HOLE = {
  kind: "person",
  label: "Blue Hole entry",
  adult: 25,
  child: 15,
  childNote: "under 12",
};

const ENTRY_DUNNS = {
  kind: "person",
  label: "Dunn's River Falls entry",
  adult: 25,
  child: 15,
};

const ENTRY_YS = {
  kind: "person",
  label: "YS Falls entry",
  adult: 25,
  child: 16,
  childNote: "ages 3-15",
};

const ENTRY_BLACK_RIVER = {
  kind: "person",
  label: "Black River Safari entry",
  adult: 30,
  child: 15,
  childNote: "ages 3-11",
};

const ENTRY_APPLETON = {
  kind: "person",
  label: "Appleton Estate entry",
  adult: 39,
  child: 19.5,
  childNote: "17 and under",
};

const ENTRY_DOCTORS_CAVE = {
  kind: "person",
  label: "Doctor's Cave Beach entry",
  adult: 8,
  child: 4,
  childNote: "under 12",
};

const ENTRY_MARTHA_BRAE = {
  kind: "unit",
  label: "Martha Brae raft",
  price: 110,
  per: 2,
  unit: "raft",
  note: "Each raft holds two adults, plus one small child under 12.",
};

const ENTRY_HORSEBACK = {
  kind: "person",
  label: "Horseback ride and swim",
  adult: 100,
  child: 100,
};

const ENTRY_TUBING = {
  kind: "person",
  label: "River tubing",
  adult: 80,
  child: 80,
};

const QUOTED = [
  // ══ Ocho Rios & St. Ann ═══════════════════════════════════════════════════
  {
    id: "blue-hole",
    title: "Blue Hole",
    subtitle: "Irie Blue Hole, St. Ann",
    kind: "excursion",
    region: "ocho-rios",
    popular: true,
    duration: "Full day",
    image: "/abc/abc-6.webp",
    desc: "A chain of turquoise limestone pools hidden up the White River valley, with rope swings, cliff jumps and ledges to climb behind the falls. It is the wilder, less polished cousin of Dunn's River, and the one guests come back talking about.",
    highlights: [
      "Jump, swing or climb down — your choice",
      "Local guides who know every safe ledge",
      "Far smaller crowds than Dunn's River",
      "Bring water shoes and a dry bag",
    ],
    zones: {
      "mobay-hotels": z(50),
      "mobay-pier": z(50),
      "falmouth-hotels": z(45),
      "falmouth-pier": z(50),
      palladium: z(65),
    },
    entry: { components: [ENTRY_BLUE_HOLE] },
  },
  {
    id: "dunns-river-falls",
    title: "Dunn's River Falls",
    subtitle: "Ocho Rios, St. Ann",
    kind: "excursion",
    region: "ocho-rios",
    popular: true,
    duration: "Full day",
    image: "/mpt/mpt-11.webp",
    desc: "Six hundred feet of terraced waterfall running straight into the Caribbean, and the one climb everybody knows Jamaica for. Link hands with the chain and walk up it, or take the stairs alongside and meet them at the top.",
    highlights: [
      "Climb the falls hand-in-hand with the chain",
      "Beach at the foot of the falls",
      "Stairs and viewing decks if you would rather watch",
      "Lockers and changing rooms on site",
    ],
    zones: {
      "mobay-hotels": z(45),
      "mobay-pier": z(45),
      "falmouth-hotels": z(40),
      "falmouth-pier": z(40),
      palladium: z(60),
    },
    entry: { components: [ENTRY_DUNNS] },
  },
  {
    id: "mystic-mountain",
    title: "Mystic Mountain",
    subtitle: "Rainforest Adventures, Ocho Rios",
    kind: "excursion",
    region: "ocho-rios",
    popular: true,
    duration: "Full day",
    image: "/ppp/mystic-mountain.jpg",
    desc: "A chairlift through the rainforest canopy to a ridge above Ocho Rios harbour, then a bobsled run back down through the trees. Pick one activity or bundle two or three — the park prices them together and the savings are real.",
    highlights: [
      "Sky Explorer chairlift over the canopy",
      "Jamaica Bobsled, brake-controlled by you",
      "Ziplines and the Raggamuffin course",
      "Infinity pool and waterslide at the summit",
    ],
    zones: {
      "mobay-hotels": z(45),
      "mobay-pier": z(45),
      "falmouth-hotels": z(40),
      "falmouth-pier": z(40),
      palladium: z(60),
    },
    entry: {
      note: "Pick your package at the gate. Bundles are cheaper than single activities.",
      components: [
        {
          kind: "choice",
          key: "mystic",
          label: "Mystic Mountain package",
          options: [
            { key: "chairlift", label: "Chairlift only", adult: 59, child: 59 },
            { key: "bobsled", label: "Bobsled", adult: 102, child: 82, childNote: "ages 5-9" },
            { key: "zipline", label: "Zipline", adult: 102, child: 82, childNote: "ages 5-9" },
            { key: "raggamuffin", label: "Raggamuffin course", adult: 102, child: 82, childNote: "ages 5-9" },
            { key: "any-2", label: "Any 2 activities", adult: 159, child: 139 },
            { key: "all-3", label: "All 3 activities", adult: 179, child: 150 },
          ],
        },
      ],
    },
  },
  {
    id: "dolphin-cove-ocho-rios",
    title: "Dolphin Cove Ocho Rios",
    subtitle: "St. Ann",
    kind: "excursion",
    region: "ocho-rios",
    popular: true,
    duration: "Full day",
    image: "/ctp/ctp-19.webp",
    desc: "A natural cove where the dolphin programmes run from a shallow beach rather than a concrete tank. Admission alone covers kayaks, the jungle trail, the waterslide, the pool, the beach and a Jamaican lunch; the swims are booked on top.",
    highlights: [
      "Kayaks, jungle trail, waterslide and beach included",
      "Jamaican lunch with Admission Plus",
      "Dolphin, shark and stingray encounters",
      "Non-swimmers can watch from the deck",
    ],
    zones: {
      "mobay-hotels": z(45),
      "mobay-pier": z(45),
      "falmouth-hotels": z(40),
      "falmouth-pier": z(40),
      palladium: z(60),
    },
    entry: {
      note: "Programme prices start from these figures and rise with season and availability. Toddlers 0-3 are free with a paying adult.",
      components: [
        {
          kind: "choice",
          key: "programme",
          label: "Dolphin Cove programme",
          options: [
            { key: "admission-plus", label: "Admission Plus", adult: 75, child: 49, from: true },
            { key: "shark", label: "Shark Encounter", adult: 69, child: 69, from: true },
            { key: "encounter", label: "Dolphin Encounter", adult: 119, child: 119, from: true },
            { key: "swim", label: "Dolphin Swim Adventure", adult: 149, child: 149, from: true },
            { key: "royal", label: "Dolphin Royal Swim", adult: 189, child: 189, from: true },
            { key: "companion", label: "Non-participating companion", adult: 49, child: 45 },
          ],
        },
      ],
    },
  },
  {
    id: "bob-marley-nine-mile",
    title: "Bob Marley Nine Mile",
    subtitle: "St. Ann",
    kind: "excursion",
    region: "ocho-rios",
    popular: true,
    duration: "Full day",
    image: "/ppp/nine-mile-small.jpg",
    desc: "The village Bob Marley was born in, high in the St. Ann hills, where he is buried in the mausoleum beside the house he grew up in. Rasta guides walk you through it, and the drive up through the interior is half the trip.",
    highlights: [
      "The house Bob Marley was born in",
      "Mausoleum and Mount Zion Rock",
      "Guided by the family's own community",
      "Mountain scenery most visitors never see",
    ],
    zones: {
      "mobay-hotels": z(50),
      "mobay-pier": z(50),
      "falmouth-hotels": z(45),
      "falmouth-pier": z(50),
      palladium: z(65),
    },
    entry: {
      components: [
        {
          kind: "person",
          label: "Nine Mile entry",
          adult: 35,
          child: 15,
          childNote: "ages 6-11, under 5 free",
        },
      ],
    },
  },

  // ══ Montego Bay & St. James ═══════════════════════════════════════════════
  {
    id: "dolphin-cove-montego-bay",
    title: "Dolphin Cove Montego Bay",
    subtitle: "St. James",
    kind: "excursion",
    region: "montego-bay",
    duration: "Half day",
    image: "/mpt/mpt-7.webp",
    desc: "The same dolphin programmes as Ocho Rios, twenty minutes from most Montego Bay hotels instead of two hours. The cheapest way to get a dolphin swim into a half day and still have the afternoon at the beach.",
    highlights: [
      "Twenty minutes from most MoBay resorts",
      "Encounter, Swim Adventure and Royal Swim",
      "General admission for non-swimmers",
      "Infants free, kids priced from 3.3 ft tall",
    ],
    zones: {
      "mobay-hotels": z(20),
      "mobay-pier": z(20),
      "falmouth-hotels": z(35),
      "falmouth-pier": z(45),
    },
    entry: {
      note: "Programme prices start from these figures. Infants are free; children are priced once they are taller than 3.3 ft.",
      components: [
        {
          kind: "choice",
          key: "programme",
          label: "Dolphin Cove programme",
          options: [
            { key: "admission", label: "General Admission / Admission Plus", adult: 39, child: 29, from: true },
            { key: "encounter", label: "Dolphin Encounter", adult: 119, child: 119, from: true },
            { key: "swim", label: "Dolphin Swim Adventure", adult: 149, child: 149, from: true },
            { key: "royal", label: "Dolphin Royal Swim", adult: 189, child: 189, from: true },
          ],
        },
      ],
    },
  },
  {
    id: "rose-hall-great-house",
    title: "Rose Hall Great House",
    subtitle: "Montego Bay, St. James",
    kind: "excursion",
    region: "montego-bay",
    duration: "Half day",
    image: "/mpt/mpt-3.webp",
    desc: "The most famous great house in Jamaica, and the story of Annie Palmer, the White Witch said to have murdered three husbands in it. Take it by daylight with the gardens, or come back after dark for the candlelit haunted tour.",
    highlights: [
      "Georgian great house, restored and furnished",
      "The Annie Palmer legend, told properly",
      "Gardens and hilltop views over the coast",
      "Haunted night tour by candlelight",
    ],
    zones: {
      "mobay-hotels": z(20),
      "mobay-pier": z(20),
      "falmouth-hotels": z(20),
      "falmouth-pier": z(30),
      palladium: z(25),
    },
    entry: {
      note: "Children 2 and under are free on both tours. From the cruise piers the owner quotes the Day and Garden tour.",
      components: [
        {
          kind: "choice",
          key: "rosehall",
          label: "Rose Hall tour",
          options: [
            { key: "day", label: "Day and Garden Tour", adult: 30, child: 12, childNote: "12 and under" },
            { key: "night", label: "Haunted Night Tour", adult: 35, child: 15, childNote: "12 and under" },
          ],
        },
      ],
    },
  },
  {
    id: "montego-bay-highlights",
    title: "Montego Bay Highlights & Doctor's Cave Beach",
    subtitle: "St. James",
    kind: "excursion",
    region: "montego-bay",
    popular: true,
    duration: "Half day",
    image: "/mpt/mpt-2.webp",
    desc: "A run through the city — the Hip Strip, the craft market, Sam Sharpe Square — finishing at Doctor's Cave, the calm white-sand beach whose spring water made Montego Bay a resort town in the first place.",
    highlights: [
      "Hip Strip, craft market and Sam Sharpe Square",
      "Doctor's Cave Beach, calm and shallow",
      "Your driver waits while you swim",
      "Easiest half day for a cruise call",
    ],
    zones: {
      "mobay-hotels": z(25),
      "mobay-pier": z(25),
      "falmouth-hotels": z(35),
      "falmouth-pier": z(35),
      palladium: z(30),
    },
    entry: { components: [ENTRY_DOCTORS_CAVE] },
  },
  {
    id: "sand-and-saddle",
    title: "Sand & Saddle Horseback Ride and Swim",
    subtitle: "St. James",
    kind: "excursion",
    region: "montego-bay",
    duration: "Half day",
    image: "/abc/abc-12.webp",
    desc: "Ride the trail down to the water, then swim the horses bareback out into the sea with you still on them. No experience needed — the grooms lead every horse and the water is chest-deep.",
    highlights: [
      "Trail ride down to the beach",
      "Bareback swim with the horses",
      "Beginners and children welcome",
      "Grooms lead throughout",
    ],
    zones: {
      "mobay-hotels": z(20),
      "mobay-pier": z(35),
      "falmouth-hotels": z(20),
      "falmouth-pier": z(30),
    },
    entry: { components: [ENTRY_HORSEBACK] },
  },

  // ══ Falmouth & Trelawny ═══════════════════════════════════════════════════
  {
    id: "river-rapids-tubing",
    title: "River Rapids Tubing",
    subtitle: "Trelawny",
    kind: "excursion",
    region: "falmouth",
    duration: "Half day",
    image: "/abc/abc-16.webp",
    desc: "Drift the Great River on an inner tube through easy rapids and long quiet stretches, under old stone bridges and overhanging bamboo. Guides float alongside the whole way and steer you off the rocks.",
    highlights: [
      "Gentle rapids, no experience needed",
      "Guides in the water with you",
      "Bamboo, stone bridges and kingfishers",
      "Changing rooms and a bar at the exit",
    ],
    zones: {
      "mobay-hotels": z(20),
      "mobay-pier": z(35),
      "falmouth-hotels": z(20),
      "falmouth-pier": z(30),
      palladium: z(35),
    },
    entry: { components: [ENTRY_TUBING] },
  },
  {
    id: "martha-brae-rafting",
    title: "Martha Brae Bamboo Rafting",
    subtitle: "Trelawny",
    kind: "excursion",
    region: "falmouth",
    popular: true,
    duration: "Half day",
    image: "/ctp/ctp-22.webp",
    desc: "An hour and a half poled down the Martha Brae on a thirty-foot bamboo raft, two to a bench, with a raft captain who has worked this river for years and will tell you about every bend of it.",
    highlights: [
      "Ninety minutes on the water",
      "Two adults per raft, on a raised bench",
      "Raft captain poles and guides",
      "Riverside bar and craft stalls at the landing",
    ],
    zones: {
      "mobay-hotels": z(25),
      "mobay-pier": z(30),
      "falmouth-hotels": z(20),
      "falmouth-pier": z(20),
      palladium: z(40),
    },
    entry: { components: [ENTRY_MARTHA_BRAE] },
  },
  {
    id: "luminous-lagoon",
    title: "Luminous Lagoon",
    subtitle: "Glistening Waters, Falmouth",
    kind: "excursion",
    region: "falmouth",
    duration: "Evening",
    image: "/abc/abc-18.webp",
    desc: "One of a handful of bioluminescent bays left in the world. After dark the boat runs out into the lagoon and everything that moves through the water glows — the wake, the oars, and you, if you get in.",
    highlights: [
      "After-dark boat run into the lagoon",
      "Swim in water that lights up around you",
      "One of very few such bays anywhere",
      "Restaurant and bar at the dock",
    ],
    zones: {
      "mobay-hotels": z(20),
      "falmouth-hotels": z(15),
      palladium: z(40),
    },
    entry: {
      components: [
        { kind: "person", label: "Luminous Lagoon boat", adult: 30, child: 15 },
      ],
    },
  },

  // ══ Negril & Westmoreland ═════════════════════════════════════════════════
  {
    id: "negril-seven-mile-beach",
    title: "Negril Seven Mile Beach",
    subtitle: "Westmoreland",
    kind: "excursion",
    region: "negril",
    popular: true,
    duration: "Full day",
    image: "/ctp/ctp-25.webp",
    desc: "Seven miles of white sand and calm, shallow, absurdly clear water, lined with beach bars that will happily feed you all afternoon. No gate and no ticket — just tell your driver what time you want collecting.",
    highlights: [
      "No entry fee, no ticket, no queue",
      "Calm shallow water the whole length",
      "Beach bars, jerk stands and loungers",
      "Your driver waits as long as you like",
    ],
    zones: {
      "mobay-hotels": z(45),
      "mobay-pier": z(45),
      "falmouth-hotels": z(60),
      palladium: z(35),
    },
    entry: { components: [] },
  },
  {
    id: "ricks-cafe",
    title: "Rick's Cafe",
    subtitle: "West End, Negril",
    kind: "excursion",
    region: "negril",
    popular: true,
    duration: "Full day",
    image: "/ppp/ricks-cafe.jpg",
    desc: "The cliff bar at the end of the island, where local divers throw themselves off the thirty-five-foot ledge and the sun goes down directly in front of you. Jump yourself if you have the nerve, or take a rum punch and watch.",
    highlights: [
      "Cliff divers from 35 feet",
      "Jump from the lower ledges yourself",
      "Sunset directly over the water",
      "Live band most evenings",
    ],
    zones: {
      "mobay-hotels": z(45),
      "mobay-pier": z(45),
      "falmouth-hotels": z(60),
      palladium: z(35),
    },
    entry: { components: [] },
  },

  // ══ South Coast ═══════════════════════════════════════════════════════════
  {
    id: "ys-falls",
    title: "YS Falls",
    subtitle: "St. Elizabeth",
    kind: "excursion",
    region: "south-coast",
    popular: true,
    duration: "Full day",
    image: "/ctp/ctp-8.webp",
    desc: "Seven tiers of cold spring water dropping through a private estate on the South Coast, with natural pools, rope swings and a jitney ride out to the falls through the cattle pasture. Greener, quieter and far less crowded than the north-coast falls.",
    highlights: [
      "Seven tiers, natural pools at each",
      "Jitney ride out through the estate",
      "Rope swing into the deep pool",
      "Zipline over the falls, if you want it",
    ],
    zones: {
      "mobay-hotels": z(50),
      "mobay-pier": z(50),
      "falmouth-hotels": z(75),
      palladium: z(60),
    },
    entry: {
      components: [ENTRY_YS],
      addons: [
        {
          kind: "person",
          key: "zipline",
          label: "Zipline at the falls",
          adult: 39,
          child: 29,
        },
      ],
    },
  },
  {
    id: "black-river-safari",
    title: "Black River Safari",
    subtitle: "St. Elizabeth",
    kind: "excursion",
    region: "south-coast",
    duration: "Full day",
    image: "/ctp/ctp-6.webp",
    desc: "A boat up Jamaica's widest river through red mangrove tunnels, looking for the American crocodiles that live in it. The captains know them by name and get you closer than you will expect.",
    highlights: [
      "Wild American crocodiles, up close",
      "Mangrove tunnels and egret roosts",
      "Covered boat, guided commentary",
      "Pairs naturally with YS Falls",
    ],
    zones: {
      "mobay-hotels": z(50),
      "mobay-pier": z(50),
      "falmouth-hotels": z(75),
      palladium: z(60),
    },
    entry: { components: [ENTRY_BLACK_RIVER] },
  },
  {
    id: "appleton-estate",
    title: "Appleton Estate Rum Tour",
    subtitle: "Nassau Valley, St. Elizabeth",
    kind: "excursion",
    region: "south-coast",
    duration: "Full day",
    image: "/ctp/ctp-5.webp",
    desc: "Two hundred and seventy years of rum-making in the Nassau Valley, from the cane field and the copper pot stills through to the barrel warehouse. The tour ends in the tasting room, which is the point.",
    highlights: [
      "Working distillery, not a museum",
      "Cane crushing, stills and barrel house",
      "Guided tasting at the end",
      "The drive through Cockpit Country",
    ],
    zones: {
      "mobay-hotels": z(60),
      "mobay-pier": z(60),
      "falmouth-hotels": z(80),
      palladium: z(70),
    },
    entry: { components: [ENTRY_APPLETON] },
  },

  // ══ Combo tour packages ═══════════════════════════════════════════════════
  {
    id: "combo-blue-hole-dunns-river",
    title: "Blue Hole & Dunn's River Falls",
    kind: "combo",
    region: "ocho-rios",
    popular: true,
    duration: "Full day",
    image: "/ctp/ctp-4.webp",
    desc: "Both of St. Ann's great waterfalls in one day. They are twenty minutes apart, so the only thing a second stop really costs is a little more driving and waiting — which is exactly what the combo price covers.",
    highlights: [
      "Two headline waterfalls, one day",
      "Twenty minutes between them",
      "Cheaper than booking the two apart",
      "Do them in either order",
    ],
    combines: ["blue-hole", "dunns-river-falls"],
    zones: { "mobay-pier": z(65) },
    entry: { components: [ENTRY_BLUE_HOLE, ENTRY_DUNNS] },
  },
  {
    id: "combo-ys-falls-black-river",
    title: "YS Falls & Black River Safari",
    kind: "combo",
    region: "south-coast",
    popular: true,
    duration: "Full day",
    image: "/ctp/ctp-9.webp",
    desc: "The classic South Coast day and PPP's best seller. The crocodile safari in the morning, lunch on the way, then the falls in the afternoon — both in St. Elizabeth, half an hour apart.",
    highlights: [
      "PPP's top-selling combination",
      "Crocodiles and waterfalls in one run",
      "Half an hour between the two",
      "Zipline at YS Falls if you want it",
    ],
    combines: ["ys-falls", "black-river-safari"],
    zones: { "mobay-pier": z(60), palladium: z(75) },
    entry: {
      components: [ENTRY_YS, ENTRY_BLACK_RIVER],
      addons: [
        {
          kind: "person",
          key: "zipline",
          label: "Zipline at YS Falls",
          adult: 39,
          child: 29,
        },
      ],
    },
  },
  {
    id: "combo-appleton-ys-falls",
    title: "Appleton Estate & YS Falls",
    kind: "combo",
    region: "south-coast",
    popular: true,
    duration: "Full day",
    image: "/ctp/ctp-2.webp",
    desc: "Rum in the morning, cold spring water in the afternoon. Appleton and YS Falls are both in St. Elizabeth and sit naturally in the same day, which is why this one sells as well as it does.",
    highlights: [
      "Working distillery and a tasting",
      "Seven tiers of cold spring water",
      "Both in the Nassau Valley area",
      "A long, unhurried South Coast day",
    ],
    combines: ["appleton-estate", "ys-falls"],
    zones: { "mobay-pier": z(75) },
    entry: { components: [ENTRY_APPLETON, ENTRY_YS] },
  },
  {
    id: "combo-negril-beach-ricks-cafe",
    title: "Seven Mile Beach & Rick's Cafe",
    kind: "combo",
    region: "negril",
    popular: true,
    duration: "Full day",
    image: "/ctp/ctp-23.webp",
    desc: "The whole of Negril in one day, and neither stop has a gate fee. Afternoon on Seven Mile Beach, then ten minutes down the coast to the West End cliffs in time for the divers and the sunset.",
    highlights: [
      "No entry fee at either stop",
      "Beach first, cliffs and sunset after",
      "Ten minutes between the two",
      "Home after dark, at your pace",
    ],
    combines: ["negril-seven-mile-beach", "ricks-cafe"],
    zones: { "mobay-pier": z(50) },
    entry: { components: [] },
  },
  {
    id: "combo-sand-saddle-river-rapids",
    title: "Horseback Ride and Swim & River Rapids Tubing",
    kind: "combo",
    region: "montego-bay",
    popular: true,
    duration: "Full day",
    image: "/ctp/ctp-21.webp",
    desc: "Swim the horses in the morning, float the river in the afternoon. Both are short, both are wet, and doing them together makes a full day out of two half days.",
    highlights: [
      "Bareback sea swim on horseback",
      "Gentle river tubing after",
      "Two half days become one full one",
      "Nothing here needs experience",
    ],
    combines: ["sand-and-saddle", "river-rapids-tubing"],
    zones: { "mobay-pier": z(45), palladium: z(45) },
    entry: {
      note: "From Grand Palladium the owner quotes these gates at $80 per horse and $80 per raft.",
      components: [ENTRY_HORSEBACK, ENTRY_TUBING],
    },
  },
  {
    id: "combo-martha-brae-doctors-cave",
    title: "Martha Brae Rafting & Doctor's Cave Beach",
    kind: "combo",
    region: "falmouth",
    duration: "Full day",
    image: "/abc/abc-9.webp",
    desc: "Ninety minutes poled down the Martha Brae, then back along the coast to Doctor's Cave for the afternoon. A gentle day with no climbing and no queuing in it.",
    highlights: [
      "Bamboo raft down the Martha Brae",
      "Afternoon on Doctor's Cave Beach",
      "Nothing strenuous in the whole day",
      "Good with small children",
    ],
    combines: ["martha-brae-rafting", "montego-bay-highlights"],
    zones: { "mobay-pier": z(50) },
    entry: { components: [ENTRY_MARTHA_BRAE, ENTRY_DOCTORS_CAVE] },
  },
  {
    id: "combo-dunns-river-mystic-mountain",
    title: "Dunn's River Falls & Mystic Mountain",
    kind: "combo",
    region: "ocho-rios",
    popular: true,
    duration: "Full day",
    image: "/ctp/ctp-19.webp",
    desc: "They are next door to each other in Ocho Rios, which makes them one of the easiest pairs on the island to run together. Climb the falls, then take the chairlift up and bobsled back down.",
    highlights: [
      "The two stops are minutes apart",
      "Climb the falls, then ride the mountain",
      "One of PPP's most-requested pairings",
      "Message us and we will price your day",
    ],
    combines: ["dunns-river-falls", "mystic-mountain"],
    // The owner lists this among his top sellers but has not published a
    // transport price for it. No zones means the UI asks rather than invents.
    zones: {},
    entry: {
      components: [
        ENTRY_DUNNS,
        {
          kind: "choice",
          key: "mystic",
          label: "Mystic Mountain package",
          options: [
            { key: "chairlift", label: "Chairlift only", adult: 59, child: 59 },
            { key: "bobsled", label: "Bobsled", adult: 102, child: 82, childNote: "ages 5-9" },
            { key: "zipline", label: "Zipline", adult: 102, child: 82, childNote: "ages 5-9" },
            { key: "raggamuffin", label: "Raggamuffin course", adult: 102, child: 82, childNote: "ages 5-9" },
            { key: "any-2", label: "Any 2 activities", adult: 159, child: 139 },
            { key: "all-3", label: "All 3 activities", adult: 179, child: 150 },
          ],
        },
      ],
    },
  },
];

/**
 * Airport transfers.
 *
 * Rates are not repeated here — each product just names the places it serves
 * and the numbers are read from `places.js`, so a resort's transfer price and
 * its excursion zone can never drift apart.
 */
export const TRANSFERS = [
  {
    id: "transfer-montego-bay",
    title: "Airport Transfers — Montego Bay Resorts",
    subtitle: "Sangster International (MBJ)",
    kind: "transfer",
    region: "montego-bay",
    duration: "Door to door",
    image: "/at/at-1.webp",
    desc: "Fifteen to forty minutes from the terminal to almost every Montego Bay resort. Your driver is inside the arrivals hall with a name board before you clear customs, and the vehicle is yours alone.",
    places: [
      "toby-resort", "royal-decameron-cornwall", "s-hotel", "deja-resort",
      "club-montego-bay", "altamont", "hotel-39", "caribic-house",
      "secrets-wild-orchid", "secrets-st-james", "breathless",
      "sandals-montego-bay", "riu-montego-bay", "riu-palace", "riu-reggae",
      "sandals-royal-caribbean", "zoetry", "half-moon", "jewel-grande",
      "iberostar-waves", "iberostar-selection", "iberostar-joia",
    ],
  },
  {
    id: "transfer-falmouth",
    title: "Airport Transfers — Falmouth & Trelawny",
    subtitle: "Sangster International (MBJ)",
    kind: "transfer",
    region: "falmouth",
    duration: "Door to door",
    image: "/at/at-2.webp",
    desc: "About an hour east along the coast road to the Trelawny resorts. Flight tracked, luggage handled, no stops unless you ask for one.",
    places: [
      "excellence-oyster-bay", "riu-aquarelle", "royalton-blue-waters",
      "ocean-eden-bay", "ocean-coral-spring", "bahia-principe", "franklyn-d",
    ],
  },
  {
    id: "transfer-hanover",
    title: "Airport Transfers — Hanover & Green Island",
    subtitle: "Sangster International (MBJ)",
    kind: "transfer",
    region: "hanover",
    duration: "Door to door",
    image: "/at/at-5.webp",
    desc: "West along the north coast to Round Hill, Tryall, Grand Palladium and the Princess resorts. A pretty drive, and a short one.",
    places: ["round-hill", "tryall", "grand-palladium", "lady-hamilton", "princess-jamaica"],
  },
  {
    id: "transfer-ocho-rios",
    title: "Airport Transfers — Ocho Rios & St. Ann",
    subtitle: "Sangster International (MBJ)",
    kind: "transfer",
    region: "ocho-rios",
    duration: "Door to door",
    image: "/at/at-6.webp",
    desc: "Two hours east to the St. Ann resorts, along the coast the whole way. Ask and your driver will stop for a jerk lunch or a photograph without charging you for it.",
    places: [
      "riu-ocho-rios", "sandals-dunns-river", "moon-palace", "sandals-ochi",
      "sandals-royal-plantation", "jamaica-inn", "couples-sans-souci",
      "couples-tower-isle", "goldeneye",
    ],
  },
  {
    id: "transfer-negril-south-coast",
    title: "Airport Transfers — Negril & the South Coast",
    subtitle: "Sangster International (MBJ)",
    kind: "transfer",
    region: "negril",
    duration: "Door to door",
    image: "/at/at-9.webp",
    desc: "An hour and a half down the west coast to Negril, or two and a half over the hills to Sandals South Coast. Both are long enough that a private, air-conditioned vehicle is worth having.",
    places: ["negril-beach", "negril-west-end", "sandals-south-coast"],
  },
];

/**
 * His quoted rates, with our derived ones filled in behind them.
 *
 * Merging here rather than editing `QUOTED` above keeps his numbers auditable
 * against the WhatsApp thread they came from. A derived band is no longer
 * marked or treated differently once merged — see the header of
 * estimated-zones.js for why.
 */
export const TOURS = QUOTED.map((tour) => {
  const derived = ESTIMATED[tour.id];
  if (!derived) return tour;

  const zones = { ...tour.zones };
  for (const [zone, rate] of Object.entries(derived)) {
    if (zones[zone]) continue; // never override a figure he gave us
    zones[zone] = { rate };
  }
  return { ...tour, zones };
});

/** Everything bookable, tours and transfers alike. */
export const CATALOGUE = [...TOURS, ...TRANSFERS];
