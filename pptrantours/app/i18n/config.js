/**
 * Ten languages, chosen for where Jamaica's visitors actually come from and
 * where the owner wants the PPP brand to reach next.
 *
 * English is unprefixed. `/tours` stays `/tours` and `/es/tours` is the Spanish
 * of it — the old site's URLs keep working and keep whatever ranking they have,
 * which matters here because the domain served blank pages for months and is
 * only now being recrawled.
 */
export const LOCALES = [
  { code: "en", name: "English", native: "English", dir: "ltr", hreflang: "en" },
  { code: "es", name: "Spanish", native: "Español", dir: "ltr", hreflang: "es" },
  { code: "fr", name: "French", native: "Français", dir: "ltr", hreflang: "fr" },
  { code: "de", name: "German", native: "Deutsch", dir: "ltr", hreflang: "de" },
  { code: "it", name: "Italian", native: "Italiano", dir: "ltr", hreflang: "it" },
  { code: "pt", name: "Portuguese", native: "Português", dir: "ltr", hreflang: "pt" },
  { code: "nl", name: "Dutch", native: "Nederlands", dir: "ltr", hreflang: "nl" },
  { code: "ru", name: "Russian", native: "Русский", dir: "ltr", hreflang: "ru" },
  { code: "zh", name: "Chinese", native: "中文", dir: "ltr", hreflang: "zh-Hans" },
  { code: "ja", name: "Japanese", native: "日本語", dir: "ltr", hreflang: "ja" },
];

export const LOCALE_CODES = LOCALES.map((l) => l.code);

export const DEFAULT_LOCALE = "en";

export function isLocale(code) {
  return LOCALE_CODES.includes(code);
}

export function getLocale(code) {
  return LOCALES.find((l) => l.code === code) ?? LOCALES[0];
}

/**
 * Build a href for a locale. English is unprefixed, so this is the only place
 * that needs to know that — every link in the app goes through it.
 */
export function localePath(locale, path = "/") {
  const clean = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  if (locale === DEFAULT_LOCALE) return clean || "/";
  return `/${locale}${clean}`;
}

/** Strip a locale prefix back off a pathname, for the language switcher. */
export function stripLocale(pathname) {
  const segments = pathname.split("/").filter(Boolean);
  if (segments.length > 0 && isLocale(segments[0])) {
    return `/${segments.slice(1).join("/")}`;
  }
  return pathname || "/";
}
