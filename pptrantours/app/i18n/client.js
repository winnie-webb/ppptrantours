import { LOCALE_CODES } from "./config";

/**
 * The slice of a dictionary that interactive components actually read.
 *
 * Anything handed to a `"use client"` component is serialised into the RSC
 * payload of every page that renders it. Passing the whole dictionary put ~25KB
 * of prose — every FAQ answer, the About page history, all 24 tour
 * descriptions — into the wire format of pages that never display a word of it.
 * That matters here more than usual: a good share of these guests are reading
 * on a phone, on roaming data, in an airport.
 *
 * Server components can still take the full dictionary. They render to HTML and
 * nothing they read is serialised.
 *
 * Tour titles come across as a flat `{id: title}` map rather than the whole
 * tour record, because the type-ahead needs the names and nothing else.
 */
const CLIENT_NAMESPACES = [
  "common",
  "nav",
  "categories",
  "durations",
  "price",
  "place",
  "placePrompt",
  "search",
  "grid",
  "booking",
  "fare",
  "gallery",
  "contactForm",
];

export function clientDict(dict) {
  const out = {};
  for (const ns of CLIENT_NAMESPACES) {
    if (dict[ns] !== undefined) out[ns] = dict[ns];
  }

  const titles = {};
  for (const [id, tour] of Object.entries(dict.tours ?? {})) {
    if (tour?.title) titles[id] = tour.title;
  }
  out.tourTitles = titles;

  return out;
}

export { LOCALE_CODES };
