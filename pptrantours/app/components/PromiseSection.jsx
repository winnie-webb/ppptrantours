import Image from "next/image";
import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";
import { promise, site } from "../data/site";
import SectionHeading from "./SectionHeading";

/** The three P's the company is named for. */
export default function PromiseSection() {
  return (
    <section className="relative overflow-hidden bg-ink py-20 lg:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grain opacity-[0.04]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-1/4 h-[30rem] w-[30rem] rounded-full bg-crimson-600/15 blur-3xl"
      />

      <div className="shell relative grid gap-14 lg:grid-cols-[1fr_1.05fr] lg:items-center lg:gap-20">
        <div>
          <SectionHeading
            light
            eyebrow="What PPP stands for"
            title="Three promises, in the name itself."
            description="Since 2010 the standard has not moved: you get your own vehicle, a day built around what you actually want to see, and a licensed professional at the wheel."
          />

          <ol className="mt-2 space-y-1">
            {promise.map((p, i) => (
              <li
                key={p.word}
                className="group flex gap-5 rounded-2xl p-4 transition-colors hover:bg-white/[0.04]"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-gold-400/30 bg-crimson-600/25 font-display text-xl font-semibold text-gold-400">
                  {p.letter}
                </span>
                <div>
                  <h3 className="font-display text-xl font-semibold text-white">
                    {p.word}
                  </h3>
                  <p className="mt-1.5 text-[0.95rem] leading-relaxed text-white/60">
                    {p.body}
                  </p>
                </div>
                <span className="sr-only">{i + 1}</span>
              </li>
            ))}
          </ol>

          <Link href="/about-us" className="btn-gold group mt-8">
            Meet {site.owner.short}
            <FaArrowRight className="text-xs transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Image collage */}
        <div className="relative grid grid-cols-2 gap-4">
          <div className="space-y-4 pt-10">
            {/*
              Anchored right: the source is a 1200x382 banner whose left half is
              a flat gradient the old theme used for overlaid text. The guest
              sits in the right quarter, which is all a 3:4 crop keeps.
            */}
            <figure className="relative aspect-[3/4] overflow-hidden rounded-2xl">
              <Image
                src="/ppp/guest-ppp-branded.jpg"
                alt="A guest in a PPP Tran Tours cap and shirt at a waterfall"
                fill
                sizes="(max-width: 1024px) 45vw, 22vw"
                className="object-cover object-right"
              />
            </figure>
            <figure className="relative aspect-square overflow-hidden rounded-2xl">
              <Image
                src="/ppp/river-tubing.jpg"
                alt="Guests river tubing under a stone bridge"
                fill
                sizes="(max-width: 1024px) 45vw, 22vw"
                className="object-cover"
              />
            </figure>
          </div>
          <div className="space-y-4">
            <figure className="relative aspect-square overflow-hidden rounded-2xl">
              <Image
                src="/ppp/donovan-airport-van.jpg"
                alt={`${site.owner.name} meeting guests beside a PPP Tran Tours van at Sangster International Airport`}
                fill
                sizes="(max-width: 1024px) 45vw, 22vw"
                /* A centred square crop clips Mr. Pugh at the right edge; 70% keeps his face and the van decal. */
                className="object-cover object-[70%_center]"
              />
            </figure>
            <figure className="group relative aspect-[3/4] overflow-hidden rounded-2xl">
              <Image
                src="/team/donovan-portrait.jpg"
                alt={`${site.owner.name}, owner of ${site.legalName}, with guests`}
                fill
                sizes="(max-width: 1024px) 45vw, 22vw"
                className="object-cover"
              />
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink via-ink/50 to-transparent p-4 pt-10">
                <span className="block text-sm font-semibold text-white">
                  {site.owner.name}
                </span>
                <span className="block text-[0.7rem] text-white/60">
                  {site.owner.role}
                </span>
              </figcaption>
            </figure>
          </div>

          {/* Sits bottom-left, clear of the owner caption on the right tile. */}
          <div className="absolute -bottom-5 left-4 w-[12rem] rounded-2xl border border-white/10 bg-ink-700/95 p-4 text-center shadow-lift backdrop-blur">
            <p className="font-display text-3xl font-semibold text-gold-400">
              {site.rating.score}
            </p>
            <p className="mt-1 text-[0.7rem] uppercase tracking-wider text-white/55">
              {site.rating.count} Tripadvisor reviews
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
