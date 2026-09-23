import { notFound, redirect } from "next/navigation";
import PageHeader from "@/app/components/PageHeader";
import TourGrid from "@/app/components/TourGrid";
import CtaBand from "@/app/components/CtaBand";
import SloganBand from "@/app/components/SloganBand";
import ComboPitch from "@/app/components/ComboPitch";
import {
  CATEGORIES,
  getCategory,
  filterProductByCategory,
} from "@/app/products/product";
import { LOCALES, localePath } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/dictionaries";
import { clientDict } from "@/app/i18n/client";
import { languageAlternates } from "../../layout";

/** Banner image per category. Copy lives in the dictionaries. */
const IMAGES = {
  popular: "/ppp/banner-ricks-cafe.jpg",
  combos: "/local/hero-7.jpg",
  "montego-bay": "/local/hero-1.jpg",
  "ocho-rios": "/local/hero-3.jpg",
  falmouth: "/local/hero-6.jpg",
  negril: "/local/hero-4.jpg",
  "south-coast": "/local/hero-7.jpg",
};

export function generateStaticParams() {
  return LOCALES.flatMap((l) =>
    CATEGORIES.filter((c) => c.type !== "transfers").map((c) => ({
      locale: l.code,
      type: c.type,
    }))
  );
}

export async function generateMetadata({ params }) {
  const { locale, type } = await params;
  const category = getCategory(type);
  if (!category) return { title: "Not found" };

  const dict = await getDictionary(locale);
  const copy = dict.categories?.[type] ?? {};

  return {
    title: copy.title ?? category.title,
    description: copy.blurb,
    alternates: {
      canonical: localePath(locale, `/category/${type}`),
      languages: languageAlternates(`/category/${type}`),
    },
  };
}

export default async function CategoryPage({ params }) {
  const { locale, type } = await params;

  // Transfers have their own page with a fare calculator on it.
  if (type === "transfers") redirect(localePath(locale, "/transfers"));

  const category = getCategory(type);
  if (!category) notFound();

  const dict = await getDictionary(locale);
  const client = clientDict(dict);
  const copy = dict.categories?.[type] ?? {};
  const t = dict.categoryPage ?? {};

  const tours = filterProductByCategory(type).map((tour) => ({
    ...tour,
    ...(dict.tours?.[tour.id] ?? {}),
  }));

  return (
    <>
      <PageHeader
        eyebrow={category.parish ?? t.eyebrow ?? "Browse"}
        title={copy.title ?? category.title}
        description={copy.blurb}
        image={IMAGES[type] ?? "/local/hero-2.jpg"}
        locale={locale}
        homeLabel={dict.nav?.home ?? "Home"}
        breadcrumbs={[
          { label: dict.nav?.tours ?? "Things to do", href: localePath(locale, "/tours") },
          { label: copy.short ?? category.short },
        ]}
      />

      {type === "combos" && <ComboPitch locale={locale} dict={dict} />}

      <section className="shell py-14 lg:py-20">
        <TourGrid
          tours={tours}
          locale={locale}
          dict={client}
          categoryFilter="none"
        />
      </section>

      <CtaBand locale={locale} dict={dict} />
      <SloganBand dict={dict} />
    </>
  );
}
