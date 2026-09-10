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
        {/*
          Rendered at 36 CSS px, so the intrinsic size only needs to cover a
          high-DPI tile — 288 is 8x. The declared dimensions used to be
          1085x1071 while the file was actually 900x888, and at that declared
          width Next generates a 1085px and a 2170px candidate for a 36px mark.
          The 1531x1502 original is kept in public/brand/logo-master.png.
        */}
        <Image
          src="/logo.png"
          alt=""
          width={288}
          height={284}
          priority
          sizes="36px"
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
