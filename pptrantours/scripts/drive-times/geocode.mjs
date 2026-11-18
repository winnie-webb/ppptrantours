// Geocode PPP places + attractions with Nominatim (1 req/s). Writes geo.json.
import fs from "fs";
const dir = process.argv[2];
const places = JSON.parse(fs.readFileSync(`${dir}/places.json`, "utf8"));
const UA = "PPPSiteBuilder/1.0";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const JM = "&countrycodes=jm&format=json&limit=1";

async function look(q) {
  const r = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}${JM}`, { headers: { "User-Agent": UA } });
  await sleep(1100);
  const j = await r.json();
  return j[0] ? { lat: +j[0].lat, lon: +j[0].lon, hit: j[0].display_name.slice(0, 90) } : null;
}

const ATTR = {
  "blue-hole": ["Irie Blue Hole", "Island Gully Falls"],
  "dunns-river-falls": ["Dunn's River Falls"],
  "mystic-mountain": ["Mystic Mountain"],
  "dolphin-cove-ocho-rios": ["Dolphin Cove Ocho Rios", "Dolphin Cove"],
  "bob-marley-nine-mile": ["Bob Marley Mausoleum", "Nine Mile, Saint Ann"],
  "dolphin-cove-montego-bay": ["Dolphin Cove Montego Bay", "Dolphin Cove Negril", "Dolphin Cove Lucea"],
  "rose-hall-great-house": ["Rose Hall Great House"],
  "montego-bay-highlights": ["Doctor's Cave Beach"],
  "half-moon-equestrian": ["Half Moon Equestrian Centre"],
  "chukka-sandy-bay": ["Chukka Montego Bay", "Sandy Bay, Hanover"],
  "great-river": ["Great River Jamaica"],
  "martha-brae-rafting": ["Martha Brae Rafters Village", "Martha Brae"],
  "luminous-lagoon": ["Glistening Waters"],
  "negril-seven-mile-beach": ["Seven Mile Beach Negril", "Negril"],
  "ricks-cafe": ["Rick's Cafe", "West End Road Negril"],
  "ys-falls": ["YS Falls"],
  "black-river-safari": ["Black River, Saint Elizabeth"],
  "appleton-estate": ["Appleton Estate", "Nassau Valley"],
  airport: ["Sangster International Airport"],
};

const out = { places: {}, attractions: {} };
for (const [k, qs] of Object.entries(ATTR)) {
  for (const q of qs) { const g = await look(q); if (g) { out.attractions[k] = { ...g, q }; break; } }
  console.log("A", k, out.attractions[k]?.hit ?? "MISS");
}
for (const p of places) {
  const qs = [p.name, p.name.replace(/ Resort.*| Hotel.*| & Spa/, ""), p.locality ? `${p.locality}, Jamaica` : null].filter(Boolean);
  for (const q of qs) { const g = await look(q); if (g) { out.places[p.key] = { ...g, q }; break; } }
  console.log("P", p.key, out.places[p.key]?.hit ?? "MISS");
}
fs.writeFileSync(`${dir}/geo.json`, JSON.stringify(out, null, 1));
