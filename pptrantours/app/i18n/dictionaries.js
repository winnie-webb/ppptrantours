import "server-only";
import { DEFAULT_LOCALE, isLocale } from "./config";

/**
 * Static imports, not `import(\`./messages/${locale}.json\`)`.
 *
 * A template literal here would make the bundler include all ten dictionaries
 * in every route it cannot statically analyse. Naming each one lets it ship
 * only the locale being rendered.
 */
const DICTIONARIES = {
  en: () => import("./messages/en.json").then((m) => m.default),
  es: () => import("./messages/es.json").then((m) => m.default),
  fr: () => import("./messages/fr.json").then((m) => m.default),
  de: () => import("./messages/de.json").then((m) => m.default),
  it: () => import("./messages/it.json").then((m) => m.default),
  pt: () => import("./messages/pt.json").then((m) => m.default),
  nl: () => import("./messages/nl.json").then((m) => m.default),
  ru: () => import("./messages/ru.json").then((m) => m.default),
  zh: () => import("./messages/zh.json").then((m) => m.default),
  ja: () => import("./messages/ja.json").then((m) => m.default),
};

/**
 * The dictionary for a locale, with English merged in underneath it.
 *
 * A missing or untranslated key falls back to English rather than rendering an
 * empty string or a raw key. A half-translated page is a bad look; a blank
 * price label is a broken one.
 */
export async function getDictionary(locale) {
  const code = isLocale(locale) ? locale : DEFAULT_LOCALE;
  const en = await DICTIONARIES[DEFAULT_LOCALE]();
  if (code === DEFAULT_LOCALE) return en;

  const translated = await DICTIONARIES[code]();
  return deepMerge(en, translated);
}

/** Arrays are replaced wholesale; objects merge key by key. */
function deepMerge(base, override) {
  if (Array.isArray(base)) return override ?? base;
  if (typeof base !== "object" || base === null) return override ?? base;

  const out = { ...base };
  for (const key of Object.keys(override ?? {})) {
    const b = base[key];
    const o = override[key];
    out[key] =
      b && typeof b === "object" && !Array.isArray(b) ? deepMerge(b, o) : o;
  }
  return out;
}

/**
 * `t("booking.total")` against a dictionary, with `{name}` interpolation.
 *
 * Returns the key itself when nothing matches, which is loud enough to catch in
 * review but harmless if it ever reaches a guest.
 */
export function translator(dict) {
  return function t(path, vars) {
    const value = path
      .split(".")
      .reduce((node, key) => (node == null ? undefined : node[key]), dict);

    if (typeof value !== "string") return value ?? path;
    if (!vars) return value;

    return value.replace(/\{(\w+)\}/g, (match, key) =>
      vars[key] != null ? String(vars[key]) : match
    );
  };
}
