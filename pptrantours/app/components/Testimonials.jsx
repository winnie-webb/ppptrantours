import { FaStar, FaQuoteLeft, FaTripadvisor } from "react-icons/fa";
import { testimonials, site } from "../data/site";
import SectionHeading from "./SectionHeading";

export default function Testimonials({ dict, limit }) {
  const t = dict?.testimonials ?? {};
  const shown = limit ? testimonials.slice(0, limit) : testimonials;

  /*
   * Score and count are substituted from site.rating rather than written into
   * the copy, so the ten translations cannot drift from the real figure the way
   * the previous hardcoded "680" already was.
   *
   * The wording changed too. It claimed not one review was below five stars —
   * a statement about the whole distribution that the Tripadvisor listing does
   * not support. A 5.0 displayed average is a fact; the other was a guess
   * wearing the same clothes.
   */
  const title = (
    t.title ?? "Rated {score} on Tripadvisor, across {count} reviews."
  )
    .replace("{score}", site.rating.score)
    .replace("{count}", String(site.rating.count));
  return (
    <section className="bg-sand py-16 lg:py-24">
      <div className="shell">
        <SectionHeading
          align="center"
          eyebrow={t.eyebrow ?? "Guest reviews"}
          title={title}
          description={t.description ?? "Most of them mention Mr. Pugh by name."}
        />

        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
          {shown.map((review) => (
            <figure
              key={review.author}
              className="break-inside-avoid rounded-2xl border border-ink/[0.07] bg-white p-6 shadow-card transition-shadow hover:shadow-lift"
            >
              <FaQuoteLeft className="text-lg text-crimson-200" />
              <blockquote className="mt-4 text-[0.95rem] leading-relaxed text-ink/80">
                “{review.quote}”
              </blockquote>
              <figcaption className="mt-5 flex items-center justify-between border-t border-ink/[0.07] pt-4">
                <div>
                  <p className="text-sm font-semibold text-ink">{review.author}</p>
                  <p className="text-xs text-ink/60">{review.date}</p>
                </div>
                <div className="flex text-gold-400">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <FaStar key={i} className="text-[0.7rem]" />
                  ))}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="mt-10 text-center">
          <a
            href={site.social.tripadvisor}
            target="_blank"
            rel="noreferrer"
            className="btn-ghost"
          >
            <FaTripadvisor className="text-base text-crimson-600" />
            {t.readAllReviews ?? "Read all reviews on Tripadvisor"}
          </a>
        </div>
      </div>
    </section>
  );
}
