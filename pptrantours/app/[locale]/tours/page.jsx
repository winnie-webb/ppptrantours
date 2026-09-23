import PageHeader from "@/app/components/PageHeader";
import TourGrid from "@/app/components/TourGrid";
import CtaBand from "@/app/components/CtaBand";
import SloganBand from "@/app/components/SloganBand";
import { TOURS } from "@/app/data/catalogue";
import { LOCALES, localePath } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/dictionaries";
import JsonLd from "@/app/components/JsonLd";
import { site } from "@/app/data/site";
import { tourListSchema } from "@/app/data/schema";
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
      <JsonLd
        data={tourListSchema(site.url, (path) => localePath(locale, path))}
      />

      <PageHeader
        eyebrow={t.eyebrow ?? "The catalogue"}
        title={t.title ?? "Things to do in Jamaica."}
        description={
          t.description ??
          "Every tour we run, with the transport price from your resort. That price is ours alone — attraction admission is paid at the gate and we never touch it."
        }
        image="/local/hero-3.jpg"
        locale={locale}
        homeLabel={dict.nav?.home ?? "Home"}
        breadcrumbs={[{ label: t.crumb ?? "Things to do" }]}
      />

      {/*
        The "By parish" index of five tiles stood here.

        It linked away to /category/*, so narrowing the list cost a page load
        and a trip back — four page loads from the homepage to a booking. The
        same five choices are now chips on the grid below, filtering in place;
        the category pages they pointed at are still indexed, and the grid
        links to the active one.
      */}
      <section className="shell pb-16 lg:pb-24">
        <TourGrid
          tours={tours}
          locale={locale}
          dict={client}
          categoryFilter="chips"
        />
      </section>

      <CtaBand locale={locale} dict={dict} />
      <SloganBand dict={dict} />
    </>
  );
}
