import Link from "next/link";
import { FaArrowRight, FaPlane } from "react-icons/fa";
import Hero from "@/app/components/Hero";
import StatsBar from "@/app/components/StatsBar";
import CategoryChips from "@/app/components/CategoryChips";
import TourRail from "@/app/components/TourRail";
import PromiseSection from "@/app/components/PromiseSection";
import DestinationsGrid from "@/app/components/DestinationsGrid";
import Testimonials from "@/app/components/Testimonials";
import GallerySection from "@/app/components/GallerySection";
import FaqAccordion from "@/app/components/FaqAccordion";
import CtaBand from "@/app/components/CtaBand";
import SloganBand from "@/app/components/SloganBand";
import SectionHeading from "@/app/components/SectionHeading";
import TourCard from "@/app/components/TourCard";
import FareCalculator from "@/app/components/FareCalculator";
import { filterProductByCategory, sortByPrice } from "@/app/products/product";
import { localePath, LOCALES } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/dictionaries";
import { clientDict } from "@/app/i18n/client";

export function generateStaticParams() {
  return LOCALES.map((l) => ({ locale: l.code }));
}

/** Overlay the locale's tour copy onto the catalogue record. */
function localize(list, dict) {
  return list.map((tour) => ({ ...tour, ...(dict.tours?.[tour.id] ?? {}) }));
}

export default async function Home({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const client = clientDict(dict);
  const t = dict.home ?? {};

  const popular = localize(sortByPrice(filterProductByCategory("popular")), dict);
  const combos = localize(sortByPrice(filterProductByCategory("combos")), dict);

  return (
    <>
      {/*
        Running order, changed 2026-09-20.

        The product used to be the fourth thing on the page: a 672px hero, a
        stats band and a full-width "where are you staying?" question stood
        ahead of it, putting the first bookable card about 1,200px down — two
        and a half screens on the iPhone most guests browse on. Nothing has been
        cut except that question band; the gallery, promise, testimonials, FAQ
        and destination tiles all still run below, where they do their work for
        someone who is reading rather than buying.

        PlacePrompt is gone rather than moved. It asked for a resort before
        showing anything worth choosing; the hotel search now lives on the
        tour list and inside the booking form — which is where the answer
        actually changes a price.
      */}
      <Hero locale={locale} dict={dict} />

      <TourRail
        eyebrow={t.popularEyebrow ?? "Guest favourites"}
        title={t.popularTitle ?? "The tours people book twice."}
        description={
          t.popularDescription ??
          "Dunn's River, the Blue Hole, Rick's Cafe at sunset — the days that end up in the photo album."
        }
        href={localePath(locale, "/category/popular")}
        linkLabel={dict.common?.seeAll ?? "See all"}
        tours={popular}
        locale={locale}
        dict={client}
      />

      {/* Browse the rest, straight under the rail it continues. */}
      <CategoryChips locale={locale} dict={dict} />

      {/* Airport fare calculator */}
      <section className="bg-sand py-16 lg:py-24">
        <div className="shell">
          <SectionHeading
            eyebrow={t.transfersEyebrow ?? "Airport transfers"}
            title={t.transfersTitle ?? "From Sangster to your front door."}
            description={
              t.transfersDescription ??
              "Pick your resort and see the exact fare — one flat price for up to four people, flight tracked, driver waiting inside arrivals."
            }
            href={localePath(locale, "/transfers")}
            linkLabel={t.allRates ?? "All rates"}
          />
          <FareCalculator locale={locale} dict={client} />
        </div>
      </section>

      {/* Combos — white, so it reads as its own section rather than running
          into the sand block the fare calculator now sits directly above. */}
      <div className="py-16 lg:py-24">
        <div className="shell">
          <SectionHeading
            eyebrow={t.combosEyebrow ?? "Two in one day"}
            title={t.combosTitle ?? "Combo packages, no rushing."}
            description={
              t.combosDescription ??
              "Most of our combo tours are in the same region, no more than a 20–30 minute drive apart, so you can do both in one day and we only charge a little more for the transport and the waiting."
            }
            href={localePath(locale, "/category/combos")}
            linkLabel={dict.common?.seeAll ?? "See all"}
          />
          <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
            {combos.slice(0, 4).map((tour) => (
              <TourCard
                key={tour.id}
                tour={tour}
                locale={locale}
                dict={client}
                className="w-[19rem] shrink-0 snap-start sm:w-[21rem] lg:w-auto"
              />
            ))}
          </div>
        </div>
      </div>

      {/* The owner's own transparency pitch */}
      <TransparencyBand locale={locale} dict={dict} />

      {/* Brand promise reads better after the product than ahead of it. */}
      <PromiseSection locale={locale} dict={dict} />

      {/* The stats support the reviews, so they sit together — both bg-sand,
          so the pair reads as one block rather than two. */}
      <StatsBar dict={dict} />
      <Testimonials dict={dict} />

      <GallerySection dict={client} />
      <DestinationsGrid locale={locale} dict={dict} />

      <div className="shell">
        <div className="hairline" />
      </div>

      <section className="shell py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div>
            <SectionHeading
              eyebrow={t.faqEyebrow ?? "Good to know"}
              title={t.faqTitle ?? "Questions we get asked most."}
              description={
                t.faqDescription ??
                "Anything else, just message us — someone answers seven days a week."
              }
            />
            <Link href={localePath(locale, "/contact-us")} className="btn-primary">
              {t.askUs ?? "Ask us something"}
            </Link>
          </div>
          <FaqAccordion items={(dict.faqs ?? []).slice(0, 6)} />
        </div>
      </section>

      <CtaBand locale={locale} dict={dict} />
      <SloganBand dict={dict} />
    </>
  );
}

/**
 * Mr. Pugh's own words on how PPP prices things (supplied 2026-09-03), kept as
 * close to verbatim as the layout allows. This is the company's central claim —
 * that the transport price is the whole of what PPP charges — so it sits on the
 * homepage rather than being buried in an FAQ.
 */
function TransparencyBand({ locale, dict }) {
  const t = dict.transparency ?? {};

  return (
    <section className="shell py-16 lg:py-24">
      <div className="mx-auto max-w-3xl text-center">
        <p className="eyebrow">{t.eyebrow ?? "No hidden fees"}</p>
        <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-ink sm:text-[2.5rem]">
          {t.title ?? "We keep it real. Always transparent."}
        </h2>
        <p className="mt-6 text-[1.08rem] leading-relaxed text-ink/70">
          {t.body ??
            "PPP Tran Tours Jamaica is a trustworthy private transportation company that believes in no hidden fees. While giving you the flexibility to personalize your movements, we also let you know how much everything associated with your day trip will cost — so you always know what to expect, and how much cash to walk with if necessary. We never resell or hike up costs on activities, entry fees or meals."}
        </p>
        <p className="mt-5 text-[1.08rem] font-semibold leading-relaxed text-ink">
          {t.groups ?? "Accommodations for any size group, big or small."}
        </p>

        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href={localePath(locale, "/category/combos")} className="btn-primary">
            {t.seeCombos ?? "See the combo packages"}
            <FaArrowRight className="text-xs" />
          </Link>
          <Link href={localePath(locale, "/transfers")} className="btn-ghost">
            <FaPlane className="text-xs" />
            {t.seeRates ?? "See every transfer rate"}
          </Link>
        </div>
      </div>
    </section>
  );
}
