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
 * "45 min drive", "1 hr 25 min drive", "2 hr drive" — hours and minutes once
 * the drive reaches an hour (owner, 2026-11-18).
 */
export function formatDrive(minutes, labels = {}) {
  if (minutes == null) return null;
  const min = labels.min ?? "min";
  const hr = labels.hr ?? "hr";
  const drive = labels.drive ?? "drive";
  if (minutes < 60) return `${minutes} ${min} ${drive}`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h} ${hr}${m ? ` ${m} ${min}` : ""} ${drive}`;
}
