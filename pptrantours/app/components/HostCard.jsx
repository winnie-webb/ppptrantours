import Image from "next/image";
import Link from "next/link";
import { FaArrowRight, FaStar } from "react-icons/fa";
import { site } from "@/app/data/site";
import { localePath } from "@/app/i18n/config";

/**
 * "Your host" card next to the booking form on tour and transfer pages.
 *
 * First added in the fine-tuning round (2026-10-22) with Mr. Pugh's photo.
 * On 2026-11-27 the owner swapped the photo for the company logo and the
 * wording for the PPP family line: five stars, the company name, and
 * "building a family with customers worldwide since 2010".
 */
export default function HostCard({ locale, dict, className = "" }) {
  const t = dict?.host ?? {};

  return (
    <div
      className={`flex items-center gap-4 rounded-2xl border border-ink/[0.07] bg-white p-5 shadow-card ${className}`}
    >
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-white p-1.5 ring-1 ring-ink/[0.08]">
        <Image
          src="/logo.png"
          alt={`${site.legalName} logo`}
          fill
          sizes="80px"
          className="object-contain p-1.5"
        />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-crimson-700">
          {t.eyebrow ?? "Your host"}
        </p>
        <p
          className="mt-1 flex items-center gap-0.5 text-gold-500"
          aria-label={t.starsLabel ?? "5 out of 5 stars"}
          role="img"
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <FaStar key={i} className="text-sm" aria-hidden="true" />
          ))}
        </p>
        <p className="mt-1 font-display text-lg font-semibold text-ink">
          PPP Tran Tours Jamaica
        </p>
        <p className="mt-0.5 text-sm leading-relaxed text-ink/70">
          {t.tagline ?? "Building a family with customers worldwide since 2010."}
        </p>
        <Link
          href={localePath(locale, "/about-us")}
          className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-crimson-700 hover:text-crimson-800"
        >
          {t.meet ?? "Meet the family"}
          <FaArrowRight className="text-[0.65rem]" />
        </Link>
      </div>
    </div>
  );
}
