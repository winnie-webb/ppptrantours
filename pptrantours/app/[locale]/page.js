import Link from "next/link";
import { FaArrowRight, FaPlane, FaCheck } from "react-icons/fa";
import Hero from "@/app/components/Hero";
import StatsBar from "@/app/components/StatsBar";
import TourRail from "@/app/components/TourRail";
import PromiseSection from "@/app/components/PromiseSection";
import Testimonials from "@/app/components/Testimonials";
import PhotoReel from "@/app/components/PhotoReel";
import FaqAccordion from "@/app/components/FaqAccordion";
import CtaBand from "@/app/components/CtaBand";
import SloganBand from "@/app/components/SloganBand";
import SectionHeading from "@/app/components/SectionHeading";
import TourCard from "@/app/components/TourCard";
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
        Running order, changed 2026-10-23.

        The page ran to about 19 phone screens, and the proof (the rating, the
        reviews) did not start until screen ten, after most phone visitors
        have gone. The stats now sit directly under the hero and three reviews
        follow the first rail of tours, so someone deciding is shown why to
        trust PPP while they are still deciding.

        The full transfer booking form is no longer embedded here: it repeated
        the one on /transfers and asked for a resort before the guest had
        chosen to book anything. TransferBand sends them there instead. The
        category tiles and destination tiles went the same way: they are
        navigation, and /tours and /destinations carry them in full.
      */}
      <Hero locale={locale} dict={dict} />

      <StatsBar dict={dict} />

      <TourRail
        title={t.popularTitle ?? "The tours people book twice."}
        description={
          t.popularDescription ??
          "Dunn's River, the Blue Hole, Rick's Cafe at sunset — the days that end up in the photo album."
        }
        href={localePath(locale, "/category/popular")}
        linkLabel={dict.common?.bookTourNow ?? "Book a Tour Now"}
        tours={popular}
        locale={locale}
        dict={client}
      />

      <Testimonials dict={dict} limit={3} />

      <TransferBand locale={locale} dict={dict} />

      <div className="pb-16 lg:pb-24">
        <div className="shell">
          <SectionHeading
            title={t.combosTitle ?? "Combo packages, no rushing."}
            description={
              t.combosDescription ??
              "Most of our combo tours are in the same region, no more than a 20–30 minute drive apart, so you can do both in one day and we only charge a little more for the transport and the waiting."
            }
            href={localePath(locale, "/category/combos")}
            linkLabel={dict.common?.bookTourNow ?? "Book a Tour Now"}
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

      {/* Guests in PPP gear — the visual break between product and reading. */}
      <PhotoReel dict={dict} />

      {/* The owner's own transparency pitch */}
      <TransparencyBand locale={locale} dict={dict} />

      <PromiseSection locale={locale} dict={dict} />

      <section className="shell py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div>
            <SectionHeading
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
 * Airport transfers, as a pitch rather than a form.
 *
 * The three points answer what an arriving guest actually worries about:
 * will they be there, where do I find them, how do I pay. The meeting point
 * is the corrected one (outside, Column E or F; see 4645b51). The price waits
 * for /transfers, where choosing the resort produces it.
 */
function TransferBand({ locale, dict }) {
  const t = dict.home ?? {};
  const points = [
    t.transferPointFlight ?? "Flight tracked, so a delay never leaves you waiting.",
    t.transferPointMeet ??
      "Your driver meets you at the curb outside arrivals, Column E or F, with a PPP sign.",
    t.transferPointCash ?? "Pay the driver in cash, in US dollars.",
  ];

  return (
    <section className="shell py-16 lg:py-24">
      <div className="rounded-3xl bg-sand px-6 py-10 sm:px-10 lg:grid lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-16 lg:px-14 lg:py-14">
        <div>
          <h2 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-[2.5rem]">
            {t.transfersTitle ?? "From Sangster to your front door."}
          </h2>
          <p className="mt-3.5 text-[1.05rem] leading-relaxed text-ink/60">
            {t.transfersDescription ??
              "Private transfers from Montego Bay airport to every major resort. Choose yours on the next page and see the exact fare."}
          </p>
          <Link href={localePath(locale, "/transfers")} className="btn-primary mt-7">
            <FaPlane className="text-xs" />
            {dict.common?.bookTransferNow ?? "Book a Transfer Now"}
          </Link>
        </div>
        <ul className="mt-8 space-y-4 lg:mt-0">
          {points.map((point) => (
            <li key={point} className="flex gap-3 text-[1.02rem] leading-relaxed text-ink/80">
              <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-crimson-600 text-white">
                <FaCheck className="text-[0.6rem]" />
              </span>
              {point}
            </li>
          ))}
        </ul>
      </div>
    </section>
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
        <h2 className="font-display text-3xl font-semibold leading-tight text-ink sm:text-[2.5rem]">
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
            {dict.common?.bookComboNow ?? "Book a Combo Tour Now"}
            <FaArrowRight className="text-xs" />
          </Link>
          <Link href={localePath(locale, "/transfers")} className="btn-ghost">
            <FaPlane className="text-xs" />
            {dict.common?.bookTransferNow ?? "Book a Transfer Now"}
          </Link>
        </div>
      </div>
    </section>
  );
}
