"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  FaSearch,
  FaTimes,
  FaCheck,
  FaMapMarkerAlt,
  FaWhatsapp,
  FaChevronRight,
  FaArrowLeft,
} from "react-icons/fa";
import { searchHotels, popularHotels, suggestClosest } from "@/app/data/hotel-search";
import { placesByArea } from "@/app/data/places";
import { site } from "@/app/data/site";
import { usePlace } from "./PlaceProvider";

/**
 * "Where are you staying?" — the one hotel picker for transfers, tours and
 * the tour list (07_HOTEL_SELECTION.md, in full).
 *
 * A guest knows the name of their hotel and nothing about which price band
 * it falls in, so the band is never shown as a choice — it is derived from
 * the pick. This component owns its own open/closed state (it is a
 * self-contained combobox, not a single app-wide modal like the picker it
 * replaces); `PlaceProvider` stays the one place the *answer* is stored, so
 * every instance on the page agrees.
 *
 * Q-03 (09_DECISIONS.md) overrides 07 §4.1's UNLISTED state: there is no
 * "About $X" estimate and no free-text booking for an unlisted hotel — PPP
 * never guesses a price. "My hotel isn't listed" hands the guest to
 * WhatsApp instead.
 */
function unlistedWhatsAppHref(t) {
  const text =
    t.unlistedMessage ??
    "Hi PPP Tran Tours, my hotel isn't on your website's list. Could you let me know if you serve it and what the transfer price would be?";
  return `${site.contact.whatsappHref}?text=${encodeURIComponent(text)}`;
}

export default function HotelSearch({
  dict,
  variant = "field",
  id = "hotel-search",
  error,
  describedBy,
}) {
  const { place, ready, choose, choiceCount } = usePlace();
  const t = dict?.hotelSearch ?? {};

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [browseArea, setBrowseArea] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const inputRef = useRef(null);
  const rootRef = useRef(null);
  const listboxId = `${id}-listbox`;

  const remembered = ready && Boolean(place) && choiceCount === 0;

  useEffect(() => {
    if (!open) return;
    /*
     * The sheet stays mounted so it can animate, so there is no unmount to
     * clear its state for us — reopening it must not show the last search.
     */
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setQuery("");
    setBrowseArea(null);
    setActiveIndex(0);
    const raf = window.requestAnimationFrame(() => inputRef.current?.focus());
    return () => window.cancelAnimationFrame(raf);
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";

    // Android's back gesture closes the sheet instead of leaving the page.
    window.history.pushState({ hotelSearchOpen: true }, "");
    const onPopState = () => setOpen(false);
    window.addEventListener("popstate", onPopState);

    const onClickAway = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickAway);

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      window.removeEventListener("popstate", onPopState);
      document.removeEventListener("mousedown", onClickAway);
    };
  }, [open]);

  const q = query.trim();

  const results = useMemo(() => (q ? searchHotels(q, { limit: 8 }) : []), [q]);
  const popular = useMemo(() => (q ? [] : popularHotels(8)), [q]);
  const areaGroups = useMemo(
    () => (q ? [] : placesByArea((p) => p.kind !== "pier")),
    [q]
  );
  const browsed = useMemo(() => {
    if (!browseArea) return [];
    return areaGroups.find((g) => g.key === browseArea)?.places ?? [];
  }, [browseArea, areaGroups]);

  const suggestions = useMemo(() => {
    if (!q || results.length > 0) return [];
    // "Did you mean…?" — the closest names by fuzzy distance (07 §3.4).
    return suggestClosest(q, 3);
  }, [q, results]);

  const rows = q ? results : browseArea ? browsed : popular;

  const select = (key) => {
    choose(key);
    setOpen(false);
  };

  const onInputKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, rows.length)); // rows.length = "isn't listed" row
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex < rows.length) select(rows[activeIndex].key);
    } else if (e.key === "Home") {
      setActiveIndex(0);
    } else if (e.key === "End") {
      setActiveIndex(rows.length);
    }
  };

  const label = ready && place ? place.name : t.placeholder ?? "Search your hotel or resort";

  return (
    <div ref={rootRef} className="relative">
      {place && !open ? (
        <SelectedCard
          place={place}
          remembered={remembered}
          onChange={() => setOpen(true)}
          t={t}
          id={id}
        />
      ) : (
        <button
          type="button"
          id={id}
          onClick={() => setOpen(true)}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-describedby={describedBy}
          className={
            variant === "compact"
              ? "inline-flex items-center gap-2 rounded-full border border-ink/12 bg-white px-3.5 py-1.5 text-xs font-semibold text-ink/75 shadow-sm transition hover:border-crimson-300 hover:text-crimson-700"
              : `flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition hover:border-crimson-300 hover:bg-crimson-50/40 ${
                  error ? "border-red-400" : "border-ink/15"
                }`
          }
        >
          <FaMapMarkerAlt
            className={`shrink-0 text-sm ${variant === "compact" ? "text-ink/40" : "text-ink/30"}`}
          />
          <span className={variant === "compact" ? "" : "flex-1 text-sm text-ink/70"}>
            {t.chooseYourHotel ?? "Choose your hotel to see your price"}
          </span>
          {variant !== "compact" && (
            <span className="text-xs font-semibold text-crimson-700">
              {t.choose ?? "Choose"}
            </span>
          )}
        </button>
      )}

      {open && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-ink/60 backdrop-blur-sm sm:hidden"
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t.title ?? "Where are you staying?"}
            className="fixed inset-0 z-[60] flex flex-col bg-white sm:absolute sm:inset-auto sm:left-0 sm:right-0 sm:top-full sm:z-40 sm:mt-2 sm:max-h-[60vh] sm:animate-fade-up sm:flex-col sm:rounded-2xl sm:border sm:border-ink/[0.07] sm:shadow-lift"
          >
            <div className="flex items-center gap-2 border-b border-ink/[0.07] px-4 py-3 sm:px-4 sm:py-3">
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.back ?? "Back"}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-ink/70 transition hover:bg-ink/5 sm:hidden"
              >
                <FaArrowLeft />
              </button>
              <div className="relative flex-1">
                <FaSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-ink/35" />
                <input
                  ref={inputRef}
                  type="search"
                  role="combobox"
                  aria-expanded="true"
                  aria-controls={listboxId}
                  aria-autocomplete="list"
                  aria-activedescendant={
                    rows.length > 0 || open ? `${listboxId}-option-${activeIndex}` : undefined
                  }
                  enterKeyHint="search"
                  autoComplete="off"
                  autoCapitalize="words"
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={onInputKeyDown}
                  placeholder={t.search ?? "Search your hotel or resort…"}
                  className="field pl-10 pr-9 text-base"
                />
                {query && (
                  <button
                    type="button"
                    aria-label={t.clear ?? "Clear"}
                    onClick={() => {
                      setQuery("");
                      setActiveIndex(0);
                    }}
                    className="absolute right-2.5 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-ink/5 text-[0.6rem] text-ink/70 hover:bg-ink/10"
                  >
                    <FaTimes />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label={t.close ?? "Close"}
                className="hidden h-9 w-9 shrink-0 place-items-center rounded-full text-ink/70 transition hover:bg-ink/5 sm:grid"
              >
                <FaTimes />
              </button>
            </div>

            <div
              role="status"
              aria-live="polite"
              className="sr-only"
            >
              {q
                ? `${results.length} ${t.resultsAnnounced ?? "results"}`
                : ""}
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-2 sm:px-2">
              {q && results.length === 0 && (
                <div className="px-4 pb-2 pt-6 text-center">
                  <p className="text-sm text-ink/70">
                    {(t.noMatch ?? 'No match for "{q}".').replace("{q}", q)}
                  </p>
                  {suggestions.length > 0 && (
                    <div className="mt-4 text-left">
                      <p className="px-4 pb-1 text-xs font-semibold uppercase tracking-wider text-ink/50">
                        {t.didYouMean ?? "Did you mean…?"}
                      </p>
                      <ul>
                        {suggestions.map((p) => (
                          <li key={p.key}>
                            <button
                              type="button"
                              onClick={() => select(p.key)}
                              className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left transition hover:bg-crimson-50"
                            >
                              <FaMapMarkerAlt className="shrink-0 text-sm text-ink/25" />
                              <span className="text-sm font-medium text-ink">{p.name}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {browseArea && (
                <button
                  type="button"
                  onClick={() => {
                    setBrowseArea(null);
                    setActiveIndex(0);
                  }}
                  className="mb-1 flex w-full items-center gap-2 rounded-xl px-4 py-2.5 text-left text-sm font-semibold text-crimson-700 hover:bg-crimson-50"
                >
                  <FaArrowLeft className="text-xs" />
                  {t.allAreas ?? "All areas"}
                </button>
              )}

              {rows.length > 0 && (
                <ul id={listboxId} role="listbox" aria-label={t.title ?? "Where are you staying?"}>
                  {rows.map((p, i) => (
                    <li key={p.key}>
                      <button
                        type="button"
                        id={`${listboxId}-option-${i}`}
                        role="option"
                        aria-selected={p.key === place?.key}
                        onClick={() => select(p.key)}
                        onMouseEnter={() => setActiveIndex(i)}
                        className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition hover:bg-crimson-50 ${
                          i === activeIndex ? "bg-crimson-50" : ""
                        }`}
                      >
                        <FaMapMarkerAlt
                          className={`shrink-0 text-sm ${
                            p.key === place?.key ? "text-crimson-600" : "text-ink/25"
                          }`}
                        />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[0.95rem] font-semibold text-ink">
                            {p.name}
                          </span>
                          {p.locality && (
                            <span className="block truncate text-xs text-ink/60">
                              {p.locality}
                            </span>
                          )}
                        </span>
                        {p.key === place?.key && (
                          <FaCheck className="shrink-0 text-xs text-crimson-600" />
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {!q && !browseArea && (
                <div className="mt-1">
                  <p className="px-4 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-ink/70">
                    {t.browseByArea ?? "Browse by area"}
                  </p>
                  <ul>
                    {areaGroups.map((group) => (
                      <li key={group.key}>
                        <button
                          type="button"
                          onClick={() => {
                            setBrowseArea(group.key);
                            setActiveIndex(0);
                          }}
                          className="flex w-full items-center justify-between gap-3 rounded-xl px-4 py-2.5 text-left text-sm text-ink/80 transition hover:bg-crimson-50"
                        >
                          <span>
                            {group.label}
                            <span className="ml-1.5 text-xs text-ink/50">
                              ({group.places.length})
                            </span>
                          </span>
                          <FaChevronRight className="shrink-0 text-[0.6rem] text-ink/40" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="border-t border-ink/[0.07] p-2">
              <a
                href={unlistedWhatsAppHref(t)}
                target="_blank"
                rel="noreferrer"
                id={`${listboxId}-option-${rows.length}`}
                role="option"
                aria-selected="false"
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-crimson-700 transition hover:bg-crimson-50 ${
                  activeIndex === rows.length ? "bg-crimson-50" : ""
                }`}
              >
                <FaWhatsapp className="shrink-0 text-base" />
                {t.notListed ?? "My hotel isn't listed"}
              </a>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SelectedCard({ place, remembered, onChange, t, id }) {
  return (
    <div id={id} className="rounded-xl border-2 border-crimson-600 bg-crimson-50 p-3.5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-crimson-600 text-white">
          <FaCheck className="text-[0.6rem]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-base font-bold text-ink">{place.name}</p>
          {place.locality && <p className="truncate text-xs text-ink/60">{place.locality}</p>}
          {remembered && (
            <p className="mt-1 text-xs font-medium text-ink/50">
              {t.fromLastVisit ?? "From your last visit"}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={onChange}
          className="shrink-0 rounded-full border border-ink/15 bg-white px-3.5 py-1.5 text-xs font-semibold text-ink/75 transition hover:border-crimson-300 hover:text-crimson-700"
        >
          {t.change ?? "Change"}
        </button>
      </div>
    </div>
  );
}
