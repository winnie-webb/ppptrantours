import { notFound } from "next/navigation";
import PageHeader from "@/app/components/PageHeader";
import TourGrid from "@/app/components/TourGrid";
import CtaBand from "@/app/components/CtaBand";
import {
  CATEGORIES,
  filterProductByCategory,
  getCategoryTitle,
} from "@/app/products/product";

/** Editorial intro + banner image per category. */
const CATEGORY_META = {
  mpt: {
    image: "/local/hero-5.jpg",
    blurb:
      "The routes we run most often, because they are the ones people ask for by name. Dunn's River, the Blue Hole, Rick's Cafe at sunset.",
  },
  at: {
    image: "/local/hero-1.jpg",
    blurb:
      "Flat-rate private transfers from Sangster and Norman Manley to every resort area on the island. We track your flight and meet you inside arrivals.",
  },
  ctp: {
    image: "/local/hero-7.jpg",
    blurb:
      "Two or three attractions in one day, priced well below booking them separately. This is what we're known for.",
  },
  abc: {
    image: "/local/hero-4.jpg",
    blurb:
      "Waterfalls, caves, beaches and great houses. The single-attraction days, with a driver who waits and a schedule you set.",
  },
  cse: {
    image: "/local/hero-6.jpg",
    blurb:
      "Built around your ship's clock. We collect you at the Falmouth or Montego Bay pier and have you back with time to spare.",
  },
  edt: {
    image: "/local/hero-8.jpg",
    blurb:
      "Jerk pits, seafood shacks and the restaurants locals actually eat at. Your driver waits while you take your time.",
  },
  egt: {
    image: "/local/hero-2.jpg",
    blurb:
      "Transport to Jamaica's championship courses, clubs in the back and a driver on call when the round runs long.",
  },
  ncb: {
    image: "/local/hero-8.jpg",
    blurb:
      "Late-night runs to the gaming lounges, waterfront bars and Friday night parties. A sober driver, waiting whenever you're done.",
  },
  st: {
    image: "/local/hero-1.jpg",
    blurb:
      "Craft markets, duty-free strips and malls, with someone to hold the bags and tell you what a fair price looks like.",
  },
};

export function generateStaticParams() {
  return CATEGORIES.map((c) => ({ type: c.type }));
}

export async function generateMetadata({ params }) {
  const { type } = await params;
  const title = getCategoryTitle(type);
  return {
    title,
    description: CATEGORY_META[type]?.blurb ?? `${title} with PPP Tran Tours Jamaica.`,
  };
}

export default async function CategoryPage({ params }) {
  const { type } = await params;
  const tours = filterProductByCategory(type);

  if (tours.length === 0) notFound();

  const meta = CATEGORY_META[type] ?? {};

  return (
    <>
      <PageHeader
        eyebrow={`${tours.length} option${tours.length === 1 ? "" : "s"}`}
        title={getCategoryTitle(type)}
        description={meta.blurb}
        image={meta.image ?? "/local/hero-2.jpg"}
        breadcrumbs={[
          { label: "Tours", href: "/tours" },
          { label: getCategoryTitle(type) },
        ]}
      />

      <section className="shell py-14 lg:py-20">
        <TourGrid tours={tours} showCategoryFilter={false} />
      </section>

      <CtaBand />
    </>
  );
}
