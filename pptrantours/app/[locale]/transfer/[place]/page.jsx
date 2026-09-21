import { paymentsConfigured, paypalPublicConfig } from "@/lib/payments";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  FaChevronRight,
  FaPlane,
  FaClock,
  FaCar,
  FaUserTie,
  FaStar,
  FaCheck,
} from "react-icons/fa";
import { PLACES, getPlace, getAreaLabel, transferPlaces } from "@/app/data/places";
import { TOURS } from "@/app/data/catalogue";
import { money, minimumFare, MIN_BILLED_PAX } from "@/app/products/pricing";
import { site } from "@/app/data/site";
import BookingForm from "@/app/components/BookingForm";
import FarePill from "@/app/components/FarePill";
import StickyBookBar from "@/app/components/StickyBookBar";
import JsonLd from "@/app/components/JsonLd";
import TourCard from "@/app/components/TourCard";
import SectionHeading from "@/app/components/SectionHeading";
import { LOCALES, localePath } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/dictionaries";
import { breadcrumbSchema, transferSchema } from "@/app/data/schema";
import { clientDict } from "@/app/i18n/client";
import { languageAlternates } from "../../layout";

/**
 * One indexed page per resort.
 *
 * A guest searching "airport transfer to Iberostar Joia" should land on a page
 * that answers with a number, not on a generic transfers page they then have to
 * search. Forty-six resorts across ten languages is 460 static pages, which is
 * the point — it is the cheapest international reach the site has.
 */
export function generateStaticParams() {
  return LOCALES.flatMap((l) =>
    transferPlaces().map((p) => ({ locale: l.code, place: p.key }))
  );
}

export async function generateMetadata({ params }) {
  const { locale, place: placeKey } = await params;
  const place = getPlace(placeKey);
  if (!place?.transfer) return { title: "Not found" };

  const dict = await getDictionary(locale);
  const client = clientDict(dict);
  const t = dict.transferPage ?? {};
  // The smallest cheque, not the rate: "$7.50 Airport Transfer" is not a
  // price anybody pays.
  const fare = money(minimumFare(place.transfer.oneWay));

  return {
    title:
      t.metaTitle?.replace("{resort}", place.name).replace("{fare}", fare) ??
      `${fare} Airport Transfer to ${place.name}`,
    description:
      t.metaDescription
        ?.replace("{resort}", place.name)
        .replace("{fare}", fare)
        .replace("{roundTrip}", money(minimumFare(place.transfer.roundTrip))) ??
      `Private airport transfer from Montego Bay Sangster International (MBJ) to ${place.name}. ${fare} one way for up to ${MIN_BILLED_PAX} passengers, ${money(minimumFare(place.transfer.roundTrip))} round trip. Flight tracked, met inside arrivals.`,
    alternates: {
      canonical: localePath(locale, `/transfer/${placeKey}`),
      languages: languageAlternates(`/transfer/${placeKey}`),
    },
  };
}

export default async function TransferPage({ params }) {
  const { locale, place: placeKey } = await params;
  const place = getPlace(placeKey);
  if (!place?.transfer) notFound();

  const dict = await getDictionary(locale);
  const client = clientDict(dict);
  const t = dict.transferPage ?? {};
  // Per-head rates. `oneWayFare`/`roundTripFare` are what a party of four or
  // fewer actually hands over, which is what every sentence quoting a single
  // amount for the trip has to use.
  const { oneWay, roundTrip } = place.transfer;
  const oneWayFare = minimumFare(oneWay);
  const roundTripFare = minimumFare(roundTrip);

  // Nearby resorts served at the same kind of distance, for internal linking.
  const nearby = PLACES.filter(
    (p) => p.area === place.area && p.transfer && p.key !== place.key
  ).slice(0, 8);

  // Tours this guest can actually be quoted for, if their resort has a zone.
  const tours = place.zone
    ? TOURS.filter((tour) => tour.zones?.[place.zone] && tour.popular).slice(0, 3)
    : [];

  // The booking form treats a transfer as a tour-shaped record.
  const asTour = {
    id: `transfer-${place.key}`,
    title: `${t.transferTo ?? "Airport transfer to"} ${place.name}`,
    kind: "transfer",
    duration: "Door to door",
    place,
  };

  // The last breadcrumb crumb is the area label, which is plain text rather
  // than a link on the page; BreadcrumbList wants an item for it either way, so
  // it points at the transfers hub it belongs under.
  const abs = (path) => `${site.url}${localePath(locale, path)}`;
  const jsonLd = [
    transferSchema(
      place,
      abs(`/transfer/${place.key}`),
      site.url,
      `${t.transferTo ?? "Private airport transfer to"} ${place.name} from Sangster International Airport (MBJ). ${oneWay} USD per person one way with a ${MIN_BILLED_PAX}-person minimum (${oneWayFare} USD), ${roundTripFare} USD round trip.`
    ),
    breadcrumbSchema([
      { name: dict.nav?.home ?? "Home", url: abs("/") },
      { name: dict.nav?.transfers ?? "Airport transfers", url: abs("/transfers") },
      { name: getAreaLabel(place.area), url: abs("/transfers") },
      { name: place.name, url: abs(`/transfer/${place.key}`) },
    ]),
  ];

  const included = [
    { Icon: FaPlane, text: t.inc1 ?? "Met inside the arrivals hall with a name board" },
    { Icon: FaClock, text: t.inc2 ?? "Flight tracked — delays cost you nothing" },
    { Icon: FaCar, text: t.inc3 ?? "Private, air-conditioned vehicle, your group only" },
    { Icon: FaUserTie, text: t.inc4 ?? "Licensed, insured driver who handles the luggage" },
  ];

  return (
    <>
      <JsonLd data={jsonLd} />

      {/* Hero */}
      <section className="relative isolate -mt-[4.5rem] overflow-hidden bg-ink pb-12 pt-28 lg:-mt-20 lg:pb-16 lg:pt-36">
        <Image
          src="/ppp/donovan-airport-van.jpg"
          alt=""
          fill
          priority
          sizes="640px"
          className="scale-105 object-cover opacity-20 blur-sm"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-ink via-ink/90 to-ink/70"
        />

        <div className="shell relative">
          <nav aria-label="Breadcrumb" className="mb-5">
            <ol className="flex flex-wrap items-center gap-2 text-xs text-white/50">
              <li>
                <Link href={localePath(locale, "/")} className="transition hover:text-white">
                  {dict.nav?.home ?? "Home"}
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <FaChevronRight className="text-[0.5rem] opacity-50" />
                <Link
                  href={localePath(locale, "/transfers")}
                  className="transition hover:text-white"
                >
                  {dict.nav?.transfers ?? "Airport transfers"}
                </Link>
              </li>
              <li className="flex items-center gap-2 text-white/35">
                <FaChevronRight className="text-[0.5rem] opacity-50" />
                {getAreaLabel(place.area)}
              </li>
            </ol>
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-crimson-600/20 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-wider text-crimson-300">
              {dict.nav?.transfers ?? "Airport transfer"}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-white/60">
              <span className="flex text-gold-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <FaStar key={i} className="text-[0.6rem]" />
                ))}
              </span>
              {site.rating.score} · {site.rating.count} {dict.common?.reviews ?? "reviews"}
            </span>
          </div>

          <h1 className="mt-4 max-w-4xl font-display text-3xl font-semibold leading-[1.1] text-white sm:text-4xl lg:text-[3.25rem]">
            {t.h1?.replace("{resort}", place.name) ??
              `Private airport transfer to ${place.name}`}
          </h1>
          <p className="mt-4 max-w-2xl text-[1.05rem] leading-relaxed text-white/65">
            {t.intro
              ?.replace("{resort}", place.name)
              .replace("{fare}", money(oneWayFare))
              .replace("{perPerson}", money(oneWay))
              .replace("{capacity}", String(MIN_BILLED_PAX)) ??
              `From Sangster International (MBJ) to ${place.name} — ${money(oneWay)} per person one way. Your driver meets you inside arrivals with a name board and takes you straight there.`}
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <FarePill
              label={t.oneWay ?? "One way"}
              value={money(oneWay)}
              unit={dict.price?.perPerson ?? "/ person"}
              extra={`${t.minFrom ?? "from"} ${money(oneWayFare)}`}
            />
            <FarePill
              label={t.roundTrip ?? "Round trip"}
              value={money(roundTrip)}
              unit={dict.price?.perPerson ?? "/ person"}
              extra={`${t.minFrom ?? "from"} ${money(roundTripFare)}`}
              highlight
            />
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="shell py-12 lg:py-16">
        {/*
          On a phone the form comes first — the hero has already given the fare,
          so there is nothing the guest needs to read before booking. Explicit
          placement at lg keeps the desktop layout as it was: detail left, form
          sticky right. (`order` alone would reorder the desktop columns too.)
        */}
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-14">
          <div className="order-2 lg:order-none lg:col-start-1 lg:row-start-1">
            <h2 className="font-display text-2xl font-semibold text-ink">
              {t.whatYouGet ?? "What the fare covers"}
            </h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {included.map(({ Icon, text }) => (
                <li
                  key={text}
                  className="flex items-start gap-3 rounded-xl border border-ink/[0.07] bg-white p-4 shadow-card"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-crimson-50 text-crimson-600">
                    <Icon className="text-sm" />
                  </span>
                  <span className="text-sm leading-relaxed text-ink/75">{text}</span>
                </li>
              ))}
            </ul>

            {/*
              A seven-row party-size table used to sit here. It is gone for the
              same reason as the tour page's two: the booking form prices this
              guest's actual party live as they change the stepper, so the table
              was a slower way to read a number they were about to be shown —
              and at min-w-[26rem] it had to be scrolled sideways on a phone.
              The claim it carried is worth keeping, so the note stays.
            */}
            <p className="mt-8 flex items-start gap-2 text-sm leading-relaxed text-ink/55">
              <FaCheck className="mt-1 shrink-0 text-xs text-crimson-600" />
              {t.pricingNote ??
                "No fuel levy, no airport surcharge, no late-night premium. What you see is the whole fare."}
            </p>

            {nearby.length > 0 && (
              <div className="mt-10">
                <h2 className="font-display text-2xl font-semibold text-ink">
                  {t.nearby ?? "Other resorts we serve nearby"}
                </h2>
                <div className="mt-4 flex flex-wrap gap-2">
                  {nearby.map((p) => (
                    <Link
                      key={p.key}
                      href={localePath(locale, `/transfer/${p.key}`)}
                      className="rounded-full border border-ink/[0.09] bg-white px-3.5 py-2 text-sm text-ink/70 shadow-card transition hover:border-crimson-200 hover:text-crimson-700"
                    >
                      {p.name}{" "}
                      <span className="text-ink/40">
                        {money(minimumFare(p.transfer.oneWay))}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          <aside
            id="book"
            className="order-1 scroll-mt-24 lg:order-none lg:col-start-2 lg:row-start-1 lg:sticky lg:top-28 lg:self-start"
          >
            <BookingForm tour={asTour} locale={locale} dict={client} mode="transfer"
              /* Whether a card can actually be charged, asked of the server.
               * The form cannot work this out for itself: it knows the price
               * but not whether a payment provider is configured, and offering
               * a card option the server will refuse is worse than not
               * offering one. Read at build time, so adding the PayPal keys
               * to the environment needs a redeploy to take effect. */
              paymentsEnabled={paymentsConfigured("USD")}
              /* Inline card/PayPal buttons, so a guest without a
               * PayPal account can pay by card without leaving. */
              paypal={paypalPublicConfig("USD")}
            />
          </aside>
        </div>
      </section>

      {tours.length > 0 && (
        <section className="bg-sand py-16 lg:py-20">
          <div className="shell">
            <SectionHeading
              eyebrow={t.toursEyebrow ?? "While you're here"}
              title={
                t.toursTitle?.replace("{resort}", place.name) ??
                `Tours we run from ${place.name}`
              }
              description={
                t.toursDescription ??
                "Prices below are for your resort specifically — the transport, worked out for your group."
              }
              href={localePath(locale, "/tours")}
              linkLabel={dict.common?.seeAll ?? "See all"}
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {tours.map((tour) => (
                <TourCard
                  key={tour.id}
                  tour={{ ...tour, ...(dict.tours?.[tour.id] ?? {}) }}
                  locale={locale}
                  dict={client}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <StickyBookBar
        label={t.oneWay ?? "One way"}
        price={money(oneWay)}
        unit={dict.price?.perPerson ?? "/ person"}
        cta={dict.booking?.bookNow ?? "Book now"}
      />
    </>
  );
}
