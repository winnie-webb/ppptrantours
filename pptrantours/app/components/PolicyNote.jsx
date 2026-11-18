import Link from "next/link";
import { FaUndoAlt, FaCloudRain } from "react-icons/fa";
import { localePath } from "@/app/i18n/config";

/**
 * The owner's cancellation and bad-weather promises (2026-11-18), shown next
 * to the booking forms rather than only in the terms, so a guest sees them
 * before they book.
 */
export default function PolicyNote({ locale = "en", dict, className = "" }) {
  const t = dict?.policyNote ?? {};
  return (
    <div className={`rounded-2xl border border-ink/[0.07] bg-sand/60 p-5 ${className}`}>
      <p className="font-display text-base font-semibold text-ink">
        {t.title ?? "Booking with confidence"}
      </p>
      <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-ink/75">
        <li className="flex gap-2.5">
          <FaUndoAlt className="mt-1 shrink-0 text-xs text-crimson-600" aria-hidden />
          {t.cancel ?? "100% refund when you cancel at least 48 hours before pickup."}
        </li>
        <li className="flex gap-2.5">
          <FaCloudRain className="mt-1 shrink-0 text-xs text-crimson-600" aria-hidden />
          {t.weather ??
            "Tour cancelled because of bad weather? Reschedule it for another day, subject to availability."}
        </li>
      </ul>
      <Link
        href={`${localePath(locale, "/terms")}#cancel`}
        className="mt-3 inline-block text-sm font-semibold text-crimson-700 hover:underline"
      >
        {t.terms ?? "Read the booking terms"}
      </Link>
    </div>
  );
}
