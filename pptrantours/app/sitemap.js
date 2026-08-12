import { CATEGORIES, getAllProducts } from "./products/product";

const BASE = "https://ppptrantoursjamaica.com";

/**
 * Every indexable route. The domain served empty 200s for months while the old
 * WordPress install was broken, so an explicit sitemap is what tells Google to
 * recrawl the catalogue rather than trust its stale view of the homepage.
 */
export default function sitemap() {
  const staticRoutes = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/tours", priority: 0.9, changeFrequency: "weekly" },
    { path: "/destinations", priority: 0.8, changeFrequency: "monthly" },
    { path: "/about-us", priority: 0.6, changeFrequency: "yearly" },
    { path: "/contact-us", priority: 0.7, changeFrequency: "yearly" },
  ].map(({ path, priority, changeFrequency }) => ({
    url: `${BASE}${path}`,
    priority,
    changeFrequency,
  }));

  const categoryRoutes = CATEGORIES.map(({ type }) => ({
    url: `${BASE}/category/${type}`,
    priority: 0.8,
    changeFrequency: "weekly",
  }));

  const productRoutes = getAllProducts().map(({ id }) => ({
    url: `${BASE}/product/${id}`,
    priority: 0.7,
    changeFrequency: "monthly",
  }));

  return [...staticRoutes, ...categoryRoutes, ...productRoutes];
}
