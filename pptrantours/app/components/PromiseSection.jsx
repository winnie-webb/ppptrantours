import Image from "next/image";
import Link from "next/link";
import { FaArrowRight, FaStar } from "react-icons/fa";
import { promise, whyChoose, site } from "../data/site";
import { localePath } from "@/app/i18n/config";

/**
 * "Why choose PPP — the service is in the name." The owner's reasons, in his
 * order (2026-10-30): the service standard, then the three P's the company is
 * named for. It also carries the slogan, which used to close every
 * page as a band above the footer.
 */
export default function PromiseSection({ locale = "en", dict }) {
  const t = dict?.promise ?? {};
  const words = t.words ?? {};
  const slogan = dict?.slogan ?? {};

  const reasons = [
    {
      key: "standard",
      badge: <FaStar className="text-lg" />,
      title: t.standard?.title ?? whyChoose.standard.title,
      body: t.standard?.body ?? whyChoose.standard.body,
    },
    ...promise.map((p) => ({
      key: p.word,
      badge: p.letter,
      title: words[p.word]?.title ?? p.title,
      body: words[p.word]?.body ?? p.body,
    })),
  ];

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
          <h2 className="font-display text-3xl font-semibold leading-tight text-white sm:text-[2.5rem]">
            {t.why ?? "Why choose PPP?"}
            <span className="mt-1 block text-gold-400">
              {t.title ?? "The service is in the name."}
            </span>
          </h2>

          <ol className="mt-7 space-y-1">
            {reasons.map((r) => (
              <li
                key={r.key}
                className="group flex gap-5 rounded-2xl p-4 transition-colors hover:bg-white/[0.04]"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl border border-gold-400/30 bg-crimson-600/25 font-display text-xl font-semibold text-gold-400">
                  {r.badge}
                </span>
                <div>
                  <h3 className="font-display text-xl font-semibold text-white">{r.title}</h3>
                  <p className="mt-1.5 text-[0.95rem] leading-relaxed text-white/60">{r.body}</p>
                </div>
              </li>
            ))}
          </ol>

          <Link
            href={localePath(locale, "/about-us")}
            className="btn-gold group mt-8"
          >
            {t.meet ?? `Meet ${site.owner.short}`}
            <FaArrowRight className="text-xs transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>

        {/* Image collage */}
        <div className="relative grid grid-cols-2 gap-4">
          <div className="space-y-4 pt-10">
            <figure className="relative aspect-[3/4] overflow-hidden rounded-2xl">
              <Image
                src="/ppp/horseback-ppp-tee.jpg"
                alt="A guest in a PPP Tran Tours shirt on horseback in the sea"
                fill
                sizes="(max-width: 1024px) 45vw, 22vw"
                className="object-cover object-[45%_center]"
              />
            </figure>
            <figure className="relative aspect-square overflow-hidden rounded-2xl">
              <Image
                src="/ppp/donovan-rafting-guests.jpg"
                alt={`${site.owner.name} in his PPP uniform with three rafting guests by the river`}
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
            {/* The resort group photo of Mr. Pugh appeared on too many pages
                (owner, 2026-10-31); this tile uses a guest photo instead. The
                subject is in the right quarter of a wide banner, hence
                object-right (see public/CREDITS.md). */}
            <figure className="relative aspect-[3/4] overflow-hidden rounded-2xl">
              <Image
                src="/ppp/guest-ppp-branded.jpg"
                alt="A guest in a PPP cap and shirt holding the yellow PPP Tran Tours sign beside a waterfall"
                fill
                sizes="(max-width: 1024px) 45vw, 22vw"
                className="object-cover object-right"
              />
            </figure>
          </div>

          {/* Sits bottom-left, clear of the owner caption on the right tile. */}
          <div className="absolute -bottom-5 left-4 w-[12rem] rounded-2xl border border-white/10 bg-ink-700/95 p-4 text-center shadow-lift backdrop-blur">
            <p className="font-display text-3xl font-semibold text-gold-400">
              {site.rating.score}
            </p>
            <p className="mt-1 text-xs uppercase tracking-wider text-white/70">
              {site.rating.count} Tripadvisor reviews
            </p>
          </div>
        </div>
      </div>

      {/* The slogan closes the section, big and bold (owner, 2026-10-30). */}
      <p className="shell relative mt-16 text-center font-display text-[2rem] font-semibold leading-[1.1] text-white sm:text-5xl lg:mt-24 lg:text-[4rem]">
        {slogan.line ?? "Approach Jamaica"}{" "}
        <span className="text-gold-400">{slogan.emphasis ?? "with Confidence"}</span>
        <span aria-hidden className="ml-2 align-middle text-3xl sm:text-4xl lg:text-5xl">
          🇯🇲
        </span>
      </p>
    </section>
  );
}
