/**
 * JSON-LD builders.
 *
 * Every value here comes out of `site.js`, `catalogue.js` or `places.js` — this
 * module derives, it never states a fact of its own. If a figure is wrong it is
 * wrong at the source too, which is the point: the markup and the page a guest
 * reads can never disagree.
 *
 * DELIBERATELY ABSENT: `aggregateRating`. The 5.0 from 680 Tripadvisor reviews
 * is real and verified, and it is exactly what would put stars in a search
 * result — but Google's review-snippet policy makes a page ineligible when the
 * entity being reviewed controls the reviews on it, and reviews of PPP on PPP's
 * own site are the textbook case. Marking it up cannot win the stars and risks
 * the rest of this markup being distrusted. `sameAs` points at the Tripadvisor
 * listing instead, so the entity can still be tied to its real ratings.
 *
 * Also deliberately absent: `geo`. Nobody has given us coordinates for 108 Farm
 * Heights, and a plausible-looking guess would send a driver to the wrong gate.
 */

import { site } from "./site";
import { TOURS } from "./catalogue";
import { PLACES } from "./places";
import { lowestTransport, minimumFare, MIN_BILLED_PAX } from "@/app/products/pricing";

const ORG_ID = "#organization";

function postalAddress() {
  return {
    "@type": "PostalAddress",
    streetAddress: `${site.address.line1}, ${site.address.line2}`,
    addressLocality: site.address.city,
    addressRegion: site.address.parish,
    addressCountry: "JM",
  };
}

/**
 * The company itself. `TravelAgency` rather than a bare `LocalBusiness`: it is
 * the narrowest schema.org type that actually fits an operator selling
 * transfers and excursions, and narrower types are read more confidently.
 */
export function organizationSchema(baseUrl) {
  // The Facebook and Instagram entries in site.js are bare domains — no PPP
  // account was ever found. Publishing those as `sameAs` would assert that
  // facebook.com itself is this company.
  const sameAs = [site.social.tripadvisor].filter(
    (u) => u && !/^https?:\/\/(www\.)?(facebook|instagram)\.com\/?$/.test(u)
  );

  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "@id": `${baseUrl}/${ORG_ID}`,
    name: site.legalName,
    alternateName: [site.name, site.longName],
    description: site.descriptor,
    slogan: site.tagline,
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    image: `${baseUrl}/opengraph-image.jpg`,
    telephone: site.contact.phone,
    email: site.contact.email,
    foundingDate: String(site.founded),
    address: postalAddress(),
    areaServed: { "@type": "Country", name: "Jamaica" },
    currenciesAccepted: "USD, JMD",
    priceRange: "$$",
    sameAs,
    founder: {
      "@type": "Person",
      name: site.owner.name,
      jobTitle: site.owner.role,
    },
    // From site.hours: seven days, 06:00-22:00. Flights are met at any hour,
    // but that is an exception granted per booking rather than published
    // trading hours, so it is not claimed here.
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "06:00",
        closes: "22:00",
      },
    ],
  };
}

export function websiteSchema(baseUrl) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${baseUrl}/#website`,
    url: baseUrl,
    name: site.legalName,
    inLanguage: "en",
    publisher: { "@id": `${baseUrl}/${ORG_ID}` },
  };
}

/** `items` is [{ name, url }] in order, root first. URLs must be absolute. */
export function breadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: it.url,
    })),
  };
}

export function faqSchema(faqs) {
  const usable = (faqs ?? []).filter((f) => f && f.q && f.a);
  if (usable.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: usable.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

/**
 * A tour, as a `Product` with a low-price `AggregateOffer`.
 *
 * The price is transport only, and it is the *lowest* published origin — which
 * is exactly what the page's own "from" figure shows. Gate fees are excluded
 * because PPP never collects them, so folding them in would misstate what is on
 * sale. `lowPrice` with no `highPrice` is honest about being a floor.
 */
export function tourSchema(tour, url, baseUrl, title, description) {
  const from = lowestTransport(tour);
  const offers =
    from == null
      ? undefined
      : {
          "@type": "AggregateOffer",
          priceCurrency: "USD",
          lowPrice: from,
          availability: "https://schema.org/InStock",
          offerCount: Object.keys(tour.zones ?? {}).length || 1,
          seller: { "@id": `${baseUrl}/${ORG_ID}` },
          description: `Per person, minimum ${MIN_BILLED_PAX} guests. Attraction entry is paid at the gate and is not included.`,
        };

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title ?? tour.title,
    description,
    image: tour.image ? `${baseUrl}${tour.image}` : undefined,
    url,
    category: "Tours & Excursions",
    brand: { "@id": `${baseUrl}/${ORG_ID}` },
    offers,
  };
}

/**
 * An airport transfer to one resort, as a `Service`.
 *
 * `Service` rather than `Product`: nothing is handed over, and the one-way rate
 * is a firm price for a defined journey rather than a "from".
 */
export function transferSchema(place, url, baseUrl, description) {
  const rate = place.transfer;
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    serviceType: "Private airport transfer",
    name: `Private airport transfer to ${place.name}`,
    description,
    url,
    provider: { "@id": `${baseUrl}/${ORG_ID}` },
    areaServed: { "@type": "Place", name: `${place.name}, Jamaica` },
    offers: rate
      ? {
          "@type": "Offer",
          priceCurrency: "USD",
          price: rate.oneWay,
          availability: "https://schema.org/InStock",
          description: `One way, per person, minimum ${MIN_BILLED_PAX} guests (${minimumFare(rate.oneWay)} USD). Round trip ${rate.roundTrip} USD per person.`,
        }
      : undefined,
  };
}

/** Every tour, as an ItemList — for the /tours hub. */
export function tourListSchema(baseUrl, localeHref) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Jamaica tours and excursions",
    numberOfItems: TOURS.length,
    itemListElement: TOURS.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.title,
      url: `${baseUrl}${localeHref(`/tour/${t.id}`)}`,
    })),
  };
}

/** Every resort with a published transfer rate — for the /transfers hub. */
export function transferListSchema(baseUrl, localeHref) {
  const priced = PLACES.filter((p) => p.transfer);
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Airport transfer rates by resort",
    numberOfItems: priced.length,
    itemListElement: priced.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: p.name,
      url: `${baseUrl}${localeHref(`/transfer/${p.key}`)}`,
    })),
  };
}
