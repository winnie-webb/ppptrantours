import Image from "next/image";

/**
 * The company logo — three stacked P's for Private / Personalized /
 * Professional, with TRAN TOURS set into the staircase.
 *
 * The artwork is crimson on a transparent ground, which disappears against the
 * dark hero and footer, so it always sits on a white tile. On the light header
 * the tile reads as plain padding.
 */
export default function Logo({ light = false, className = "" }) {
  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <span
        className={`grid shrink-0 place-items-center rounded-xl bg-white p-1.5 transition-shadow ${
          light ? "shadow-md" : "shadow-sm ring-1 ring-ink/[0.06]"
        }`}
      >
        <Image
          src="/logo.png"
          alt=""
          width={1085}
          height={1071}
          priority
          className="h-9 w-9 object-contain"
        />
      </span>

      <span className="leading-none">
        <span
          className={`block font-display text-[1.15rem] font-semibold tracking-tight transition-colors ${
            light ? "text-white" : "text-ink"
          }`}
        >
          PPP Tran Tours
        </span>
        <span
          className={`mt-1 block text-[0.58rem] font-semibold uppercase tracking-[0.14em] transition-colors ${
            light ? "text-white/60" : "text-crimson-600"
          }`}
        >
          Transfers &amp; Tours Jamaica
        </span>
      </span>
    </span>
  );
}
