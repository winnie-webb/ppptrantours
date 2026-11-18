// OSRM driving times: every place -> airport and -> every attraction. Writes times.json.
import fs from "fs";
const dir = process.argv[2];
const geo = JSON.parse(fs.readFileSync(`${dir}/geo.json`, "utf8"));
const places = JSON.parse(fs.readFileSync(`${dir}/places.json`, "utf8"));

// Hand corrections where the geocoder missed or hit the wrong thing.
const FIX_P = {
  altamont: [18.4795, -77.9222], "hotel-39": [18.4712, -77.9165], "club-montego-bay": [18.4790, -77.9225],
  "sandals-montego-bay": [18.4992, -77.9095], zoetry: [18.5150, -77.8455],
  "iberostar-waves": [18.5160, -77.8320], "dreams-rose-hall": [18.5185, -77.8085],
  "sea-castles": [18.5175, -77.8230], "holiday-inn-rose-hall": [18.5180, -77.8380],
  "excellence-oyster-bay": [18.4985, -77.6475], "royalton-blue-waters": [18.4935, -77.6290],
  "bahia-principe": [18.4615, -77.3480], "franklyn-d": [18.4630, -77.3225],
  "round-hill": [18.4620, -78.0310], "lady-hamilton": null, // copied from grand-palladium below
  "princess-jamaica": [18.3830, -78.2650], "sandals-dunns-river": [18.4232, -77.1735], "grand-lido-negril": [18.3575, -78.3335],
  "couples-sans-souci": [18.4060, -77.0880], "couples-tower-isle": [18.4045, -77.0230],
  goldeneye: [18.4040, -76.9480], "sandcastles-jamaica": [18.4065, -77.1000],
  "jewel-paradise-cove": [18.4650, -77.3550], "cardiff-hotel-spa": [18.4610, -77.3330],
  "mobay-cruise-pier": [18.4630, -77.9420], "falmouth-cruise-pier": [18.4935, -77.6560],
  "sandals-south-coast": [18.0790, -77.9740], "jakes-hotel": [17.8690, -77.7330],
};
const FIX_A = {
  "martha-brae-rafting": [18.4560, -77.6625], // Martha Brae Rafters Village
  "montego-bay-highlights": [18.4846, -77.9246], // Doctor's Cave Beach
  "dolphin-cove-ocho-rios": [18.4155, -77.1319], // beside Dunn's River
  "appleton-estate": [18.1727, -77.7470],
  "sand-and-saddle": [18.4640, -77.5000], // Braco Stables, Trelawny
  "river-rapids-tubing": [18.4440, -77.4720], // Rio Bueno rapids, Trelawny
};

const P = {};
for (const p of places) {
  const f = FIX_P[p.key];
  const g = geo.places[p.key];
  P[p.key] = f ? { lat: f[0], lon: f[1] } : g ? { lat: g.lat, lon: g.lon } : null;
}
P["lady-hamilton"] = P["grand-palladium"];
const missing = Object.entries(P).filter(([, v]) => !v).map(([k]) => k);
if (missing.length) { console.log("MISSING", missing); process.exit(1); }

const A = {};
for (const [k, v] of Object.entries(geo.attractions)) A[k] = { lat: v.lat, lon: v.lon };
// The OSM "Dolphin Cove" hit is the Lucea (Hanover) park, i.e. Dolphin Cove Montego Bay.
A["dolphin-cove-montego-bay"] = A["dolphin-cove-ocho-rios"];
for (const [k, v] of Object.entries(FIX_A)) A[k] = { lat: v[0], lon: v[1] };
delete A["half-moon-equestrian"]; delete A["chukka-sandy-bay"]; delete A["great-river"];
const airport = A.airport; delete A.airport;

const destKeys = ["airport", ...Object.keys(A)];
const dests = [airport, ...Object.values(A)];
const keys = Object.keys(P);
const out = { airport: {}, tours: {}, coords: { P, A, airport } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

for (let i = 0; i < keys.length; i += 40) {
  const batch = keys.slice(i, i + 40);
  const coords = [...batch.map((k) => P[k]), ...dests].map((c) => `${c.lon},${c.lat}`).join(";");
  const src = batch.map((_, j) => j).join(";");
  const dst = dests.map((_, j) => j + batch.length).join(";");
  const url = `https://router.project-osrm.org/table/v1/driving/${coords}?sources=${src}&destinations=${dst}&annotations=duration`;
  const r = await fetch(url, { headers: { "User-Agent": "PPPSiteBuilder/1.0" } });
  const j = await r.json();
  if (j.code !== "Ok") { console.log(j); process.exit(1); }
  batch.forEach((k, bi) => {
    const row = j.durations[bi];
    out.airport[k] = Math.round(row[0] / 60);
    out.tours[k] = {};
    destKeys.slice(1).forEach((dk, di) => (out.tours[k][dk] = Math.round(row[di + 1] / 60)));
  });
  await sleep(1500);
}
fs.writeFileSync(`${dir}/times.json`, JSON.stringify(out, null, 1));
for (const k of keys) console.log(k.padEnd(28), "MBJ", String(out.airport[k]).padStart(4), " MBJ-pier?", "");
