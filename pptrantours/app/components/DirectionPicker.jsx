"use client";

import { FaArrowRight, FaCheck, FaExchangeAlt } from "react-icons/fa";

/**
 * Which way the transfer goes, as three visible choices rather than a select.
 *
 * Guests coming in from WhatsApp already talk about "one-way arrival",
 * "one-way departure" and "round trip", so those are the names, in that order,
 * each with the route spelled out underneath. A dropdown hid the other two
 * options behind the default and read "Pick up / Drop off" from the driver's
 * side of the trip; three cards show every choice at once and the selected one
 * cannot be missed.
 *
 * A native radio group under the cards, so arrow keys, screen readers and form
 * semantics all come for free.
 */
const OPTIONS = [
  { value: "to-hotel", label: "toHotelOption", hint: "toHotelHint" },
  { value: "to-airport", label: "toAirportOption", hint: "toAirportHint" },
  { value: "both", label: "roundTripOption", hint: "roundTripHint" },
];

const FALLBACK = {
  toHotelOption: "One-way arrival",
  toHotelHint: "Airport → your hotel",
  toAirportOption: "One-way departure",
  toAirportHint: "Your hotel → airport",
  roundTripOption: "Round trip",
  roundTripHint: "Arrival and departure",
};

export default function DirectionPicker({
  value,
  onChange,
  t = {},
  name = "transfer-type",
  id = "direction",
  error,
}) {
  return (
    <fieldset
      id={id}
      tabIndex={-1}
      aria-invalid={error ? "true" : undefined}
      aria-describedby={error ? `${id}-err` : undefined}
      className="outline-none"
    >
      <legend className="label">{t.direction ?? "Transfer type"}</legend>
      <div className="grid gap-2 sm:grid-cols-3">
        {OPTIONS.map((o) => {
          const selected = value === o.value;
          return (
            <label
              key={o.value}
              className={`relative flex cursor-pointer items-start gap-3 rounded-xl border-2 px-4 py-3 transition focus-within:ring-2 focus-within:ring-crimson-300 ${
                selected
                  ? "border-crimson-600 bg-crimson-50"
                  : error
                    ? "border-red-400 bg-white hover:border-crimson-300"
                    : "border-ink/15 bg-white hover:border-crimson-300"
              }`}
            >
              <input
                type="radio"
                name={name}
                value={o.value}
                checked={selected}
                onChange={() => onChange(o.value)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${
                  selected ? "border-crimson-600 bg-crimson-600 text-white" : "border-ink/25"
                }`}
              >
                {selected && <FaCheck className="text-[0.55rem]" />}
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-ink">
                  {t[o.label] ?? FALLBACK[o.label]}
                </span>
                <span className="mt-0.5 flex items-center gap-1 text-xs text-ink/60">
                  {o.value === "both" ? (
                    <FaExchangeAlt className="text-[0.6rem] text-ink/35" aria-hidden="true" />
                  ) : (
                    <FaArrowRight className="text-[0.6rem] text-ink/35" aria-hidden="true" />
                  )}
                  {t[o.hint] ?? FALLBACK[o.hint]}
                </span>
              </span>
            </label>
          );
        })}
      </div>
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1.5 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </fieldset>
  );
}
