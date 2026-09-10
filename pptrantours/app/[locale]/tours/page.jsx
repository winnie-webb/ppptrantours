import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";
import PageHeader from "@/app/components/PageHeader";
import TourGrid from "@/app/components/TourGrid";
import PlacePrompt from "@/app/components/PlacePrompt";
import CtaBand from "@/app/components/CtaBand";
import SloganBand from "@/app/components/SloganBand";
import SectionHeading from "@/app/components/SectionHeading";
import { TOURS } from "@/app/data/catalogue";
import { PARISH_CATEGORIES, filterProductByCategory } from "@/app/products/product";
import { LOCALES, localePath } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/dictionaries";
import { clientDict } from "@/app/i18n/client";
import { languageAlternates } from "../layout";

export function generateStaticParams() {
  return LOCALES.map((l) => ({ locale: l.code }));
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const t = dict.toursPage ?? {};

  return {
    title: t.metaTitle ?? "Things to do in Jamaica",
    description: t.metaDescription,
    alternates: {
      canonical: localePath(locale, "/tours"),
      languages: languageAlternates("/tours"),
    },
  };
}

/**
 * "Things to do in Jamaica", with a parish index above the grid.
 *
 * The heading and the parish sub-headings are the wording Mr. Pugh asked for on
 * 2026-09-06, and the reasoning was his: people search for "things to do in
 * Negril", not for "Negril excursion catalogue".
 */
export default async function ToursPage({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const client = clientDict(dict);
  const t = dict.toursPage ?? {};

  const tours = TOURS.map((tour) => ({
    ...tour,
    ...(dict.tours?.[tour.id] ?? {}),
  }));

  return (
    <>
      <PageHeader
        eyebrow={t.eyebrow ?? "The catalogue"}
        title={t.title ?? "Things to do in Jamaica."}
        description={
          t.description ??
          "Every tour we run, with the transport price and the gate fee shown separately so you can see exactly what is ours and what is the attraction's."
        }
        image="/local/hero-3.jpg"
        locale={locale}
        homeLabel={dict.nav?.home ?? "Home"}
        breadcrumbs={[{ label: t.crumb ?? "Things to do" }]}
      />

      <PlacePrompt dict={client} />

      {/* Parish index */}
      <section className="shell py-12 lg:py-16">
        <SectionHeading
          eyebrow={t.parishEyebrow ?? "By parish"}
          title={t.parishTitle ?? "Pick a corner of the island."}
          description={
            t.parishDescription ??
            "We are based in Montego Bay and run to all of it. These are the days we run most."
          }
        />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {PARISH_CATEGORIES.map((c) => {
            const count = filterProductByCategory(c.type).length;
            return (
              <Link
                key={c.type}
                href={localePath(locale, `/category/${c.type}`)}
                className="group rounded-2xl border border-ink/[0.07] bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-crimson-200 hover:shadow-lift"
              >
                <p className="font-display text-lg font-semibold leading-snug text-ink transition-colors group-hover:text-crimson-700">
                  {dict.categories?.[c.type]?.short ?? c.short}
                </p>
                <p className="mt-1 text-xs text-ink/45">{c.parish}</p>
                <p className="mt-4 flex items-center gap-2 text-xs font-semibold text-crimson-700">
                  {count} {count === 1 ? t.tour ?? "tour" : t.toursWord ?? "tours"}
                  <FaArrowRight className="text-[0.6rem] transition-transform group-hover:translate-x-1" />
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="shell pb-16 lg:pb-24">
        <TourGrid tours={tours} locale={locale} dict={client} />
      </section>

      <CtaBand locale={locale} dict={dict} />
      <SloganBand dict={dict} />
    </>
  );
}
