/**
 * Airlines that fly into Sangster International (MBJ), for the booking form's
 * airline type-ahead. Not a closed list: a guest whose airline is missing just
 * types it, and the text is sent as is. `code` is the IATA prefix on their
 * flight number, so typing "AA" finds American as readily as typing its name.
 */
export const AIRLINES = [
  { code: "AA", name: "American Airlines" },
  { code: "DL", name: "Delta Air Lines" },
  { code: "UA", name: "United Airlines" },
  { code: "B6", name: "JetBlue" },
  { code: "WN", name: "Southwest Airlines" },
  { code: "NK", name: "Spirit Airlines" },
  { code: "F9", name: "Frontier Airlines" },
  { code: "SY", name: "Sun Country Airlines" },
  { code: "AS", name: "Alaska Airlines" },
  { code: "G4", name: "Allegiant Air" },
  { code: "MX", name: "Breeze Airways" },
  { code: "XP", name: "Avelo Airlines" },
  { code: "AC", name: "Air Canada" },
  { code: "RV", name: "Air Canada Rouge" },
  { code: "WS", name: "WestJet" },
  { code: "WG", name: "Sunwing Airlines" },
  { code: "PD", name: "Porter Airlines" },
  { code: "TS", name: "Air Transat" },
  { code: "F8", name: "Flair Airlines" },
  { code: "BA", name: "British Airways" },
  { code: "VS", name: "Virgin Atlantic" },
  { code: "BY", name: "TUI Airways" },
  { code: "DE", name: "Condor" },
  { code: "4Y", name: "Discover Airlines" },
  { code: "EW", name: "Eurowings" },
  { code: "WK", name: "Edelweiss Air" },
  { code: "NO", name: "Neos" },
  { code: "KL", name: "KLM" },
  { code: "BW", name: "Caribbean Airlines" },
  { code: "CM", name: "Copa Airlines" },
  { code: "AV", name: "Avianca" },
  { code: "KX", name: "Cayman Airways" },
  { code: "UP", name: "Bahamasair" },
  { code: "JY", name: "interCaribbean Airways" },
];

const fold = (s) =>
  (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();

/**
 * Best matches first: exact IATA code, then a name or word that starts with
 * the query, then anything containing it.
 */
export function searchAirlines(query, limit = 6) {
  const q = fold(query);
  if (!q) return [];
  const scored = [];
  for (const a of AIRLINES) {
    const name = fold(a.name);
    const code = a.code.toLowerCase();
    let score = -1;
    if (code === q) score = 0;
    else if (name.startsWith(q)) score = 1;
    else if (name.split(/\s+/).some((w) => w.startsWith(q))) score = 2;
    else if (name.includes(q)) score = 3;
    if (score >= 0) scored.push([score, a]);
  }
  return scored
    .sort((x, y) => x[0] - y[0] || x[1].name.localeCompare(y[1].name))
    .slice(0, limit)
    .map(([, a]) => a);
}
