"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FaSearch, FaTimes, FaCheck, FaMapMarkerAlt } from "react-icons/fa";
import { AREAS, PLACES, getAreaLabel } from "@/app/data/places";
import { usePlace } from "./PlaceProvider";

/**
 * "Where are you staying?" — a searchable list of resorts, not a list of price
 * zones.
 *
 * Guests know the name of their hotel and nothing about which band it falls in,
 * so the band is never shown as a choice. It is derived from the answer and
 * mentioned only in passing, as reassurance that the price is theirs.
 */
export default function PlacePicker({ dict }) {
  const { pickerOpen, closePicker, choose, placeKey } = usePlace();
  const [query, setQuery] = useState("");
  const inputRef = useRef(null);
  const t = dict?.place ?? {};

  useEffect(() => {
    if (pickerOpen) {
      /*
       * The dialog stays mounted so it can animate, so there is no unmount to
       * clear the query for us. Reopening it must not show the last search.
       */
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setQuery("");
      // Focus after paint, or the dialog animates with a caret already in it.
      const id = window.requestAnimationFrame(() => inputRef.current?.focus());
      return () => window.cancelAnimationFrame(id);
    }
  }, [pickerOpen]);

  useEffect(() => {
    if (!pickerOpen) return;
    const onKey = (e) => e.key === "Escape" && closePicker();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [pickerOpen, closePicker]);

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (p) =>
      !q ||
      [p.name, getAreaLabel(p.area), ...(p.aka ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(q);

    return AREAS.map((area) => ({
      ...area,
      places: PLACES.filter((p) => p.area === area.key && match(p)),
    })).filter((g) => g.places.length > 0);
  }, [query]);

  const total = groups.reduce((n, g) => n + g.places.length, 0);

  if (!pickerOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/60 p-0 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={closePicker}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t.title ?? "Where are you staying?"}
        onClick={(e) => e.stopPropagation()}
        className="animate-fade-up flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-lift sm:max-h-[80vh] sm:rounded-3xl"
      >
        <div className="border-b border-ink/[0.07] px-5 pb-4 pt-5 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-xl font-semibold text-ink">
                {t.title ?? "Where are you staying?"}
              </h2>
              <p className="mt-1 text-sm leading-relaxed text-ink/55">
                {t.subtitle ??
                  "Pick your resort and every price on the site becomes yours — no zones to work out."}
              </p>
            </div>
            <button
              type="button"
              onClick={closePicker}
              aria-label={t.close ?? "Close"}
              className="-mr-1 grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink/40 transition hover:bg-ink/5 hover:text-ink"
            >
              <FaTimes />
            </button>
          </div>

          <div className="relative mt-4">
            <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-ink/35" />
            <input
              ref={inputRef}
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.search ?? "Search hotels, resorts and piers…"}
              className="field pl-11"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 py-2 sm:px-3">
          {total === 0 && (
            <p className="px-4 py-10 text-center text-sm text-ink/50">
              {t.noMatch ??
                "No match. Pick the closest resort, or tell us in the notes — we cover the whole island."}
            </p>
          )}

          {groups.map((group) => (
            <section key={group.key} className="mb-1">
              <h3 className="sticky top-0 z-10 bg-white/95 px-4 py-2 text-[0.68rem] font-semibold uppercase tracking-wider text-ink/40 backdrop-blur">
                {group.label}
              </h3>
              <ul>
                {group.places.map((place) => (
                  <li key={place.key}>
                    <button
                      type="button"
                      onClick={() => choose(place.key)}
                      className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition hover:bg-crimson-50 ${
                        place.key === placeKey ? "bg-crimson-50" : ""
                      }`}
                    >
                      <FaMapMarkerAlt
                        className={`shrink-0 text-sm ${
                          place.key === placeKey
                            ? "text-crimson-600"
                            : "text-ink/25"
                        }`}
                      />
                      <span className="flex-1 text-sm font-medium text-ink">
                        {place.name}
                      </span>
                      {place.key === placeKey && (
                        <FaCheck className="shrink-0 text-xs text-crimson-600" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="border-t border-ink/[0.07] bg-sand px-5 py-3.5 sm:px-6">
          <p className="text-xs leading-relaxed text-ink/50">
            {t.footnote ??
              "Not on the list? Choose the nearest one to get an idea of the price, then message us — we run to every corner of the island."}
          </p>
        </div>
      </div>
    </div>
  );
}
