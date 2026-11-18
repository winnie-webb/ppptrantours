/**
 * How long the drive is, kept as simple as the owner asked for it
 * (2026-11-18): "(20 min drive)", "(90 min drive)", "(12 min drive)".
 *
 * Every number comes from `drive-times.generated.js`: each hotel, area and
 * cruise pier routed by road to the airport and to every attraction. Nothing
 * here is a regional guess — a guest at Hyatt Ziva sees the Hyatt Ziva time.
 * Regenerate with scripts/drive-times/ (see its README) when places or tours
 * are added.
 *
 *   - Sangster International (MBJ) to a hotel   → `airportDriveMinutes(place)`
 *   - a hotel or cruise pier to a tour          → `tourDriveMinutes(tour, placeKey)`
 *   - the summary lists on /faq and /transfers  → `DRIVE_TABLE`
 */

import { AIRPORT_MINUTES, SPOTS, TOUR_MINUTES } from "./drive-times.generated.js";

/** Minutes from Sangster International (MBJ) to a place, or null if unknown. */
export function airportDriveMinutes(place) {
  if (!place) return null;
  return AIRPORT_MINUTES[place.key] ?? null;
}

/** Minutes between a pickup place and a spot (an attraction's tour id). */
function spotMinutes(placeKey, spot) {
  const col = SPOTS.indexOf(spot);
  if (col < 0) return null;
  return TOUR_MINUTES[placeKey]?.[col] ?? null;
}

/**
 * Minutes from a pickup place to a tour. A combo is timed to its first stop,
 * which is where the drive actually ends before the day begins.
 */
export function tourDriveMinutes(tour, placeKey) {
  if (!tour || !placeKey || tour.kind === "transfer") return null;
  const spot = tour.combines?.[0] ?? tour.id;
  return spotMinutes(placeKey, spot);
}

/* ── Formatting ───────────────────────────────────────────────────────────── */

/**
 * "20 min drive", "90 min drive", "2 hr 30 min drive". Minutes are kept up to
 * two hours because that is how the owner writes them.
 */
export function formatDrive(minutes, labels = {}) {
  if (minutes == null) return null;
  const min = labels.min ?? "min";
  const hr = labels.hr ?? "hr";
  const drive = labels.drive ?? "drive";
  if (minutes <= 120) return `${minutes} ${min} ${drive}`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h} ${hr}${m ? ` ${m} ${min}` : ""} ${drive}`;
}

/* ── Summary lists ────────────────────────────────────────────────────────── */

/**
 * The at-a-glance lists, grouped the way the owner listed them. Each row names
 * a representative place (and, for attractions, a tour id); the minutes are
 * looked up from the routed data, so they can never drift from it.
 */
const GROUPS = [
  {
    key: "airport",
    title: "Airport to hotels",
    rows: [
      ["Montego Bay Hip Strip hotels", "s-hotel"],
      ["Rose Hall resorts", "hilton-rose-hall"],
      ["Montego Bay cruise port", "mobay-cruise-pier"],
      ["Falmouth & Trelawny resorts", "royalton-white-sands"],
      ["Grand Palladium, Lucea", "grand-palladium"],
      ["Runaway Bay", "jewel-paradise-cove"],
      ["Negril (Seven Mile Beach)", "sandals-negril"],
      ["Whitehouse, South Coast", "sandals-south-coast"],
      ["Ocho Rios", "moon-palace"],
    ],
  },
  {
    key: "hotels",
    from: "s-hotel",
    title: "Montego Bay hotels to attractions",
    rows: [
      ["Rose Hall Great House", "rose-hall-great-house"],
      ["Martha Brae rafting", "martha-brae-rafting"],
      ["Negril & Rick's Café", "ricks-cafe"],
      ["YS Falls", "ys-falls"],
      ["Dunn's River Falls", "dunns-river-falls"],
    ],
  },
  {
    key: "mobay-pier",
    from: "mobay-cruise-pier",
    title: "Montego Bay cruise port to attractions",
    rows: [
      ["Doctor's Cave Beach", "montego-bay-highlights"],
      ["Rose Hall Great House", "rose-hall-great-house"],
      ["Martha Brae rafting", "martha-brae-rafting"],
      ["Negril & Rick's Café", "ricks-cafe"],
      ["Dunn's River Falls", "dunns-river-falls"],
    ],
  },
  {
    key: "falmouth-pier",
    from: "falmouth-cruise-pier",
    title: "Falmouth cruise port to attractions",
    rows: [
      ["Martha Brae rafting", "martha-brae-rafting"],
      ["Luminous Lagoon", "luminous-lagoon"],
      ["Rose Hall Great House", "rose-hall-great-house"],
      ["Dunn's River Falls", "dunns-river-falls"],
      ["Blue Hole", "blue-hole"],
    ],
  },
];

export const DRIVE_TABLE = GROUPS.map((g) => ({
  key: g.key,
  title: g.title,
  rows: g.rows.map(([label, key]) => [
    label,
    g.from ? spotMinutes(g.from, key) : AIRPORT_MINUTES[key] ?? null,
  ]),
}));
