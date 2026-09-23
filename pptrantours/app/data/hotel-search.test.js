import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { PLACES } from "./places.js";
import {
  normalize,
  tokenize,
  editDistance,
  buildIndex,
  buildFullIndex,
  search,
  didYouMean,
} from "./hotel-search.js";

describe("normalize", () => {
  test("folds case, diacritics and punctuation", () => {
    assert.equal(normalize("Iberostar Joia Rose Hall"), "iberostar joia rose hall");
    assert.equal(normalize("Franklyn D. Resort & Spa"), "franklyn d resort and spa");
    assert.equal(normalize("  Café   Résort  "), "cafe resort");
  });
});

describe("editDistance", () => {
  test("counts a single insertion", () => {
    assert.equal(editDistance("iberstar", "iberostar"), 1);
  });

  test("counts an adjacent transposition as one edit", () => {
    assert.equal(editDistance("sveen", "seven"), 1);
  });

  test("zero for identical strings", () => {
    assert.equal(editDistance("negril", "negril"), 0);
  });
});

// The full index includes places pending owner review, so the algorithm is
// tested against every hotel PPP could plausibly serve, not just the ones
// currently switched on for guests.
const index = buildFullIndex();
const find = (query, limit = 8) => search(query, index, { limit });
const names = (query, limit = 8) => find(query, limit).map((p) => p.name);

describe("search — 07_HOTEL_SELECTION.md §8 acceptance table", () => {
  test('"hyatt" finds both Rose Hall Hyatt properties', () => {
    const result = names("hyatt");
    assert.ok(result.includes("Hyatt Ziva Rose Hall"));
    assert.ok(result.includes("Hyatt Zilara Rose Hall"));
  });

  test('"joia iberostar" (word order swapped) finds Iberostar Joia Rose Hall first', () => {
    const result = find("joia iberostar");
    assert.equal(result[0]?.name, "Iberostar Joia Rose Hall");
  });

  test('"iberstar" (typo) finds every Iberostar property', () => {
    const expected = PLACES.filter((p) => p.name.startsWith("Iberostar")).length;
    const result = names("iberstar", 20);
    assert.equal(result.filter((n) => n.startsWith("Iberostar")).length, expected);
  });

  test('"FDR" finds Franklyn D. Resort & Spa via its alias', () => {
    const result = find("FDR");
    assert.equal(result[0]?.name, "Franklyn D. Resort & Spa");
  });

  test('"sandals mobay" finds only Montego Bay Sandals properties', () => {
    const result = find("sandals mobay");
    assert.ok(result.length > 0);
    assert.ok(result.every((p) => p.area === "montego-bay" && p.name.includes("Sandals")));
    assert.ok(result.some((p) => p.name === "Sandals Montego Bay"));
    assert.ok(result.some((p) => p.name === "Sandals Royal Caribbean"));
  });

  test('"riu" finds every Riu property, Montego Bay first', () => {
    const expected = PLACES.filter((p) => p.name.startsWith("Riu")).length;
    const result = find("riu", 20);
    assert.equal(result.length, expected);
    assert.equal(result[0]?.area, "montego-bay");
  });

  test('"franklyn d resort" (stop-word "resort" ignored either side) finds FDR', () => {
    const result = find("franklyn d resort");
    assert.equal(result[0]?.name, "Franklyn D. Resort & Spa");
  });

  test('"ocho" finds only Ocho Rios & St. Ann properties', () => {
    const result = find("ocho", 20);
    assert.ok(result.length > 0);
    assert.ok(result.every((p) => p.area === "ocho-rios"));
  });

  test('"xyzhotel" finds nothing, but suggests the closest names', () => {
    const result = find("xyzhotel");
    assert.equal(result.length, 0);
    // "hotel" alone is a stop-word, so only "xyz" drives the match — nothing
    // in the list is close to it, which is the point of this case.
    const suggestions = didYouMean("xyzhotel", index, 3);
    assert.ok(Array.isArray(suggestions));
  });

  test("empty query returns no ranked results (caller shows Popular + Browse by area)", () => {
    assert.deepEqual(find(""), []);
    assert.deepEqual(find("   "), []);
  });
});

describe("search — general behaviour", () => {
  test("every query token must match (AND), not any", () => {
    // No place is both a Sandals property and in Negril's West End.
    const result = find("sandals west end cliffs");
    assert.equal(result.length, 0);
  });

  test("respects the limit", () => {
    const result = find("ocho", 3);
    assert.equal(result.length, 3);
  });

  test("an unmatched place is excluded even if some query tokens hit", () => {
    const result = find("hyatt goldeneye");
    assert.equal(result.length, 0);
  });
});

describe("buildIndex", () => {
  test("indexes a minimal fixture without the real data", () => {
    const fixture = [
      { key: "a", name: "Test Hotel", area: "montego-bay", aliases: ["Testy"] },
    ];
    const areas = [{ key: "montego-bay", label: "Montego Bay", aliases: ["MoBay"] }];
    const idx = buildIndex(fixture, areas);
    assert.equal(idx.length, 1);
    assert.deepEqual(idx[0].nameTokens, ["test", "hotel"]);
    assert.deepEqual(idx[0].aliasTokens, ["testy"]);
    assert.ok(idx[0].areaTokens.includes("mobay"));

    const result = search("mobay", idx);
    assert.equal(result[0]?.key, "a");
  });
});

describe("tokenize", () => {
  test("drops empty tokens for blank input", () => {
    assert.deepEqual(tokenize(""), []);
    assert.deepEqual(tokenize("   "), []);
  });
});
