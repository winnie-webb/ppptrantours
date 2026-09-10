import PageHeader from "@/app/components/PageHeader";
import DestinationsGrid from "@/app/components/DestinationsGrid";
import TourRail from "@/app/components/TourRail";
import CtaBand from "@/app/components/CtaBand";
import SloganBand from "@/app/components/SloganBand";
import PlacePrompt from "@/app/components/PlacePrompt";
import { filterProductByCategory, sortByPrice } from "@/app/products/product";
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
  const client = clientDict(dict);
  const t = dict.destinationsPage ?? {};

  return {
    title: t.metaTitle ?? "Destinations",
    description: t.metaDescription,
    alternates: {
      canonical: localePath(locale, "/destinations"),
      languages: languageAlternates("/destinations"),
    },
  };
}

export default async function DestinationsPage({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const client = clientDict(dict);
  const t = dict.destinationsPage ?? {};

  const popular = sortByPrice(filterProductByCategory("popular")).map((tour) => ({
    ...tour,
    ...(dict.tours?.[tour.id] ?? {}),
  }));

  return (
    <>
      <PageHeader
        eyebrow={t.eyebrow ?? "Where we go"}
        title={t.title ?? "One island, five bases, every parish."}
        description={
          t.description ??
          "We run out of Montego Bay and reach the whole island. Pick a coast — we'll get you there and back the same day, at your pace."
        }
        image="/ppp/banner-fisherman-mobay.jpg"
        locale={locale}
        homeLabel={dict.nav?.home ?? "Home"}
        breadcrumbs={[{ label: t.crumb ?? "Destinations" }]}
      />

      <PlacePrompt dict={client} />

      <DestinationsGrid heading={false} locale={locale} dict={dict} />

      <div className="shell">
        <div className="hairline" />
      </div>

      <TourRail
        eyebrow={t.startEyebrow ?? "Start here"}
        title={t.startTitle ?? "The tours we'd book first."}
        description={
          t.startDescription ??
          "If it's your first time on the island, these are the days that make the trip."
        }
        href={localePath(locale, "/tours")}
        linkLabel={dict.common?.seeAll ?? "See all"}
        tours={popular}
        locale={locale}
        dict={client}
      />

      <CtaBand locale={locale} dict={dict} />
      <SloganBand dict={dict} />
    </>
  );
}
