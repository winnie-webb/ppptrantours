/**
 * Wordmark, drawn in markup so it stays crisp and can invert against the hero.
 *
 * Echoes the real logo: three stacked crimson "P" blocks outlined in gold, for
 * Private / Personalized / Professional. Replace with the supplied artwork when
 * a clean vector version exists.
 */
export default function Logo({ light = false, className = "" }) {
  return (
    <span className={`flex items-center gap-2.5 ${className}`}>
      {/* "PPP" reads at 40px where the logo's three-P staircase turns to mush. */}
      <span
        aria-hidden
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-[0.72rem] font-extrabold tracking-tight shadow-sm transition-colors ${
          light ? "bg-white text-crimson-600" : "bg-crimson-600 text-gold-400"
        }`}
      >
        PPP
      </span>

      <span className="leading-none">
        <span
          className={`block font-display text-[1.15rem] font-semibold tracking-tight transition-colors ${
            light ? "text-white" : "text-ink"
          }`}
        >
          Tran Tours
        </span>
        <span
          className={`mt-0.5 block text-[0.6rem] font-semibold uppercase tracking-[0.16em] transition-colors ${
            light ? "text-white/60" : "text-crimson-600"
          }`}
        >
          Jamaica
        </span>
      </span>
    </span>
  );
}
