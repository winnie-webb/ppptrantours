import Image from "next/image";

/**
 * "Approach Jamaica with Confidence."
 *
 * Mr. Pugh asked for the slogan to close the page "big and bold" (2026-09-03).
 * It is set as a `<p>` rather than a heading: it is a sign-off, not a section
 * anyone navigates to, and putting an h2 here would push a slogan into the
 * document outline ahead of real content.
 */
export default function SloganBand({ dict }) {
  const t = dict?.slogan ?? {};

  return (
    <section className="relative isolate overflow-hidden bg-ink py-20 lg:py-28">
      <Image
        src="/ppp/banner-sunset.jpg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover opacity-30"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-br from-ink/85 via-ink/70 to-crimson-900/70"
      />

      <div className="shell relative text-center">
        <p className="font-display text-[2rem] font-semibold leading-[1.1] text-white sm:text-5xl lg:text-[4rem]">
          {t.line ?? "Approach Jamaica"}{" "}
          <span className="text-gold-400">
            {t.emphasis ?? "with Confidence"}
          </span>
          <span className="ml-2 align-middle text-3xl sm:text-4xl lg:text-5xl">
            🇯🇲
          </span>
        </p>
      </div>
    </section>
  );
}
