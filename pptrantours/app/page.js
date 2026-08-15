import Link from "next/link";
import Hero from "./components/Hero";
import StatsBar from "./components/StatsBar";
import CategoryChips from "./components/CategoryChips";
import TourRail from "./components/TourRail";
import PromiseSection from "./components/PromiseSection";
import DestinationsGrid from "./components/DestinationsGrid";
import Testimonials from "./components/Testimonials";
import GallerySection from "./components/GallerySection";
import FaqAccordion from "./components/FaqAccordion";
import CtaBand from "./components/CtaBand";
import SectionHeading from "./components/SectionHeading";
import TourCard from "./components/TourCard";
import { filterProductByCategory, sortByPrice } from "./products/product";
import { faqs } from "./data/site";

export default function Home() {
  const popular = sortByPrice(filterProductByCategory("mpt"));
  const transfers = sortByPrice(filterProductByCategory("at"));
  const combos = sortByPrice(filterProductByCategory("ctp")).slice(0, 8);

  return (
    <>
      <Hero />
      <StatsBar />

      <TourRail
        eyebrow="Guest favourites"
        title="The tours people book twice."
        description="Dunn's River, the Blue Hole, Rick's Cafe at sunset — the days that end up in the photo album."
        href="/category/mpt"
        tours={popular}
      />

      <div className="shell">
        <div className="hairline" />
      </div>

      <TourRail
        eyebrow="Airport transfers"
        title="From Sangster to your front door."
        description="Flat rates to every resort area on the island. Flight tracked, driver waiting inside arrivals, luggage handled."
        href="/category/at"
        tours={transfers}
      />

      <PromiseSection />
      <CategoryChips />

      <div className="bg-sand py-16 lg:py-24">
        <div className="shell">
          <SectionHeading
            eyebrow="Two in one day"
            title="Combo packages, no rushing."
            description="Our most-requested build: pair two or three attractions into a single day and pay far less than booking them apart."
            href="/category/ctp"
          />
          <div className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
            {combos.slice(0, 4).map((tour) => (
              <TourCard
                key={tour.id}
                tour={tour}
                className="w-[19rem] shrink-0 snap-start sm:w-[21rem] lg:w-auto"
              />
            ))}
          </div>
        </div>
      </div>

      <DestinationsGrid />
      <Testimonials />
      <GallerySection />

      <div className="shell">
        <div className="hairline" />
      </div>

      <section className="shell py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
          <div>
            <SectionHeading
              eyebrow="Good to know"
              title="Questions we get asked most."
              description="Anything else, just message us — someone answers seven days a week."
            />
            <Link href="/contact-us" className="btn-primary">
              Ask us something
            </Link>
          </div>
          <FaqAccordion items={faqs.slice(0, 6)} />
        </div>
      </section>

      <CtaBand />
    </>
  );
}
