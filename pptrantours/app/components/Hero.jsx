"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FaStar, FaWhatsapp, FaArrowRight } from "react-icons/fa";
import { site } from "../data/site";

const SLIDES = ["/local/hero-5.jpg", "/local/hero-3.jpg", "/local/hero-8.jpg"];

export default function Hero() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), 7000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative -mt-[4.5rem] flex min-h-[42rem] items-end overflow-hidden bg-ink lg:-mt-20 lg:min-h-[46rem]">
      {/* Crossfading backdrop */}
      {SLIDES.map((src, i) => (
        <div
          key={src}
          aria-hidden
          className={`absolute inset-0 transition-opacity duration-[1600ms] ease-out ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
        >
          <Image
            src={src}
            alt=""
            fill
            priority={i === 0}
            sizes="100vw"
            className={`object-cover ${i === index ? "animate-slow-zoom" : ""}`}
          />
        </div>
      ))}

      {/* Legibility scrims */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/20"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/25 to-transparent"
      />

      <div className="shell relative w-full pb-16 pt-32 lg:pb-24 lg:pt-40">
        <div className="max-w-3xl">
          <div className="flex animate-fade-up items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur">
              <span className="flex text-gold-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <FaStar key={i} className="text-[0.65rem]" />
                ))}
              </span>
              {site.rating.score} · {site.rating.count} reviews
            </span>
            <span className="hidden text-xs font-medium uppercase tracking-[0.18em] text-white/55 sm:inline">
              {site.tagline}
            </span>
          </div>

          <h1
            className="mt-6 animate-fade-up font-display text-[2.75rem] font-semibold leading-[1.03] text-white sm:text-6xl lg:text-[4.75rem]"
            style={{ animationDelay: "80ms" }}
          >
            Approach Jamaica
            <br />
            <span className="text-gold-400">with confidence…</span>
          </h1>

          {/*
            Mr. Pugh's own wording (supplied 2026-08-12), kept verbatim.

            This ran as a stepped diagonal for a while — the three P's indented
            further right on each line, matching his notebook. He asked for it
            to come out on 2026-08-14, so the paragraph flows normally again.
            Don't reintroduce the indents without asking him.

            All three are set in caps: they are the company's own name, not
            adjectives. The caps come from `uppercase` rather than being typed
            in — the DOM text stays "Private" so screen readers say the word
            instead of spelling it, and copied text keeps its normal case.
            Letter-spacing is opened slightly because caps set tight at this
            size close up. He wrote them in quotation marks because handwriting
            has no bold; rendered, quoting "Private" reads as a scare quote, so
            the gold and the caps carry the emphasis instead.

            "Never a shared van" is deliberately gone from here: it already runs
            as a stat tile in StatsBar directly below (see `stats` in site.js),
            and he cut it to keep this paragraph custom-fit. Don't reinstate it.
          */}
          <p
            className="mt-6 max-w-xl animate-fade-up text-lg leading-relaxed text-white/75"
            style={{ animationDelay: "160ms" }}
          >
            <strong className="font-semibold uppercase tracking-[0.06em] text-gold-300">Private</strong>{" "}
            pickups for airport transfers and island-wide tours from all major
            hotels and cruise ports.{" "}
            <strong className="font-semibold uppercase tracking-[0.06em] text-gold-300">Personalized</strong>{" "}
            service gives you total flexibility to customize your day-trips.
            Clean, pre-cooled vehicles driven by a licensed, mature,
            down-to-earth{" "}
            <strong className="font-semibold uppercase tracking-[0.06em] text-gold-300">Professional</strong>.
          </p>


          <div
            className="mt-9 flex animate-fade-up flex-wrap items-center gap-3"
            style={{ animationDelay: "240ms" }}
          >
            <Link href="/tours" className="btn-gold group">
              Explore tours
              <FaArrowRight className="text-xs transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href="/category/at" className="btn-ghost-light">
              Book an airport transfer
            </Link>
            <a
              href={site.contact.whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="btn text-white/80 hover:text-white"
            >
              <FaWhatsapp className="text-lg" />
              {site.contact.phone}
            </a>
          </div>

          {/* Slide indicators */}
          <div
            className="mt-12 flex animate-fade-up gap-2"
            style={{ animationDelay: "320ms" }}
          >
            {SLIDES.map((s, i) => (
              <button
                key={s}
                type="button"
                aria-label={`Show image ${i + 1}`}
                onClick={() => setIndex(i)}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i === index ? "w-10 bg-gold-400" : "w-5 bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
