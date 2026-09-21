"use client";

import { useEffect, useState } from "react";

/**
 * Mobile-only Book bar.
 *
 * On a phone the booking form is the last thing in the DOM on both booking
 * pages, because the two-column grid stacks and the form lives in the second
 * column. Rather than fight the grid, this keeps a way into the form within
 * thumb reach from anywhere on the page.
 *
 * Two behaviours matter and are easy to get wrong:
 *
 *  - It hides once the form is actually on screen. A bar fixed to the bottom of
 *    the viewport otherwise sits on top of the form's own submit button, which
 *    is the one thing the page exists to let you press.
 *  - It pads for `safe-area-inset-bottom` so it clears the home indicator on a
 *    notched iPhone instead of sitting under it.
 *
 * While it is up it sets `book-bar-open` on <body>, which globals.css uses to
 * lift the floating WhatsApp button clear of it — they both want the same
 * corner otherwise.
 */
export default function StickyBookBar({ title, cta }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    /*
     * Plain geometry rather than an IntersectionObserver. The observer worked,
     * but it put the decision in a second async source that had to be kept in
     * step with the scroll handler; one rect read per scroll event is cheaper
     * to reason about and costs nothing measurable for a single element.
     *
     * "In view" deliberately means the middle 60% of the screen, not any sliver
     * of it: the form is over 1,600px tall on a tour page, so a few pixels of
     * its top edge showing is not the same as the guest looking at it.
     */
    const onScroll = () => {
      const target = document.getElementById("book");
      const h = window.innerHeight;
      let formOnScreen = false;
      if (target) {
        const r = target.getBoundingClientRect();
        formOnScreen = r.top < h * 0.8 && r.bottom > h * 0.2;
      }
      setShow(window.scrollY > 400 && !formOnScreen);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle("book-bar-open", show);
    return () => document.body.classList.remove("book-bar-open");
  }, [show]);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-ink/[0.07] bg-white/95 backdrop-blur-lg transition-transform duration-300 lg:hidden ${
        show ? "" : "pointer-events-none"
      }`}
      /*
       * The slide is an inline transform rather than Tailwind's translate-y-*
       * utilities. Swapping those two classes left the computed transform stuck
       * at translateY(100%) even once the class had changed to translate-y-0 —
       * the bar was "visible" in the DOM and still parked below the fold. One
       * declaration, no class-order question.
       */
      style={{
        transform: show ? "translateY(0)" : "translateY(100%)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/*
        No price in the bar any more.

        It carried the per-head rate, which is not a figure anybody is charged
        for the trip, and it carried it in the one place a guest cannot see the
        form's real total. What is useful here is the name of the thing they
        are looking at and a way back to the form.
      */}
      <div className="flex items-center justify-between gap-4 px-5 py-3">
        {title ? (
          <>
            <p className="min-w-0 flex-1 truncate font-display text-base font-semibold text-ink">
              {title}
            </p>
            <a href="#book" className="btn-primary shrink-0">
              {cta}
            </a>
          </>
        ) : (
          <a href="#book" className="btn-primary w-full justify-center">
            {cta}
          </a>
        )}
      </div>
    </div>
  );
}
