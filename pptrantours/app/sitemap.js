import { site } from "./data/site";
import { TOURS } from "./data/catalogue";
import { transferPlaces } from "./data/places";
import { CATEGORIES } from "./products/product";
import { DEFAULT_LOCALE, LOCALES, localePath } from "./i18n/config";

const BASE = site.url;

/**
 * Every indexable route, in every language.
 *
 * Each entry carries the full `alternates.languages` map rather than listing
 * the translations as separate rows. That is what tells Google these are ten
 * versions of one page and not ten thin duplicates competing with each other —
 * which matters more than usual here, because the transfer pages differ from
 * one another mainly by a resort name and a number.
 *
 * The domain served empty 200s for months while the old WordPress install was
 * broken, so an explicit sitemap is also what triggers a recrawl rather than
 * leaving Google with its stale view.
 */
export default function sitemap() {
  const paths = [
    { path: "/", priority: 1, changeFrequency: "weekly" },
    { path: "/tours", priority: 0.9, changeFrequency: "weekly" },
    { path: "/transfers", priority: 0.9, changeFrequency: "weekly" },
    { path: "/about-us", priority: 0.6, changeFrequency: "yearly" },
    { path: "/contact-us", priority: 0.7, changeFrequency: "yearly" },
    { path: "/terms", priority: 0.3, changeFrequency: "yearly" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" },

    ...CATEGORIES.filter((c) => c.type !== "transfers").map((c) => ({
      path: `/category/${c.type}`,
      priority: 0.8,
      changeFrequency: "weekly",
    })),

    ...TOURS.map((t) => ({
      path: `/tour/${t.id}`,
      priority: t.popular ? 0.8 : 0.7,
      changeFrequency: "monthly",
    })),

    ...transferPlaces().map((p) => ({
      path: `/transfer/${p.key}`,
      priority: 0.7,
      changeFrequency: "monthly",
    })),
  ];

  return paths.flatMap(({ path, priority, changeFrequency }) => {
    const languages = Object.fromEntries(
      LOCALES.map((l) => [l.hreflang, `${BASE}${localePath(l.code, path)}`])
    );

    return LOCALES.map((l) => ({
      url: `${BASE}${localePath(l.code, path)}`,
      priority: l.code === DEFAULT_LOCALE ? priority : priority * 0.9,
      changeFrequency,
      alternates: { languages },
    }));
  });
}
