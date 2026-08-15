"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { FaChevronLeft, FaChevronRight, FaExpand, FaTimes } from "react-icons/fa";
import { gallery } from "../data/site";
import SectionHeading from "./SectionHeading";

/**
 * Masonry gallery of PPP's own photography, with a lightbox.
 *
 * Deliberately a CSS-column masonry rather than a uniform grid: the recovered
 * banners are 3:1 and the rest range from 3:2 to 3:4 portrait, so a fixed
 * aspect tile would crop the subject straight out of half of them. Every photo
 * renders at its native ratio instead.
 */
export default function GallerySection({ items = gallery, heading = true }) {
  const [openIdx, setOpenIdx] = useState(null);
  const isOpen = openIdx !== null;

  const closeBtnRef = useRef(null);
  const restoreFocusRef = useRef(null);

  const close = useCallback(() => setOpenIdx(null), []);
  const step = useCallback(
    (delta) =>
      setOpenIdx((i) => (i === null ? i : (i + delta + items.length) % items.length)),
    [items.length]
  );

  // Esc to close, arrows to move through the set.
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") step(1);
      else if (e.key === "ArrowLeft") step(-1);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isOpen, close, step]);

  // Lock the page behind the overlay, and hand focus to the close button so the
  // dialog is reachable by keyboard. Focus goes back to the tile on close.
  useEffect(() => {
    if (!isOpen) return;

    restoreFocusRef.current = document.activeElement;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    closeBtnRef.current?.focus();

    return () => {
      document.body.style.overflow = overflow;
      restoreFocusRef.current?.focus?.();
    };
  }, [isOpen]);

  const active = isOpen ? items[openIdx] : null;

  return (
    <section className="bg-white py-16 lg:py-24">
      <div className="shell">
        {heading && (
          <SectionHeading
            eyebrow="The gallery"
            title="Real days out, real guests."
            description="Every photo here was taken on our own tours — no stock islands, no borrowed vehicles. This is what the day actually looks like."
          />
        )}

        {/* Masonry. Columns keep each photo at its true shape; nothing is cropped. */}
        <ul className="gap-4 [column-fill:_balance] sm:columns-2 lg:columns-3">
          {items.map((item, i) => (
            <li key={item.src} className="mb-4 break-inside-avoid">
              <button
                type="button"
                onClick={() => setOpenIdx(i)}
                className="group relative block w-full overflow-hidden rounded-2xl bg-ink/5 shadow-card
                           transition duration-300 hover:shadow-lift focus-visible:outline-none
                           focus-visible:ring-2 focus-visible:ring-crimson-500 focus-visible:ring-offset-2"
              >
                <Image
                  src={item.src}
                  alt={item.alt}
                  width={item.w}
                  height={item.h}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="h-auto w-full transition-transform duration-[900ms] ease-out group-hover:scale-[1.04]"
                />

                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/25 to-transparent
                             opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100"
                />

                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 bottom-0 translate-y-2 p-4 text-left opacity-0
                             transition duration-300 group-hover:translate-y-0 group-hover:opacity-100
                             group-focus-visible:translate-y-0 group-focus-visible:opacity-100"
                >
                  <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-gold-400">
                    {item.place}
                  </span>
                  <span className="mt-1 block text-sm font-medium leading-snug text-white">
                    {item.caption}
                  </span>
                </span>

                <span
                  aria-hidden
                  className="pointer-events-none absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full
                             bg-ink/60 text-white opacity-0 backdrop-blur transition-opacity duration-300
                             group-hover:opacity-100 group-focus-visible:opacity-100"
                >
                  <FaExpand className="text-xs" />
                </span>

                <span className="sr-only">— view larger</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {active && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Photo ${openIdx + 1} of ${items.length}: ${active.place}`}
          onClick={close}
          className="fixed inset-0 z-[90] flex flex-col items-center justify-center gap-4 bg-ink/95 p-4 backdrop-blur-sm sm:p-8"
        >
          <div className="flex w-full max-w-5xl items-center justify-between gap-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">
              {openIdx + 1} / {items.length}
            </p>
            <button
              ref={closeBtnRef}
              type="button"
              onClick={close}
              aria-label="Close photo viewer"
              className="grid h-10 w-10 place-items-center rounded-full border border-white/20 text-white
                         transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-gold-400"
            >
              <FaTimes className="text-sm" />
            </button>
          </div>

          {/* Stop clicks on the photo itself from closing the overlay. */}
          <figure
            onClick={(e) => e.stopPropagation()}
            className="flex min-h-0 w-full max-w-5xl flex-1 flex-col items-center justify-center gap-4"
          >
            <Image
              key={active.src}
              src={active.src}
              alt={active.alt}
              width={active.w}
              height={active.h}
              sizes="(max-width: 1024px) 100vw, 64rem"
              priority
              className="max-h-[65vh] w-auto max-w-full rounded-2xl object-contain shadow-lift"
            />
            <figcaption className="max-w-2xl text-center">
              <span className="block text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-gold-400">
                {active.place}
              </span>
              <span className="mt-1.5 block text-[0.95rem] text-white/75">
                {active.caption}
              </span>
            </figcaption>
          </figure>

          <div
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-3"
          >
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label="Previous photo"
              className="grid h-11 w-11 place-items-center rounded-full border border-white/20 text-white
                         transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-gold-400"
            >
              <FaChevronLeft className="text-sm" />
            </button>
            <button
              type="button"
              onClick={() => step(1)}
              aria-label="Next photo"
              className="grid h-11 w-11 place-items-center rounded-full border border-white/20 text-white
                         transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2
                         focus-visible:ring-gold-400"
            >
              <FaChevronRight className="text-sm" />
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
