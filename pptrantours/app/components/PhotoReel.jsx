import Image from "next/image";
import { brandReel, site } from "../data/site";

/**
 * Two rows of guest photos drifting in opposite directions — people in PPP
 * tees and caps, the vans. Pure CSS: each track renders its set COPIES times
 * and the `marquee` keyframe slides it by half, so the loop has no seam. Four
 * copies, because a row is only four photos and half the track still has to be
 * wider than a large desktop screen.
 *
 * Hovering a row pauses it. Under prefers-reduced-motion the global rule in
 * globals.css stops the animation and the rows simply sit still, scrollable.
 */
const COPIES = 4;

export default function PhotoReel({ dict }) {
  const t = dict?.reel ?? {};

  return (
    <section className="relative overflow-hidden bg-crimson-700 py-16 lg:py-24">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-grain opacity-[0.06]"
      />

      <div className="shell relative mb-10 text-center lg:mb-14">
        <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold leading-tight text-white sm:text-[2.5rem]">
          {t.title ?? "Our guests wear the brand."}
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-[1.02rem] leading-relaxed text-white/75">
          {t.description ??
            `Horseback in the sea, under the falls, outside Rick's Café — real days out with ${site.owner.short} and the PPP crew.`}
        </p>
      </div>

      <div className="relative space-y-4 sm:space-y-5">
        {brandReel.map((row, r) => (
          <div key={r} className="group flex overflow-hidden py-2">
            <ul
              className={`flex w-max shrink-0 animate-marquee gap-4 group-hover:[animation-play-state:paused] sm:gap-5 ${
                r % 2 ? "[animation-direction:reverse]" : ""
              }`}
            >
              {Array.from({ length: COPIES }, () => row).flat().map((photo, i) => (
                <li
                  key={`${photo.src}-${i}`}
                  aria-hidden={i >= row.length || undefined}
                  className={`relative h-44 w-44 shrink-0 overflow-hidden rounded-2xl shadow-lift ring-1 ring-white/10 sm:h-60 sm:w-60 lg:h-72 lg:w-72 ${
                    i % 2 ? "rotate-[1.5deg]" : "-rotate-[1.5deg]"
                  }`}
                >
                  <Image
                    src={photo.src}
                    alt={i >= row.length ? "" : photo.alt}
                    fill
                    sizes="(max-width: 640px) 11rem, (max-width: 1024px) 15rem, 18rem"
                    className="object-cover transition-transform duration-700 hover:scale-[1.06]"
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}

        {/* Soft fade at both edges so tiles drift in rather than being cut off. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-crimson-700 to-transparent sm:w-24"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-crimson-700 to-transparent sm:w-24"
        />
      </div>
    </section>
  );
}
