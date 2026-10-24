"use client";

/**
 * Which way the transfer goes: one compact dropdown, nothing preselected.
 *
 * The names are the ones WhatsApp guests already use — one-way arrival,
 * one-way departure, round trip — and need nothing added: a bracketed route
 * after each one was cut off in a phone's closed select. It was briefly three cards; on a
 * phone they stacked into a wall of options above the price, and the owner's
 * rule for this form is less on screen, less to think about. No default,
 * because a preselected round trip priced a trip some guests never chose.
 */
const OPTIONS = [
  { value: "to-hotel", label: "toHotelOption" },
  { value: "to-airport", label: "toAirportOption" },
  { value: "both", label: "roundTripOption" },
];

const FALLBACK = {
  toHotelOption: "One-way arrival",
  toAirportOption: "One-way departure",
  roundTripOption: "Round trip",
  choose: "Choose transfer type",
};

export default function DirectionPicker({ value, onChange, t = {}, id = "direction", error }) {
  return (
    <div>
      <label htmlFor={id} className="label">
        {t.direction ?? "Transfer type"}
      </label>
      <select
        id={id}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={error ? "true" : undefined}
        aria-describedby={error ? `${id}-err` : undefined}
        className={`field text-base ${value ? "" : "text-ink/50"} ${error ? "border-red-400" : ""}`}
      >
        <option value="" disabled>
          {t.chooseDirection ?? FALLBACK.choose}
        </option>
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value} className="text-ink">
            {t[o.label] ?? FALLBACK[o.label]}
          </option>
        ))}
      </select>
      {error && (
        <p id={`${id}-err`} role="alert" className="mt-1.5 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
