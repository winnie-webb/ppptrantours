import { FaStar, FaTripadvisor } from "react-icons/fa";
import { testimonials, site } from "../data/site";

/*
 * Small tilts and float timings, one per card, so the cloud never moves in
 * step. Fixed values rather than random ones keep server and client renders
 * identical.
 */
const TILTS = [-2.5, 1.5, -1, 2.5, 2, -1.5, 1, -2, 1.5, -2.5, 2, -1];
const FLOATS = [7, 8.5, 6.5, 9, 7.5, 8, 6, 9.5, 7, 8.5, 6.5, 8];

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/** "July 2026" → a number that sorts by month. */
function reviewMonth(date) {
  const [month, year] = date.split(" ");
  return Number(year) * 12 + MONTHS.indexOf(month);
}

function Stars({ className = "" }) {
  return (
    <div className={`flex text-gold-400 ${className}`} aria-label="5 out of 5 stars" role="img">
      {Array.from({ length: 5 }).map((_, i) => (
        <FaStar key={i} />
      ))}
    </div>
  );
}

/**
 * The rating sits in the middle and the reviews float around it on desktop;
 * on phones it heads the section and the reviews become a swipeable row.
 * Owner picked this layout from three sketches (2026-11-03).
 */
function Score({ title, t, className = "" }) {
  return (
    <div className={`flex-col items-center justify-center text-center ${className}`}>
      <p className="font-display text-7xl font-semibold leading-none text-ink lg:text-8xl">
        {site.rating.score}
      </p>
      <Stars className="mt-3 gap-1 text-xl" />
      <h2 className="mt-4 max-w-sm font-display text-2xl font-semibold leading-snug text-ink">
        {title}
      </h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-ink/60">
        {t.description ?? "Private transfers and tours, reviewed by the guests who took them."}
      </p>
      <a
        href={site.social.tripadvisor}
        target="_blank"
        rel="noreferrer"
        className="btn-ghost mt-6"
      >
        <FaTripadvisor className="text-base text-crimson-600" />
        {t.readAllReviews ?? "Read all reviews on Tripadvisor"}
      </a>
    </div>
  );
}

export default function Testimonials({ dict, limit }) {
  const t = dict?.testimonials ?? {};
  // Newest first, so the swipeable row on phones opens on the latest reviews.
  const shown = [...testimonials]
    .sort((a, b) => reviewMonth(b.date) - reviewMonth(a.date))
    .slice(0, limit);

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
    <section className="overflow-hidden bg-sand py-16 lg:py-24">
      <div className="shell">
        <Score title={title} t={t} className="flex lg:hidden" />

        {/*
         * One list for both layouts: a snap-scrolling row on phones, and on
         * desktop a four-column grid whose middle 2×2 is the score, with the
         * cards filling the ring around it.
         */}
        <div className="no-scrollbar -mx-5 mt-10 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 py-4 sm:-mx-8 sm:px-8 lg:mx-0 lg:mt-0 lg:grid lg:grid-flow-row-dense lg:grid-cols-4 lg:items-center lg:gap-x-6 lg:gap-y-8 lg:overflow-visible lg:px-0">
          <Score
            title={title}
            t={t}
            className="hidden px-6 lg:col-span-2 lg:col-start-2 lg:row-span-2 lg:row-start-2 lg:flex"
          />
          {shown.map((review, i) => (
            <figure
              key={review.author}
              style={{
                "--tilt": `${TILTS[i % TILTS.length]}deg`,
                animationDuration: `${FLOATS[i % FLOATS.length]}s`,
                animationDelay: `-${i * 1.3}s`,
              }}
              className="w-[78%] shrink-0 snap-center motion-safe:lg:animate-float sm:w-[46%] lg:w-auto"
            >
              <div className="rounded-2xl border border-ink/[0.07] bg-white p-5 shadow-card transition duration-300 [transform:rotate(var(--tilt))] hover:shadow-lift hover:[transform:rotate(0deg)_scale(1.03)]">
                <Stars className="gap-0.5 text-[0.7rem]" />
                <blockquote className="mt-3 text-[0.9rem] leading-relaxed text-ink/80">
                  “{review.quote}”
                </blockquote>
                <figcaption className="mt-4 border-t border-ink/[0.07] pt-3">
                  <p className="text-sm font-semibold text-ink">{review.author}</p>
                  <p className="mt-0.5 text-xs text-ink/60">
                    {review.date}
                    {review.trip && <> · {review.trip}</>}
                  </p>
                </figcaption>
              </div>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
