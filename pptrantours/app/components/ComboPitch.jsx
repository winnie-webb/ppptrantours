import { FaCheck, FaWhatsapp } from "react-icons/fa";
import { site } from "../data/site";

/**
 * The combo-tours pitch, in Mr. Pugh's own words (2026-09-03, amended the same
 * afternoon). His top-seller list and the "challenge our flexibility" line are
 * his selling points, not marketing copy written for him, so they stay close to
 * verbatim.
 */
export default function ComboPitch({ locale = "en", dict }) {
  const t = dict?.comboPitch ?? {};
  const sellers = t.sellers ?? DEFAULT_SELLERS;

  return (
    <section className="bg-sand py-14 lg:py-20">
      <div className="shell grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16">
        <div>
          <p className="eyebrow">{t.eyebrow ?? "Top sellers"}</p>
          <h2 className="mt-3 font-display text-3xl font-semibold leading-tight text-ink sm:text-[2.25rem]">
            {t.title ?? "PPP's best-selling combinations."}
          </h2>
          <ul className="mt-6 grid gap-2.5 sm:grid-cols-2">
            {sellers.map((s) => (
              <li key={s} className="flex items-start gap-2.5">
                <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-crimson-100 text-[0.6rem] text-crimson-700">
                  <FaCheck />
                </span>
                <span className="text-sm leading-relaxed text-ink/75">{s}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-ink/[0.07] bg-white p-7 shadow-card">
          <p className="text-[1.02rem] leading-relaxed text-ink/75">
            {t.body ??
              "Most of our combo tours are located in the same region, no more than a 20–30 minute drive from each other, so you can do both on the same day and we'll only charge you a little bit more for transportation and waiting."}
          </p>
          <p className="mt-4 text-[1.02rem] leading-relaxed text-ink/75">
            {t.challenge ??
              "Challenge our flexibility by telling us which tours you'd like to combine. If they're doable, we'll make it happen for a reasonable price."}
          </p>
          <p className="mt-5 font-display text-lg font-semibold text-ink">
            {t.groups ?? "Accommodations for any size group, big or small."}
          </p>

          <a
            href={site.contact.whatsappHref}
            target="_blank"
            rel="noreferrer"
            className="btn-primary mt-6"
          >
            <FaWhatsapp className="text-lg" />
            {t.buildMyDay ?? "Build my day"}
          </a>
        </div>
      </div>
    </section>
  );
}

const DEFAULT_SELLERS = [
  "YS Falls & Black River Safari",
  "YS Falls & Appleton Estate Rum Tour",
  "Horseback Ride and Swim & River Rapids Tubing",
  "Negril Seven Mile Beach & Rick's Cafe",
  "Blue Hole & Dunn's River Falls",
  "Dunn's River Falls & Mystic Mountain",
  "Martha Brae Rafting & Doctor's Cave Beach",
];
