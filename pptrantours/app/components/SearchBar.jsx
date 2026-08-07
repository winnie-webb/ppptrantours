"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { FaSearch, FaTimes } from "react-icons/fa";
import { searchProduct, formatPrice, getCategoryShort } from "../products/product";

/**
 * Type-ahead over tour titles. `compact` renders the collapsed pill used in the
 * desktop header; otherwise it renders a full-width input.
 */
export default function SearchBar({ compact = false, light = false, onNavigate }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(!compact);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const results = useMemo(
    () => (query.trim().length < 2 ? [] : searchProduct(query).slice(0, 6)),
    [query]
  );

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
        aria-label="Search tours"
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
    <div ref={wrapRef} className={`relative ${compact ? "w-64" : "w-full"}`}>
      <div className="relative">
        <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-ink/35" />
        <input
          ref={inputRef}
          id="search-input"
          type="search"
          value={query}
          placeholder="Search tours, beaches, transfers…"
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
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              inputRef.current?.focus();
            }}
            className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full bg-ink/5 text-[0.6rem] text-ink/50 hover:bg-ink/10"
          >
            <FaTimes />
          </button>
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 animate-fade-up overflow-hidden rounded-2xl border border-ink/[0.07] bg-white shadow-lift">
          {results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink/50">
              No tours match “{query}”. Try “Dunn’s River”, “Negril” or “airport”.
            </p>
          ) : (
            <ul className="max-h-[22rem] overflow-y-auto p-1.5">
              {results.map((tour) => (
                <li key={tour.id}>
                  <Link
                    href={`/product/${tour.id}`}
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
                        {tour.title}
                      </span>
                      <span className="text-xs text-ink/50">
                        {getCategoryShort(tour.category)} · from{" "}
                        <span className="font-semibold text-crimson-600">
                          {formatPrice(tour.priceLowest)}
                        </span>
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
