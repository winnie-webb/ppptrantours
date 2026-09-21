import { paymentsConfigured, paypalPublicConfig } from "@/lib/payments";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FaCheck,
  FaClock,
  FaCar,
  FaUserTie,
  FaMapMarkerAlt,
  FaStar,
  FaChevronRight,
} from "react-icons/fa";
import { TOURS } from "@/app/data/catalogue";
import { filterProductById, getRelatedProducts } from "@/app/products/product";
import { money } from "@/app/products/pricing";
import { site } from "@/app/data/site";
import BookingForm from "@/app/components/BookingForm";
import FarePill from "@/app/components/FarePill";
import StickyBookBar from "@/app/components/StickyBookBar";
import TourCard from "@/app/components/TourCard";
import SectionHeading from "@/app/components/SectionHeading";
import JsonLd from "@/app/components/JsonLd";
import { LOCALES, localePath } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/dictionaries";
import { breadcrumbSchema, tourSchema } from "@/app/data/schema";
import { clientDict } from "@/app/i18n/client";
import { languageAlternates } from "../../layout";

export function generateStaticParams() {
  return LOCALES.flatMap((l) => TOURS.map((t) => ({ locale: l.code, id: t.id })));
}

export async function generateMetadata({ params }) {
  const { locale, id } = await params;
  const tour = filterProductById(id);
  if (!tour) return { title: "Tour not found" };

  const dict = await getDictionary(locale);
  const copy = dict.tours?.[id] ?? {};
  const title = copy.title ?? tour.title;
  const desc = copy.desc ?? tour.desc;

  return {
    title,
    description: desc.slice(0, 155),
    alternates: {
      canonical: localePath(locale, `/tour/${id}`),
      languages: languageAlternates(`/tour/${id}`),
    },
    /*
     * Next replaces `openGraph` wholesale rather than merging it, so the
     * type/locale/siteName/url that `[locale]/layout.js` sets are gone unless
     * they are repeated here — same trap as `alternates.languages` above.
     */
    openGraph: {
      title,
      description: desc.slice(0, 155),
      type: "article",
      locale,
      siteName: site.legalName,
      url: localePath(locale, `/tour/${id}`),
      images: [tour.image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: desc.slice(0, 155),
      images: [tour.image],
    },
  };
}

export default async function TourPage({ params }) {
  const { locale, id } = await params;
  const base = filterProductById(id);
  if (!base || base.kind === "transfer") notFound();

  const dict = await getDictionary(locale);
  const client = clientDict(dict);
  const copy = dict.tours?.[id] ?? {};

  // Translated copy overlays the catalogue record, so prices and structure
  // stay single-sourced while the words change per locale.
  const tour = {
    ...base,
    title: copy.title ?? base.title,
    subtitle: copy.subtitle ?? base.subtitle,
    desc: copy.desc ?? base.desc,
    highlights: copy.highlights ?? base.highlights,
  };

  const t = dict.tourPage ?? {};
  const related = getRelatedProducts(base, 3);
  const hasEntry =
    (base.entry?.components ?? []).length > 0 ||
    (base.entry?.addons ?? []).length > 0;

  // The headline "from" figure for the hero, so the page answers "how much?"
  // before the guest scrolls or opens the resort picker. Same floor as the one
  // the cards sort on (sortByPrice in app/products/product.js): the cheapest
  // published per-head rate. It is the rate itself, not a total divided by an
  // assumed party — so the hero, the card and the booking form all agree.
  const bands = Object.values(base.zones ?? {});
  const fromPerPerson = bands.length
    ? Math.min(...bands.map((b) => b.rate))
    : null;

  // Mirrors the visible breadcrumb below, one for one. Absolute URLs, as
  // BreadcrumbList requires.
  const abs = (path) => `${site.url}${localePath(locale, path)}`;
  const jsonLd = [
    tourSchema(
      tour,
      abs(`/tour/${id}`),
      site.url,
      tour.title,
      (tour.desc ?? "").slice(0, 300)
    ),
    breadcrumbSchema([
      { name: dict.nav?.home ?? "Home", url: abs("/") },
      { name: dict.nav?.tours ?? "Things to do", url: abs("/tours") },
      {
        name: dict.categories?.[base.region]?.title ?? base.region,
        url: abs(`/category/${base.region}`),
      },
      { name: tour.title, url: abs(`/tour/${id}`) },
    ]),
  ];

  const included = [
    { Icon: FaCar, text: t.inc1 ?? "Private air-conditioned vehicle, yours alone" },
    { Icon: FaUserTie, text: t.inc2 ?? "Licensed, insured local driver and guide" },
    { Icon: FaMapMarkerAlt, text: t.inc3 ?? "Pickup and drop-off at your door" },
    { Icon: FaClock, text: t.inc4 ?? "No fixed departure — you set the pace" },
  ];

  return (
    <>
      <JsonLd data={jsonLd} />

      {/* Hero */}
      <section className="relative isolate -mt-[4.5rem] overflow-hidden bg-ink pb-12 pt-28 lg:-mt-20 lg:pb-16 lg:pt-40">
        {/*
          A fixed 640px `sizes` rather than 100vw. This is the same photo as the
          figure below, rendered blurred at 25% opacity, so nothing above 640
          survives the blur — and asking for 100vw made the hero fetch a second
          full-width variant of an image the page already loads sharp.
        */}
        <Image
          src={tour.image}
          alt=""
          fill
          priority
          sizes="640px"
          className="scale-105 object-cover opacity-25 blur-sm"
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
                  href={localePath(locale, "/tours")}
                  className="transition hover:text-white"
                >
                  {dict.nav?.tours ?? "Things to do"}
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <FaChevronRight className="text-[0.5rem] opacity-50" />
                <Link
                  href={localePath(locale, `/category/${base.region}`)}
                  className="transition hover:text-white"
                >
                  {dict.categories?.[base.region]?.title ?? base.region}
                </Link>
              </li>
            </ol>
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-crimson-600/20 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-wider text-crimson-300">
              {base.kind === "combo"
                ? dict.categories?.combos?.short ?? "Combo"
                : dict.categories?.[base.region]?.short ?? base.region}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-white/60">
              <span className="flex text-gold-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <FaStar key={i} className="text-[0.6rem]" />
                ))}
              </span>
              {site.rating.score} · {site.rating.count}{" "}
              {dict.common?.reviews ?? "reviews"}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-white/60">
              <FaClock className="text-[0.65rem]" />
              {dict.durations?.[base.duration] ?? base.duration}
            </span>
          </div>

          <h1 className="mt-4 max-w-4xl font-display text-3xl font-semibold leading-[1.1] text-white sm:text-4xl lg:text-[3.25rem]">
            {tour.title}
          </h1>
          {tour.subtitle && (
            <p className="mt-2 text-sm font-medium text-white/50">{tour.subtitle}</p>
          )}

          {/* Answer "how much?" here, not in a table further down. */}
          {fromPerPerson != null && (
            <div className="mt-7 flex flex-wrap gap-3">
              <FarePill
                label={dict.price?.from ?? "From"}
                value={money(fromPerPerson)}
                unit={dict.price?.perPerson ?? "/ person"}
                highlight
              />
            </div>
          )}
        </div>
      </section>

      {/* Body */}
      <section className="shell py-12 lg:py-16">
        {/*
          Three grid children rather than two, so the form can sit between the
          photo and the prose on a phone. Below lg the grid is one column and
          `order` decides: photo, form, then everything else. At lg the explicit
          row/column placement puts it back to photo-over-prose on the left with
          the form sticky in the right rail, which is what it always was.
        */}
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-14">
          <figure className="order-1 relative aspect-[16/10] overflow-hidden rounded-2xl bg-ink/5 shadow-card lg:col-start-1 lg:row-start-1">
            <Image
              src={tour.image}
              alt={tour.title}
              fill
              sizes="(max-width: 1024px) 100vw, 62vw"
              className="object-cover"
            />
          </figure>

          <div className="order-3 lg:col-start-1 lg:row-start-2">
            <div>
              <h2 className="font-display text-2xl font-semibold text-ink">
                {t.about ?? "About this tour"}
              </h2>
              <p className="mt-4 text-[1.05rem] leading-relaxed text-ink/70">
                {tour.desc}
              </p>
            </div>

            {/* Highlights */}
            <div className="mt-10">
              <h2 className="font-display text-2xl font-semibold text-ink">
                {t.highlights ?? "Highlights"}
              </h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {tour.highlights.map((h) => (
                  <li
                    key={h}
                    className="flex items-start gap-3 rounded-xl border border-ink/[0.07] bg-white p-4 shadow-card"
                  >
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-crimson-100 text-[0.6rem] text-crimson-700">
                      <FaCheck />
                    </span>
                    <span className="text-sm leading-relaxed text-ink/75">{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Included */}
            <div className="mt-10">
              <h2 className="font-display text-2xl font-semibold text-ink">
                {t.included ?? "What's included"}
              </h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {included.map(({ Icon, text }) => (
                  <li key={text} className="flex items-center gap-3 text-sm text-ink/75">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-crimson-50 text-crimson-600">
                      <Icon className="text-sm" />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            {/*
              Two price tables used to sit here — transport by resort zone, and
              the gate-fee schedule. They are gone deliberately. The booking form
              works out this guest's own price live and itemises the gate fees
              they actually chose, so the tables restated the same numbers in a
              form that was harder to read and, at min-w-[30rem] against a 390px
              phone, had to be scrolled sideways to read at all. The one claim
              worth keeping is the transparency one, and it belongs next to the
              price rather than five screens below it.
            */}
            <p className="mt-8 flex items-start gap-2 text-sm leading-relaxed text-ink/55">
              <FaCheck className="mt-1 shrink-0 text-xs text-crimson-600" />
              {hasEntry
                ? t.entryTableNote ??
                  "Gate fees are paid at the attraction on the day. We never resell them or add anything to them."
                : t.noEntry ?? "Nothing. There is no gate fee on this one."}
            </p>

            {base.entry?.note && (
              <p className="mt-3 text-sm leading-relaxed text-ink/55">
                {base.entry.note}
              </p>
            )}
          </div>

          {/* Booking rail — second on a phone, sticky right column at lg */}
          <aside
            id="book"
            className="order-2 scroll-mt-24 lg:order-none lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:sticky lg:top-28 lg:self-start"
          >
            <BookingForm tour={tour} locale={locale} dict={client} mode="tour"
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

      {related.length > 0 && (
        <section className="bg-sand py-16 lg:py-20">
          <div className="shell">
            <SectionHeading
              eyebrow={t.alsoLike ?? "You might also like"}
              title={
                dict.categories?.[base.region]?.title ?? t.moreTours ?? "More tours"
              }
              href={localePath(locale, `/category/${base.region}`)}
              linkLabel={dict.common?.seeAll ?? "See all"}
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <TourCard
                  key={r.id}
                  tour={{ ...r, ...(dict.tours?.[r.id] ?? {}) }}
                  locale={locale}
                  dict={client}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {fromPerPerson != null && (
        <StickyBookBar
          label={dict.price?.from ?? "From"}
          price={money(fromPerPerson)}
          unit={dict.price?.perPerson ?? "/ person"}
          cta={dict.booking?.bookNow ?? "Book now"}
        />
      )}
    </>
  );
}
