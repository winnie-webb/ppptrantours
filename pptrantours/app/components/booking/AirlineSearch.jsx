"use client";

import { useEffect, useRef, useState } from "react";
import { FaPlane } from "react-icons/fa";
import { searchAirlines } from "@/app/data/airlines";

/**
 * The airline box on the transfer form: type a name or a flight-number
 * prefix and matching airlines drop down, the way the hotel search does.
 * Unlike the hotel, the value is free text — an airline missing from the
 * list is still a perfectly good answer, so whatever is typed is kept.
 */
export default function AirlineSearch({ id, value, onChange, onBlur, placeholder, invalid, describedBy }) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const listboxId = `${id}-listbox`;

  const matches = searchAirlines(value);
  // A box already holding an exact pick has nothing left to suggest.
  const rows = matches.length === 1 && matches[0].name === value ? [] : matches;
  const showList = open && rows.length > 0;

  useEffect(() => {
    if (!open) return;
    const away = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", away);
    return () => document.removeEventListener("mousedown", away);
  }, [open]);

  const pick = (airline) => {
    onChange(airline.name);
    setOpen(false);
  };

  const onKeyDown = (e) => {
    if (!showList) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, rows.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      pick(rows[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <FaPlane className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-ink/35" />
      <input
        id={id}
        type="text"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listboxId}
        aria-autocomplete="list"
        aria-activedescendant={showList ? `${listboxId}-option-${active}` : undefined}
        aria-invalid={invalid ? "true" : undefined}
        aria-describedby={describedBy}
        autoComplete="off"
        autoCapitalize="words"
        value={value}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        className={`field pl-11 ${invalid ? "border-red-400" : ""}`}
      />
      {showList && (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute left-0 right-0 top-full z-40 mt-2 max-h-72 animate-fade-up overflow-y-auto rounded-2xl border border-ink/[0.07] bg-white p-2 shadow-lift"
        >
          {rows.map((a, i) => (
            <li key={a.code}>
              <button
                type="button"
                id={`${listboxId}-option-${i}`}
                role="option"
                aria-selected={i === active}
                // mousedown, not click: the input's blur would close the list first.
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(a);
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left transition hover:bg-crimson-50 ${
                  i === active ? "bg-crimson-50" : ""
                }`}
              >
                <FaPlane className="shrink-0 text-xs text-ink/25" />
                <span className="flex-1 text-[0.95rem] font-semibold text-ink">{a.name}</span>
                <span className="font-mono text-xs text-ink/50">{a.code}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
