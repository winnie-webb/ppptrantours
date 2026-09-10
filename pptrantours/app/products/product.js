/**
 * Catalogue accessors.
 *
 * Browsing is organised the way the owner asked for it: "things to do in
 * Montego Bay", "things to do in Ocho Rios", and so on. A tour therefore has a
 * `region` (where it is) and a `kind` (what it is), and a browse category is a
 * saved query over those two rather than a field on the record. That is what
 * lets Blue Hole appear under both "Ocho Rios" and "Most popular" without being
 * duplicated in the data.
 */
import { CATALOGUE, TOURS, TRANSFERS } from "@/app/data/catalogue";
import { AREAS } from "@/app/data/places";

export { CATALOGUE, TOURS, TRANSFERS };

/**
 * Browse categories, in nav order.
 *
 * `match` is the query. `parish` marks the ones that are geographic, because
 * those are the headings the owner wants keyword-optimised — the page titles
 * read "Things to do in Negril", not "Negril tours".
 */
export const CATEGORIES = [
  {
    type: "popular",
    title: "Most Popular Tours",
    short: "Most Popular",
    match: (t) => t.popular === true,
  },
  {
    type: "transfers",
    title: "Airport Transfers",
    short: "Transfers",
    match: (t) => t.kind === "transfer",
  },
  {
    type: "combos",
    title: "Combo Tour Packages",
    short: "Combo Packages",
    match: (t) => t.kind === "combo",
  },
  {
    type: "montego-bay",
    title: "Things to do in Montego Bay",
    short: "Montego Bay",
    parish: "St. James",
    match: (t) => t.region === "montego-bay" && t.kind !== "transfer",
  },
  {
    type: "ocho-rios",
    title: "Things to do in Ocho Rios",
    short: "Ocho Rios",
    parish: "St. Ann",
    match: (t) => t.region === "ocho-rios" && t.kind !== "transfer",
  },
  {
    type: "falmouth",
    title: "Things to do in Falmouth",
    short: "Falmouth",
    parish: "Trelawny",
    match: (t) => t.region === "falmouth" && t.kind !== "transfer",
  },
  {
    type: "negril",
    title: "Things to do in Negril",
    short: "Negril",
    parish: "Westmoreland",
    match: (t) => t.region === "negril" && t.kind !== "transfer",
  },
  {
    type: "south-coast",
    title: "Things to do on the South Coast",
    short: "South Coast",
    parish: "St. Elizabeth",
    match: (t) => t.region === "south-coast" && t.kind !== "transfer",
  },
];

/** The parish categories alone, for the "Things to do in Jamaica" hub. */
export const PARISH_CATEGORIES = CATEGORIES.filter((c) => c.parish);

export function getCategory(type) {
  return CATEGORIES.find((c) => c.type === type) ?? null;
}

export function getCategoryTitle(type) {
  return getCategory(type)?.title ?? "Tours & Transfers";
}

export function getCategoryShort(type) {
  return getCategory(type)?.short ?? "Tours";
}

export function filterProductByCategory(type) {
  const category = getCategory(type);
  return category ? CATALOGUE.filter(category.match) : [];
}

export function filterProductById(id) {
  return CATALOGUE.find((p) => p.id === id) ?? null;
}

export function getAllProducts() {
  return CATALOGUE;
}

/** Excursions and combos, i.e. everything that is not an airport transfer. */
export function getAllTours() {
  return TOURS;
}

export function getRegionLabel(region) {
  return AREAS.find((a) => a.key === region)?.label ?? region;
}

/** Title and description search, de-duplicated. */
export function searchProduct(input) {
  const query = input.trim().toLowerCase();
  if (!query) return [];

  return CATALOGUE.filter((p) =>
    [p.title, p.subtitle ?? "", p.desc, getRegionLabel(p.region)]
      .join(" ")
      .toLowerCase()
      .includes(query)
  );
}

/**
 * Other tours worth showing beside this one: same region first, then anything
 * else popular, so a page is never left with an empty "you might also like".
 */
export function getRelatedProducts(product, limit = 3) {
  const sameRegion = TOURS.filter(
    (t) => t.region === product.region && t.id !== product.id
  );
  const fallback = TOURS.filter(
    (t) => t.popular && t.region !== product.region && t.id !== product.id
  );
  return [...sameRegion, ...fallback].slice(0, limit);
}

/** Cheapest transport first. Tours with no published price sort last. */
export function sortByPrice(list) {
  const floor = (t) => {
    const bands = Object.values(t.zones ?? {});
    return bands.length ? Math.min(...bands.map((b) => b.price)) : Infinity;
  };
  return [...list].sort((a, b) => floor(a) - floor(b));
}

export { money as formatPrice } from "./pricing";
