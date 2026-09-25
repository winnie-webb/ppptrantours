"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState } from "react";
import { FaStar, FaWhatsapp, FaArrowRight, FaPlane, FaMapMarkedAlt } from "react-icons/fa";
import { site } from "../data/site";
import { localePath } from "@/app/i18n/config";
import HotelSearch from "./HotelSearch";

const SLIDES = ["/local/hero-5.jpg", "/local/hero-3.jpg", "/local/hero-8.jpg"];

export default function Hero({ locale = "en", dict }) {
  const t = dict?.hero ?? {};
  const [index, setIndex] = useState(0);

  /*
   * All three slides used to be in the DOM from the first paint. They are
   * absolutely positioned inside the viewport, so Next's lazy loading does not
   * help — the browser sees three in-viewport images and fetches all of them,
   * two of which nobody will look at for seven seconds. The first slide is the
   * LCP image; the other two mount once it has had the network to itself.
   */
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    const arm = setTimeout(() => setArmed(true), 2500);
    const rotate = setInterval(
      () => setIndex((i) => (i + 1) % SLIDES.length),
      7000
    );
    return () => {
      clearTimeout(arm);
      clearInterval(rotate);
    };
  }, []);

  return (
    <section className="relative -mt-[4.5rem] flex min-h-[36rem] items-end overflow-hidden bg-ink sm:min-h-[44rem] lg:-mt-20 lg:min-h-[52rem]">
      {/* Crossfading backdrop */}
      {(armed ? SLIDES : SLIDES.slice(0, 1)).map((src, i) => (
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

      <div className="shell relative w-full pb-10 pt-28 sm:pb-16 lg:pb-24 lg:pt-40">
        <div className="max-w-3xl">
          <div className="flex animate-fade-up items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur">
              <span className="flex text-gold-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <FaStar key={i} className="text-[0.65rem]" />
                ))}
              </span>
              {site.rating.score} · {site.rating.count} {dict?.common?.reviews ?? "reviews"}
            </span>
            <span className="hidden text-xs font-medium uppercase tracking-[0.18em] text-white/70 sm:inline">
              {t.tagline ?? site.tagline}
            </span>
          </div>

          <h1
            className="mt-5 animate-fade-up font-display text-[2.25rem] font-semibold leading-[1.05] text-white sm:mt-6 sm:text-6xl sm:leading-[1.03] lg:text-[4.75rem]"
            style={{ animationDelay: "80ms" }}
          >
            {t.h1a ?? "Approach Jamaica"}
            <br />
            <span className="text-gold-400">{t.h1b ?? "with confidence…"}</span>
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
            className="mt-5 max-w-xl animate-fade-up text-[0.98rem] leading-relaxed text-white/75 sm:mt-6 sm:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            <strong className="font-semibold uppercase tracking-[0.06em] text-gold-300">
              {t.p1 ?? "Private"}
            </strong>{" "}
            {t.lead1 ??
              "pickups for airport transfers and island-wide tours from all major hotels and cruise ports."}{" "}
            <strong className="font-semibold uppercase tracking-[0.06em] text-gold-300">
              {t.p2 ?? "Personalized"}
            </strong>{" "}
            {t.lead2 ??
              "service gives you total flexibility to customize your day-trips. Clean, pre-cooled vehicles driven by a licensed, mature, down-to-earth"}{" "}
            <strong className="font-semibold uppercase tracking-[0.06em] text-gold-300">
              {t.p3 ?? "Professional"}
            </strong>
            .
          </p>

          <div
            className="mt-7 flex animate-fade-up flex-wrap items-center gap-3 lg:mt-9"
            style={{ animationDelay: "240ms" }}
          >
            <Link href={localePath(locale, "/tours")} className="btn-gold group">
              {dict?.common?.bookTourNow ?? "Book a Tour Now"}
              <FaArrowRight className="text-xs transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link href={localePath(locale, "/transfers")} className="btn-ghost-light">
              {dict?.common?.bookTransferNow ?? "Book a Transfer Now"}
            </Link>
            {/* Third CTA, desktop only. On a phone WhatsApp is already the
                floating button, and two choices here beat three. */}
            <a
              href={site.contact.whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="btn hidden text-white/80 hover:text-white sm:inline-flex"
            >
              <FaWhatsapp className="text-lg text-whatsapp" />
              {site.contact.phone}
            </a>
          </div>

          {/* Slide indicators */}
          <div
            className="mt-8 flex animate-fade-up gap-2 lg:mt-12"
            style={{ animationDelay: "320ms" }}
          >
            {SLIDES.map((s, i) => (
              <button
                key={s}
                type="button"
                aria-label={`Show image ${i + 1}`}
                onClick={() => {
                  // Tapping ahead of the 2.5s arm would otherwise select a
                  // slide that has not been mounted yet, showing bare ink.
                  setArmed(true);
                  setIndex(i);
                }}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i === index ? "w-10 bg-gold-400" : "w-5 bg-white/30 hover:bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>

        {/*
          Two task cards, under the original hero copy rather than replacing
          it. Card 1 answers the time-critical question (an arriving guest's
          transfer) with the same `HotelSearch` the rest of the site uses;
          picking a hotel here writes to `PlaceProvider` exactly as it does
          everywhere else, so "Book a Transfer Now" opens /transfers already knowing
          it. Card 2 is the plain alternative for a guest not thinking about
          the airport yet.
        */}
        <div
          className="mt-8 grid max-w-3xl animate-fade-up gap-4 sm:grid-cols-2 lg:mt-10"
          style={{ animationDelay: "380ms" }}
        >
          <div className="rounded-2xl bg-white/95 p-5 shadow-lift backdrop-blur">
            <div className="flex items-center gap-2.5 text-sm font-semibold text-ink/70">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-crimson-50 text-crimson-600">
                <FaPlane className="text-xs" />
              </span>
              {t.transferCard ?? "Airport transfer"}
            </div>
            <div className="mt-3.5">
              <HotelSearch variant="field" id="hero-hotel" dict={dict} />
            </div>
            <Link
              href={localePath(locale, "/transfers")}
              className="btn-primary mt-3.5 w-full !py-2.5 text-sm"
            >
              {dict?.common?.bookTransferNow ?? "Book a Transfer Now"}
              <FaArrowRight className="text-xs" />
            </Link>
          </div>

          <div className="flex flex-col rounded-2xl bg-white/95 p-5 shadow-lift backdrop-blur">
            <div className="flex items-center gap-2.5 text-sm font-semibold text-ink/70">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-crimson-50 text-crimson-600">
                <FaMapMarkedAlt className="text-xs" />
              </span>
              {t.toursCard ?? "Tours"}
            </div>
            <p className="mt-3.5 flex-1 text-sm leading-relaxed text-ink/60">
              {t.toursCardBody ??
                "Waterfalls, beaches, rafting and reggae — private, from your hotel."}
            </p>
            <Link href={localePath(locale, "/tours")} className="btn-ghost mt-3.5 w-full !py-2.5 text-sm">
              {dict?.common?.bookTourNow ?? "Book a Tour Now"}
              <FaArrowRight className="text-xs" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
