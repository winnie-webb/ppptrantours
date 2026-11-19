import { notFound } from "next/navigation";
import { FaMapMarkerAlt } from "react-icons/fa";
import PageHeader from "@/app/components/PageHeader";
import TourGrid from "@/app/components/TourGrid";
import PolicyNote from "@/app/components/PolicyNote";
import CtaBand from "@/app/components/CtaBand";
import { TOURS } from "@/app/data/catalogue";
import { TOUR_ORIGINS, getTourOrigin } from "@/app/data/tour-origins";
import { LOCALES, localePath } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/dictionaries";
import { clientDict } from "@/app/i18n/client";
import { languageAlternates } from "../../../layout";

export function generateStaticParams() {
  return LOCALES.flatMap((l) =>
    TOUR_ORIGINS.map((o) => ({ locale: l.code, origin: o.slug }))
  );
}

export async function generateMetadata({ params }) {
  const { locale, origin } = await params;
  const o = getTourOrigin(origin);
  if (!o) return { title: "Not found" };
  const dict = await getDictionary(locale);
  const t = dict.tourOrigins?.[o.slug] ?? {};
  return {
    title: t.metaTitle ?? o.menu,
    description: t.metaDescription,
    alternates: {
      canonical: localePath(locale, `/tours/from/${o.slug}`),
      languages: languageAlternates(`/tours/from/${o.slug}`),
    },
  };
}

/**
 * Tours from one pickup point — a cruise port, or "your hotel".
 *
 * The owner wanted the menu to say where a tour starts (2026-11-18): a cruise
 * passenger looking for an excursion from Falmouth should land on Falmouth
 * prices, not on a hotel picker. A cruise-port page sets that pier as the
 * guest's pickup, so every price and booking form after it is from the pier.
 */
export default async function ToursFromPage({ params }) {
  const { locale, origin } = await params;
  const o = getTourOrigin(origin);
  if (!o) notFound();

  const dict = await getDictionary(locale);
  const client = clientDict(dict);
  const t = dict.tourOrigins?.[o.slug] ?? {};

  const tours = TOURS.map((tour) => ({
    ...tour,
    ...(dict.tours?.[tour.id] ?? {}),
  }));

  return (
    <>
      <PageHeader
        eyebrow={t.eyebrow ?? (o.place ? "Cruise excursions" : "Hotel pickup")}
        title={t.title ?? o.menu}
        description={t.description}
        image={o.image}
        locale={locale}
        homeLabel={dict.nav?.home ?? "Home"}
        breadcrumbs={[
          { label: dict.nav?.tours ?? "Tours", href: localePath(locale, "/tours") },
          { label: t.menu ?? o.menu },
        ]}
      />

      <section className="shell pt-8 pb-16 lg:pt-10 lg:pb-24">
        {t.pickupNote && (
          <p className="mb-6 flex items-start gap-2.5 text-[0.95rem] leading-relaxed text-ink/75">
            <FaMapMarkerAlt className="mt-1 shrink-0 text-crimson-600" aria-hidden />
            {t.pickupNote}
          </p>
        )}
        <PolicyNote locale={locale} dict={dict} className="mb-6" />
        <TourGrid
          tours={tours}
          locale={locale}
          dict={client}
          categoryFilter="chips"
          presetPlace={o.place}
          pickupLabel={t.pickupLabel}
          hotelsOnly={!o.place}
        />
      </section>

      <CtaBand locale={locale} dict={dict} />
    </>
  );
}
