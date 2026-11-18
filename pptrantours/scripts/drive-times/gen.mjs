// Writes app/data/drive-times.generated.js from times.json.
import fs from "fs";
const [dir, outFile] = process.argv.slice(2);
const t = JSON.parse(fs.readFileSync(`${dir}/times.json`, "utf8"));
const FACTOR = 1;
const shape = (m) => {
  const v = m * FACTOR;
  if (v < 20) return Math.max(5, Math.round(v));
  return Math.round(v / 5) * 5;
};
const places = Object.keys(t.airport);
const spots = Object.keys(t.tours[places[0]]);
const airport = Object.fromEntries(places.map((k) => [k, shape(t.airport[k])]));
const rows = Object.fromEntries(places.map((k) => [k, spots.map((s) => shape(t.tours[k][s]))]));

const body = `/**
 * GENERATED — do not edit by hand. Road-routed driving times in minutes.
 *
 * Every pickup point (hotel, area or cruise pier in places.js) was geocoded on
 * OpenStreetMap, then routed by car with OSRM to Sangster International (MBJ)
 * and to every attraction. Checked against commonly quoted journeys (MBJ to
 * Negril about 1h20, MBJ to Ocho Rios about 1h45) and used as routed,
 * rounded: to the minute under 20, otherwise to the nearest 5.
 *
 * Generated ${new Date().toISOString().slice(0, 10)}. Venues used where a tour's location is ambiguous:
 * Dolphin Cove Montego Bay = the park at Lucea, Hanover; Sand & Saddle =
 * Braco Stables, Trelawny; river rapids tubing = Rio Bueno, Trelawny;
 * Montego Bay highlights = Doctor's Cave Beach; Martha Brae = Rafters Village.
 */

/** Minutes from Sangster International (MBJ), by PLACES key. */
export const AIRPORT_MINUTES = ${JSON.stringify(airport)};

/** Column order of TOUR_MINUTES rows: the tour id each column drives to. */
export const SPOTS = ${JSON.stringify(spots)};

/** Minutes from each PLACES key to each SPOTS entry. */
export const TOUR_MINUTES = ${JSON.stringify(rows)};
`;
fs.writeFileSync(outFile, body.replace(/\n/g, "\r\n"));
console.log("spots", spots.length, "places", places.length);
