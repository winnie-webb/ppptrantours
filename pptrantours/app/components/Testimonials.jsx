import { FaStar, FaQuoteLeft, FaTripadvisor } from "react-icons/fa";
import { testimonials, site } from "../data/site";
import SectionHeading from "./SectionHeading";

export default function Testimonials() {
  return (
    <section className="bg-sand py-16 lg:py-24">
      <div className="shell">
        <SectionHeading
          align="center"
          eyebrow="Guest reviews"
          title="680 reviews. Not one below five stars."
          description="Most of them mention Mr. Pugh by name."
        />

        <div className="columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
          {testimonials.map((t) => (
            <figure
              key={t.author}
              className="break-inside-avoid rounded-2xl border border-ink/[0.07] bg-white p-6 shadow-card transition-shadow hover:shadow-lift"
            >
              <FaQuoteLeft className="text-lg text-crimson-200" />
              <blockquote className="mt-4 text-[0.95rem] leading-relaxed text-ink/80">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-5 flex items-center justify-between border-t border-ink/[0.07] pt-4">
                <div>
                  <p className="text-sm font-semibold text-ink">{t.author}</p>
                  <p className="text-xs text-ink/45">{t.date}</p>
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
            Read all reviews on Tripadvisor
          </a>
        </div>
      </div>
    </section>
  );
}
