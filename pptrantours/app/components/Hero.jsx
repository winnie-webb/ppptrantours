"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FaWhatsapp, FaPlane, FaMapMarkedAlt } from "react-icons/fa";
import { site } from "../data/site";
import { localePath } from "@/app/i18n/config";

/*
 * The original crossfading photos are back (owner, 2026-11-02), with the PPP
 * logo standing in their midst. The company banner moved to the transfers
 * page as "Look for this sign".
 */
const SLIDES = ["/local/hero-5.jpg", "/local/hero-3.jpg", "/local/hero-8.jpg"];

export default function Hero({ locale = "en", dict }) {
  const t = dict?.hero ?? {};
  const slogan = dict?.slogan ?? {};
  const [index, setIndex] = useState(0);

  /*
   * The first slide is the LCP image; the others mount once it has had the
   * network to itself. They are absolutely positioned in the viewport, so
   * lazy loading would not hold them back.
   */
  const [armed, setArmed] = useState(false);

  // Slides whose image has finished loading. The rotation never moves to one
  // that hasn't: fading to an unloaded slide showed a black frame.
  const loaded = useRef(new Set());

  useEffect(() => {
    const arm = setTimeout(() => setArmed(true), 2500);
    const rotate = setInterval(
      () =>
        setIndex((i) => {
          const next = (i + 1) % SLIDES.length;
          return loaded.current.has(next) ? next : i;
        }),
      7000
    );
    return () => {
      clearTimeout(arm);
      clearInterval(rotate);
    };
  }, []);

  return (
    <>
    <section className="relative -mt-[4.5rem] flex min-h-[38rem] items-end overflow-hidden bg-ink sm:min-h-[42rem] lg:-mt-20 lg:min-h-[44rem] lg:items-center">
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
            onLoad={() => loaded.current.add(i)}
            className={`object-cover ${i === index ? "animate-slow-zoom" : ""}`}
          />
        </div>
      ))}

      {/* Legibility scrims: darker behind the words on the left. */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-ink via-ink/55 to-ink/35 lg:via-ink/25 lg:to-ink/30"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/40 to-transparent"
      />

      <div className="shell relative w-full pb-10 pt-28 sm:pb-14 lg:grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-center lg:gap-12 lg:pb-16 lg:pt-32">
      {/* The PPP logo, in the midst of the photos. */}
      <div className="mb-6 flex justify-center lg:order-2 lg:mb-0">
        <Image
          src="/brand/logo-master.png"
          alt="PPP Tran Tours: Private, Personalized, Professional"
          width={1531}
          height={1502}
          priority
          sizes="(min-width: 1024px) 26rem, 12rem"
          className="h-auto w-44 animate-fade-up drop-shadow-[0_8px_30px_rgba(0,0,0,0.55)] sm:w-56 lg:w-[24rem] xl:w-[26rem]"
        />
      </div>

      <div className="lg:order-1">
        <div className="max-w-2xl">
          {/* The page's one h1, keyword-led for search (owner, 2026-11-02),
              worded the way guests search: Montego Bay airport transfers,
              private Jamaica tours. */}
          <h1 className="animate-fade-up font-display text-[1.75rem] font-semibold leading-[1.1] text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.45)] sm:text-4xl lg:text-[2.6rem] xl:text-[3rem]">
            {t.h1Keywords ?? "Montego Bay Airport Transfers & Private Jamaica Tours"}
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
            className="mt-5 animate-fade-up text-[0.98rem] leading-relaxed text-white/85 sm:text-lg"
            style={{ animationDelay: "80ms" }}
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

          {/*
            The two booking routes, as plain buttons. They used to be task
            cards with a hotel search in the transfer one (removed
            2026-10-23): choosing a resort is the first step on /transfers
            anyway, and asking for it here put a form in the hero before the
            guest had decided anything. WhatsApp stays, desktop only: on a
            phone it is already the floating button.
          */}
          <div
            className="mt-7 flex animate-fade-up flex-wrap items-center gap-3"
            style={{ animationDelay: "240ms" }}
          >
            <Link href={localePath(locale, "/transfers")} className="btn-primary">
              <FaPlane className="text-xs" />
              {dict?.common?.bookTransferNow ?? "Book a Transfer Now"}
            </Link>
            <Link href={localePath(locale, "/tours")} className="btn-ghost-light">
              <FaMapMarkedAlt className="text-xs" />
              {dict?.common?.bookTourNow ?? "Book a Tour Now"}
            </Link>
            <a
              href={site.contact.whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="btn hidden !px-2 text-white/80 hover:text-white sm:inline-flex"
            >
              <FaWhatsapp className="text-lg text-whatsapp" />
              {site.contact.phone}
            </a>
          </div>
        </div>
      </div>
      </div>
    </section>

    {/* The slogan as its own band under the hero (owner, 2026-11-02). */}
    <section aria-label={slogan.full ?? "Approach Jamaica with confidence."} className="relative overflow-hidden border-y-4 border-gold-400 bg-crimson-700">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grain opacity-[0.06]"
      />
      <p className="shell relative py-6 text-center font-display text-[1.75rem] font-semibold leading-tight text-white sm:py-8 sm:text-4xl lg:text-5xl">
        {slogan.line ?? "Approach Jamaica"}{" "}
        {/* No 🇯🇲: Windows has no flag emoji and draws it as the letters "JM". */}
        <span className="text-gold-300">{slogan.emphasis ?? "with Confidence"}</span>
      </p>
    </section>
    </>
  );
}
