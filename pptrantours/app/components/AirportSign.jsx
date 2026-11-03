import Image from "next/image";
import { FaWhatsapp } from "react-icons/fa";
import { airportMeeting, site } from "../data/site";

/**
 * "Look for this sign": PPP's company banner with the airport meeting steps,
 * on every transfer page so guests know what to look for before they land
 * (owner, 2026-11-02). The banner is the original company artwork, cropped
 * to 16:9 without its bottom text.
 *
 * `wide` puts the banner and the steps side by side (the /transfers page);
 * otherwise they stack, for a page's narrower main column.
 */
export default function AirportSign({ dict, wide = false, className = "" }) {
  const t = dict?.airportMeet ?? {};

  return (
    <div
      className={`overflow-hidden rounded-2xl border border-ink/[0.07] bg-white shadow-card ${
        wide ? "lg:grid lg:grid-cols-[1.15fr_1fr] lg:items-center" : ""
      } ${className}`}
    >
      <div className="relative aspect-video w-full">
        <Image
          src="/brand/hero/hero-ppp-original.jpg"
          alt="The PPP Tran Tours company banner: the PPP logo in front of a Jamaican sunset, with a cruise ship and a plane"
          fill
          sizes={wide ? "(min-width: 1024px) 40rem, 100vw" : "(min-width: 1024px) 44rem, 100vw"}
          className="object-cover"
        />
      </div>

      <div className="p-6 lg:p-8">
        <p className="font-display text-2xl font-semibold text-ink">
          {t.signCaption ?? "Look for this sign"}
        </p>
        <p className="mt-1 text-sm font-semibold text-crimson-700">
          {t.title ?? airportMeeting.title}
        </p>
        <ol className="mt-4 list-decimal space-y-2 pl-5 text-[0.95rem] leading-relaxed text-ink/75">
          <li>{t.step1 ?? airportMeeting.steps[0]}</li>
          <li>{t.step2 ?? airportMeeting.steps[1]}</li>
        </ol>
        <a
          href={site.contact.whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-flex items-center gap-2 text-sm text-ink/70 hover:text-crimson-700"
        >
          <FaWhatsapp className="text-base text-whatsapp" />
          {t.help ?? airportMeeting.help}
        </a>
      </div>
    </div>
  );
}
