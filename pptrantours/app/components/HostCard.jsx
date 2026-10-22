import Image from "next/image";
import Link from "next/link";
import { FaArrowRight, FaStar } from "react-icons/fa";
import { site } from "@/app/data/site";
import { localePath } from "@/app/i18n/config";

/**
 * Mr. Pugh's face next to the booking form on tour and transfer pages.
 *
 * Asked for in the fine-tuning round (2026-10-22): the site should show the
 * person guests are actually booking. Every claim here is already made
 * elsewhere on the site — the bio in site.js, the licensing on About, the
 * review count in site.rating — so nothing new is being asserted.
 */
export default function HostCard({ locale, dict, className = "" }) {
  const t = dict?.host ?? {};
  const body = (
    t.body ??
    "He still drives most days, and most of our {count} Tripadvisor reviews mention him by name."
  ).replace("{count}", site.rating.count);

  return (
    <div
      className={`flex items-start gap-4 rounded-2xl border border-ink/[0.07] bg-white p-5 shadow-card ${className}`}
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full ring-2 ring-gold-400 ring-offset-2">
        <Image
          src="/team/donovan-portrait.jpg"
          alt={`${site.owner.name}, owner of ${site.legalName}`}
          fill
          sizes="80px"
          className="object-cover object-top"
        />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-crimson-700">
          {t.eyebrow ?? "Your host"}
        </p>
        <p className="mt-1 font-display text-lg font-semibold text-ink">
          {site.owner.name}
        </p>
        <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink/60">
          <FaStar className="text-gold-500" />
          {t.role ?? "Owner & driver since 2010 · Licensed by the Jamaica Tourist Board"}
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">{body}</p>
        <Link
          href={localePath(locale, "/about-us")}
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-crimson-700 hover:text-crimson-800"
        >
          {t.meet ?? "Meet Mr. Pugh"}
          <FaArrowRight className="text-[0.65rem]" />
        </Link>
      </div>
    </div>
  );
}
