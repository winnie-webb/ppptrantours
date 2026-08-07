"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import TourCard from "./TourCard";
import SectionHeading from "./SectionHeading";

/** Horizontally scrolling shelf of tours, with arrow controls on desktop. */
export default function TourRail({ eyebrow, title, description, href, tours }) {
  const scroller = useRef(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const sync = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setAtStart(el.scrollLeft < 8);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    sync();
    const el = scroller.current;
    if (!el) return;
    el.addEventListener("scroll", sync, { passive: true });
    window.addEventListener("resize", sync);
    return () => {
      el.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [sync]);

  const nudge = (dir) => {
    const el = scroller.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 720), behavior: "smooth" });
  };

  if (!tours?.length) return null;

  return (
    <section className="shell py-16 lg:py-24">
      <div className="flex items-end justify-between gap-6">
        <div className="flex-1">
          <SectionHeading
            eyebrow={eyebrow}
            title={title}
            description={description}
            href={href}
          />
        </div>
        <div className="mb-10 hidden shrink-0 gap-2 lg:flex">
          <button
            type="button"
            onClick={() => nudge(-1)}
            disabled={atStart}
            aria-label="Scroll left"
            className="grid h-11 w-11 place-items-center rounded-full border border-ink/10 text-ink/70 transition hover:border-ink/25 hover:bg-ink hover:text-white disabled:pointer-events-none disabled:opacity-30"
          >
            <FaChevronLeft className="text-xs" />
          </button>
          <button
            type="button"
            onClick={() => nudge(1)}
            disabled={atEnd}
            aria-label="Scroll right"
            className="grid h-11 w-11 place-items-center rounded-full border border-ink/10 text-ink/70 transition hover:border-ink/25 hover:bg-ink hover:text-white disabled:pointer-events-none disabled:opacity-30"
          >
            <FaChevronRight className="text-xs" />
          </button>
        </div>
      </div>

      <div
        ref={scroller}
        className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-2 sm:-mx-8 sm:px-8 lg:mx-0 lg:px-0"
      >
        {tours.map((tour, i) => (
          <TourCard
            key={tour.id}
            tour={tour}
            priority={i < 3}
            className="w-[19rem] shrink-0 snap-start sm:w-[21rem]"
          />
        ))}
      </div>
    </section>
  );
}
