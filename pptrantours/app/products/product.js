import products from "../data/products.json";

export { products };

export const CATEGORIES = [
  { type: "mpt", title: "Most Popular Tours", short: "Most Popular" },
  { type: "at", title: "Airport Transfers", short: "Transfers" },
  { type: "ctp", title: "Combo Tour Packages", short: "Combo Packages" },
  { type: "abc", title: "Attractions, Beach & City Tours", short: "Attractions" },
  { type: "cse", title: "Cruise Shore Excursions", short: "Shore Excursions" },
  { type: "edt", title: "Eating & Dining Tours", short: "Dining" },
  { type: "egt", title: "Exclusive Golf Tours", short: "Golf" },
  { type: "ncb", title: "Nightlife, Casino & Bar Tours", short: "Nightlife" },
  { type: "st", title: "Shopping Tours", short: "Shopping" },
];

export function getAllProducts() {
  return products;
}

export function getCategoryTitle(type) {
  return CATEGORIES.find((c) => c.type === type)?.title ?? "Tours & Transfers";
}

export function getCategoryShort(type) {
  return CATEGORIES.find((c) => c.type === type)?.short ?? "Tours";
}

export function filterProductByCategory(category) {
  return products.filter((product) => product.category === category);
}

export function filterProductById(id) {
  return products.find((product) => product.id === id);
}

/**
 * Title search, de-duplicated by title so the same tour listed under several
 * categories only shows up once in the results.
 */
export function searchProduct(input) {
  const query = input.trim().toLowerCase();
  if (!query) return [];

  const seen = new Set();
  return products.filter((product) => {
    const title = product.title.toLowerCase();
    if (!title.includes(query) || seen.has(title)) return false;
    seen.add(title);
    return true;
  });
}

/** Cheapest-first, used by the category grids. */
export function sortByPrice(list) {
  return [...list].sort((a, b) => a.priceLowest - b.priceLowest);
}

/** Other tours in the same category, for the product page. */
export function getRelatedProducts(product, limit = 3) {
  return products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .filter((p, i, arr) => arr.findIndex((x) => x.title === p.title) === i)
    .slice(0, limit);
}

export function formatPrice(value) {
  const n = Number(value);
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}
