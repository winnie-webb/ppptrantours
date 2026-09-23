/**
 * Client-side hotel search: normalise, tokenise, fuzzy-match, rank.
 *
 * 07_HOTEL_SELECTION.md §3 in full. About 200 records is a few KB, so this
 * runs entirely in the browser — no network, no cost, no failure mode.
 *
 * The matching/ranking core (`normalize`, `tokenize`, `editDistance`,
 * `buildIndex`, `search`) is pure and takes its data as an argument, so the
 * acceptance table in hotel-search.test.js can exercise it directly against
 * every place — including ones pending owner review — while the app only
 * ever searches `activePlaces()` through the wrappers at the bottom.
 */

import { PLACES, AREAS, activePlaces } from "./places.js";

/** Ignored in the query — real words that add nothing to a hotel match. */
const STOPWORDS = new Set(["hotel", "resort", "the", "and", "spa", "jamaica"]);

/**
 * `"É Iberostar-Joia & Spa"` → `"e iberostar joia and spa"`.
 *
 * Diacritics fold, `&` becomes "and" so it survives punctuation stripping,
 * and everything else non-alphanumeric collapses to single spaces.
 */
export function normalize(s) {
  return (s ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(s) {
  const n = normalize(s);
  return n ? n.split(" ") : [];
}

/** Query tokens only: stop-words dropped, so "franklyn d resort" still works. */
function tokenizeQuery(s) {
  return tokenize(s).filter((tk) => !STOPWORDS.has(tk));
}

/**
 * Damerau-Levenshtein (optimal string alignment) edit distance.
 *
 * Counts adjacent transpositions as one edit as well as insert/delete/
 * substitute, so "iberstar" is one edit from "iberostar" and "seven" is one
 * from "sveen".
 */
export function editDistance(a, b) {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  const d = Array.from({ length: al + 1 }, () => new Array(bl + 1).fill(0));
  for (let i = 0; i <= al; i += 1) d[i][0] = i;
  for (let j = 0; j <= bl; j += 1) d[0][j] = j;

  for (let i = 1; i <= al; i += 1) {
    for (let j = 1; j <= bl; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,
        d[i][j - 1] + 1,
        d[i - 1][j - 1] + cost
      );
      if (
        i > 1 &&
        j > 1 &&
        a[i - 1] === b[j - 2] &&
        a[i - 2] === b[j - 1]
      ) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
      }
    }
  }
  return d[al][bl];
}

/**
 * Whether a query token matches one indexed token, either as a prefix
 * (search-as-you-type) or, for tokens of four characters or more, within a
 * typo's reach (07 §3.2): edit distance 1 for 4–7 character queries, 2 for
 * 8-plus.
 */
function tokenMatch(queryToken, indexToken) {
  if (indexToken.startsWith(queryToken)) return { fuzzy: false };
  if (queryToken.length >= 4) {
    const maxDist = queryToken.length >= 8 ? 2 : 1;
    if (editDistance(queryToken, indexToken) <= maxDist) return { fuzzy: true };
  }
  return null;
}

/** The best match for one query token across a list of indexed tokens. */
function bestMatch(queryToken, indexTokens) {
  let fuzzyHit = null;
  for (const it of indexTokens) {
    const m = tokenMatch(queryToken, it);
    if (m && !m.fuzzy) return m;
    if (m) fuzzyHit = m;
  }
  return fuzzyHit;
}

/**
 * One place, indexed once at build time: its normalised name plus the token
 * lists §3.2 matches against (name, aliases, area label + area aliases).
 */
function indexPlace(place, areasByKey) {
  const area = areasByKey.get(place.area);
  const areaText = [area?.label, ...(area?.aliases ?? [])].filter(Boolean).join(" ");
  return {
    place,
    normalizedName: normalize(place.name),
    nameTokens: tokenize(place.name),
    aliasTokens: (place.aliases ?? []).flatMap(tokenize),
    areaTokens: tokenize(areaText),
  };
}

export function buildIndex(places, areas = AREAS) {
  const areasByKey = new Map(areas.map((a) => [a.key, a]));
  return places.map((p) => indexPlace(p, areasByKey));
}

/**
 * Score one indexed place against the already-tokenised, stop-word-free
 * query (07 §3.3). Every query token must match (AND) or the place is out —
 * `null` marks that, rather than a score, so callers can tell "matched with a
 * score of 0" (impossible here, but not the point) from "did not match".
 */
export function scoreEntry(queryTokens, fullQuery, entry) {
  let score = 0;

  for (const qt of queryTokens) {
    const nameHit = bestMatch(qt, entry.nameTokens);
    const aliasHit = !nameHit && bestMatch(qt, entry.aliasTokens);
    const areaHit = !nameHit && !aliasHit && bestMatch(qt, entry.areaTokens);
    const hit = nameHit ?? aliasHit ?? areaHit;
    if (!hit) return null;

    if (nameHit) score += 40;
    else if (aliasHit) score += 25;
    else score += 10;
    if (hit.fuzzy) score -= 15;
  }

  if (fullQuery && entry.normalizedName.startsWith(fullQuery)) score += 100;
  return score;
}

function byRank(a, b) {
  if (b.score !== a.score) return b.score - a.score;
  const pa = a.entry.place.popularity ?? 0;
  const pb = b.entry.place.popularity ?? 0;
  if (pb !== pa) return pb - pa;
  return a.entry.place.name.localeCompare(b.entry.place.name);
}

/**
 * The §3 algorithm end to end, over whatever index it is given.
 *
 * An empty (or all-stop-word) query has no meaningful tokens to AND against,
 * so it returns no results — callers show "Popular" + "Browse by area"
 * instead, per §4.1's IDLE state.
 */
export function search(query, index, { limit = 8 } = {}) {
  const queryTokens = tokenizeQuery(query);
  if (queryTokens.length === 0) return [];
  const fullQuery = normalize(query);

  const scored = [];
  for (const entry of index) {
    const score = scoreEntry(queryTokens, fullQuery, entry);
    if (score != null) scored.push({ entry, score });
  }
  scored.sort(byRank);
  return scored.slice(0, limit).map((s) => s.entry.place);
}

/**
 * "No match for {q}" fallback (§3.4): the closest names by whole-string edit
 * distance, only when at least one is plausibly close.
 */
export function didYouMean(query, index, limit = 3) {
  const q = normalize(query);
  if (!q) return [];

  const reach = Math.max(3, Math.ceil(q.length * 0.6));
  return index
    .map((entry) => ({ place: entry.place, dist: editDistance(q, entry.normalizedName) }))
    .filter((r) => r.dist <= reach)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, limit)
    .map((r) => r.place);
}

/* ── Live wrappers, bound to the guest-facing (active-only) data ─────────── */

const LIVE_INDEX = buildIndex(activePlaces(), AREAS);

/** Ranked hotel search over every active place. */
export function searchHotels(query, { limit = 8 } = {}) {
  return search(query, LIVE_INDEX, { limit });
}

/** The empty-query "Popular" list: highest `popularity` first, hotels only. */
export function popularHotels(limit = 8) {
  return LIVE_INDEX.map((e) => e.place)
    .filter((p) => p.kind === "hotel")
    .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0) || a.name.localeCompare(b.name))
    .slice(0, limit);
}

export function suggestClosest(query, limit = 3) {
  return didYouMean(query, LIVE_INDEX, limit);
}

/** For tests and callers that want the raw (including pending-review) data. */
export function buildFullIndex() {
  return buildIndex(PLACES, AREAS);
}
