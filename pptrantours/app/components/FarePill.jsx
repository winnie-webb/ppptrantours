/**
 * The price block that sits in a booking page hero.
 *
 * Lifted out of the transfer page, which had it inline. The transfer page has
 * always answered "how much?" before the guest scrolls; the tour page never did
 * — it led with a badge, five stars and a duration and made you find a table or
 * open the resort picker to see a number. Both pages share this now so they
 * make the same promise in the same shape.
 *
 * Rendered on a dark hero, so the colours are fixed rather than themeable.
 */
export default function FarePill({ label, value, unit, extra, highlight = false }) {
  return (
    <div
      className={`rounded-2xl border px-5 py-3.5 ${
        highlight
          ? "border-gold-400/30 bg-gold-400/10"
          : "border-white/15 bg-white/5"
      }`}
    >
      <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-white/50">
        {label}
      </p>
      <p className="font-display text-2xl font-semibold text-gold-400">
        {value}
        {unit && (
          <span className="ml-1 text-sm font-medium text-white/50">{unit}</span>
        )}
      </p>
      {extra && <p className="text-[0.7rem] text-white/40">{extra}</p>}
    </div>
  );
}
