"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaSearch, FaTimes, FaPlane } from "react-icons/fa";
import { searchProduct } from "../products/product";
import { searchPlaces } from "../data/places";
import { lowestTransport, money } from "../products/pricing";
import { localePath } from "@/app/i18n/config";

/**
 * Type-ahead over tours *and* resorts.
 *
 * Resorts are in here because that is what a guest arriving at MBJ actually
 * types — "Iberostar", not "airport transfer". Matching it straight to that
 * resort's transfer page with its fare attached is the shortest path from the
 * question to the answer.
 */
export default function SearchBar({
  compact = false,
  light = false,
  locale = "en",
  dict,
  onNavigate,
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(!compact);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);
  const t = dict?.search ?? {};

  const { tours, places } = useMemo(() => {
    if (query.trim().length < 2) return { tours: [], places: [] };
    return {
      tours: searchProduct(query)
        .filter((p) => p.kind !== "transfer")
        .slice(0, 5),
      places: searchPlaces(query)
        .filter((p) => p.transfer)
        .slice(0, 4),
    };
  }, [query]);

  const hasResults = tours.length > 0 || places.length > 0;

  useEffect(() => {
    const onClickAway = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        if (compact && !query) setExpanded(false);
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        inputRef.current?.blur();
      }
    };
    document.addEventListener("mousedown", onClickAway);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickAway);
      document.removeEventListener("keydown", onKey);
    };
  }, [compact, query]);

  const select = () => {
    setOpen(false);
    setQuery("");
    onNavigate?.();
  };

  if (compact && !expanded) {
    return (
      <button
        type="button"
        aria-label={t.label ?? "Search"}
        onClick={() => {
          setExpanded(true);
          requestAnimationFrame(() => inputRef.current?.focus());
        }}
        className={`grid h-10 w-10 place-items-center rounded-full transition ${
          light
            ? "bg-white/15 text-white hover:bg-white/25"
            : "bg-ink/5 text-ink/70 hover:bg-ink/10 hover:text-ink"
        }`}
      >
        <FaSearch className="text-sm" />
      </button>
    );
  }

  return (
    <div ref={wrapRef} className={`relative ${compact ? "w-60" : "w-full"}`}>
      <div className="relative">
        <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-ink/35" />
        <input
          ref={inputRef}
          id="search-input"
          type="search"
          value={query}
          placeholder={t.placeholder ?? "Search tours or your resort…"}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          className="field pl-11 pr-10"
          autoComplete="off"
        />
        {query && (
          <button
            type="button"
            aria-label={t.clear ?? "Clear search"}
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-ink/5 text-[0.6rem] text-ink/70 hover:bg-ink/10"
          >
            <FaTimes />
          </button>
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[24rem] animate-fade-up overflow-y-auto rounded-2xl border border-ink/[0.07] bg-white shadow-lift">
          {!hasResults ? (
            <p className="px-4 py-6 text-center text-sm text-ink/70">
              {t.noResults ?? "Nothing matches that. Try “Dunn’s River”, “Negril” or your hotel name."}
            </p>
          ) : (
            <div className="p-1.5">
              {tours.length > 0 && (
                <>
                  <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-ink/70">
                    {t.tours ?? "Tours"}
                  </p>
                  <ul>
                    {tours.map((tour) => {
                      const floor = lowestTransport(tour);
                      return (
                        <li key={tour.id}>
                          <Link
                            href={localePath(locale, `/tour/${tour.id}`)}
                            onClick={select}
                            className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-crimson-50"
                          >
                            <span className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-ink/5">
                              <Image
                                src={tour.image}
                                alt=""
                                fill
                                sizes="64px"
                                className="object-cover"
                              />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium text-ink">
                                {dict?.tourTitles?.[tour.id] ?? tour.title}
                              </span>
                              <span className="text-xs text-ink/70">
                                {floor != null ? (
                                  <>
                                    {t.from ?? "from"}{" "}
                                    <span className="font-semibold text-crimson-600">
                                      {money(floor)}
                                    </span>
                                  </>
                                ) : (
                                  t.askUs ?? "ask us"
                                )}
                              </span>
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </>
              )}

              {places.length > 0 && (
                <>
                  <p className="px-3 pb-1 pt-3 text-xs font-semibold uppercase tracking-wider text-ink/70">
                    {t.transfers ?? "Airport transfers"}
                  </p>
                  <ul>
                    {places.map((p) => (
                      <li key={p.key}>
                        <Link
                          href={localePath(locale, `/transfer/${p.key}`)}
                          onClick={select}
                          className="flex items-center gap-3 rounded-xl p-2 transition hover:bg-crimson-50"
                        >
                          <span className="grid h-12 w-16 shrink-0 place-items-center rounded-lg bg-crimson-50 text-crimson-600">
                            <FaPlane className="text-sm" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium text-ink">
                              {p.name}
                            </span>
                            <span className="text-xs text-ink/70">
                              {t.from ?? "from"}{" "}
                              <span className="font-semibold text-crimson-600">
                                {money(p.transfer.oneWay)}
                              </span>{" "}
                              {t.oneWay ?? "one way"}
                            </span>
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
