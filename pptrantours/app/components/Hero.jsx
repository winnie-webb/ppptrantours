"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { FaWhatsapp, FaPlane, FaMapMarkedAlt } from "react-icons/fa";
import { site } from "../data/site";
import { localePath } from "@/app/i18n/config";

/*
 * The owner's PPP artwork (logo, cruise ship on the horizon, plane), built by
 * tmp/make_heroes.py, in the text-free "-bg" renders: he dropped the baked-in
 * "AIRPORT TRANSFERS & TOURS" line (2026-11-02), and the h1 now says it as
 * real text. Sunset and moonlight are the two he named; day stays out.
 */
const SLIDES = [
  { src: "/brand/hero/hero-ppp-sunset-bg.jpg", alt: "PPP Tran Tours logo over a Jamaican sunset sea, with a cruise ship on the horizon and a plane overhead" },
  { src: "/brand/hero/hero-ppp-moon-bg.jpg", alt: "PPP Tran Tours logo over a moonlit Jamaican sea, with a cruise ship on the horizon and a plane overhead" },
];

export default function Hero({ locale = "en", dict }) {
  const t = dict?.hero ?? {};
  const slogan = dict?.slogan ?? {};
  const [index, setIndex] = useState(0);

  /*
   * The second slide mounts only after the first has had the network to
   * itself for a moment: both are absolutely positioned in the viewport, so
   * lazy loading would not hold it back, and the first is the LCP image.
   */
  const [armed, setArmed] = useState(false);

  // Slides whose image has finished loading. The rotation skips one that
  // hasn't, rather than fading to bare ink on a slow connection.
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
    <section className="relative -mt-[4.5rem] overflow-hidden bg-ink pt-[4.5rem] lg:-mt-20 lg:pt-20">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 top-10 hidden h-[32rem] w-[32rem] rounded-full bg-crimson-600/15 blur-3xl lg:block"
      />

      {/*
        Split (2026-11-02): the words on the left, the artwork on the right,
        uncropped at 16:9 and never covered, so the logo, the ship on the sea
        line and the plane all stay in view. On phones the artwork runs full
        width on top and fades into the ink the text sits on.
      */}
      <div className="relative lg:shell lg:grid lg:grid-cols-[minmax(0,0.82fr)_minmax(0,1.18fr)] lg:items-center lg:gap-12 lg:pb-16 lg:pt-10 xl:gap-16">
      <div className="relative aspect-video w-full lg:order-2 lg:overflow-hidden lg:rounded-2xl lg:shadow-lift lg:ring-1 lg:ring-white/10">
        {(armed ? SLIDES : SLIDES.slice(0, 1)).map((slide, i) => (
          <div
            key={slide.src}
            className={`absolute inset-0 transition-opacity duration-[1600ms] ease-out ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={i === index ? undefined : true}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={i === 0}
              sizes="(min-width: 1024px) 55vw, 100vw"
              onLoad={() => loaded.current.add(i)}
              className="object-cover"
            />
          </div>
        ))}

        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1/5 bg-gradient-to-t from-ink to-transparent lg:hidden"
        />

        {/* Slide indicators, in the corner the artwork leaves empty. */}
        <div className="absolute bottom-2 right-3 hidden gap-1.5 sm:flex">
          {SLIDES.map((s, i) => (
            <button
              key={s.src}
              type="button"
              aria-label={`Show image ${i + 1}`}
              onClick={() => {
                // Tapping ahead of the 2.5s arm would otherwise select a
                // slide that has not been mounted yet, showing bare ink.
                setArmed(true);
                setIndex(i);
              }}
              className="group flex h-6 items-center px-0.5"
            >
              <span
                className={`block h-1 rounded-full shadow transition-all duration-500 ${
                  i === index ? "w-8 bg-gold-400" : "w-4 bg-white/50 group-hover:bg-white/80"
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div className="shell relative pb-10 pt-5 sm:pb-12 lg:order-1 lg:px-0 lg:py-0">
        <div className="max-w-2xl">
          {/* The page's one h1, keyword-led for search (owner, 2026-11-02),
              worded the way guests search: Montego Bay airport transfers,
              private Jamaica tours. */}
          <h1 className="animate-fade-up font-display text-[1.65rem] font-semibold leading-[1.12] text-white sm:text-4xl lg:text-[2.4rem] xl:text-[2.85rem]">
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
            className="mt-5 animate-fade-up text-[0.98rem] leading-relaxed text-white/75 sm:text-lg lg:text-base xl:text-[1.05rem]"
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
