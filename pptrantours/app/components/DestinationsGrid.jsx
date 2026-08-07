import Link from "next/link";
import Image from "next/image";
import { FaArrowRight } from "react-icons/fa";
import { destinations } from "../data/site";
import SectionHeading from "./SectionHeading";

/**
 * Editorial mosaic: the first destination takes a double-height feature tile,
 * the rest fill in around it.
 */
export default function DestinationsGrid({ heading = true }) {
  return (
    <section className="shell py-16 lg:py-24">
      {heading && (
        <SectionHeading
          eyebrow="Where we go"
          title="Every parish worth the drive."
          description="We cover the whole island from our base in Montego Bay — pick a coast and we'll get you there and back the same day."
          href="/tours"
          linkLabel="Browse tours"
        />
      )}

      {/* 5 tiles: the feature spans 2×2 and the other four fill the remaining
          cells exactly, so the row never leaves an orphan. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:grid-rows-2">
        {destinations.map((d, i) => (
          <Link
            key={d.slug}
            id={d.slug}
            href="/tours"
            className={`group relative isolate overflow-hidden rounded-2xl scroll-mt-28 ${
              i === 0 ? "lg:col-span-2 lg:row-span-2 min-h-[20rem]" : "min-h-[15rem]"
            }`}
          >
            <Image
              src={d.image}
              alt={d.name}
              fill
              sizes={i === 0 ? "(max-width: 1024px) 100vw, 50vw" : "(max-width: 1024px) 50vw, 25vw"}
              className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-105"
            />
            <div
              aria-hidden
              className="absolute inset-0 bg-gradient-to-t from-ink via-ink/60 to-ink/10"
            />

            <div className="relative flex h-full flex-col justify-end p-6">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-gold-400">
                {d.parish}
              </p>
              <h3
                className={`mt-1.5 font-display font-semibold text-white ${
                  i === 0 ? "text-3xl lg:text-4xl" : "text-2xl"
                }`}
              >
                {d.name}
              </h3>
              <p
                className={`mt-2 max-w-sm text-sm leading-relaxed text-white/80 ${
                  i === 0 ? "" : "line-clamp-2"
                }`}
              >
                {d.blurb}
              </p>
              <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white">
                See tours
                <FaArrowRight className="text-xs transition-transform group-hover:translate-x-1" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
