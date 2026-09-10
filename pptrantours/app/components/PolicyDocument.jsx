import { FaExclamationTriangle } from "react-icons/fa";

/**
 * Renders a policy from `app/data/policies.js`.
 *
 * Sections flagged `confirm: true` are drafts — normal terms for a Caribbean
 * private-transfer operator, but not yet agreed by the owner. They are marked
 * visibly rather than quietly, because the alternative is a page that looks
 * settled and is the first thing a guest will quote back in a dispute.
 *
 * The banner and the markers should disappear as he signs each section off; when
 * every `confirm` flag is gone from the data file, both vanish on their own.
 */
export default function PolicyDocument({ sections, updated, draftNotice }) {
  const drafts = sections.filter((s) => s.confirm);

  return (
    <div className="shell py-14 lg:py-20">
      <div className="mx-auto max-w-3xl">
        {updated && (
          <p className="text-xs font-semibold uppercase tracking-wider text-ink/60">
            Last updated {updated}
          </p>
        )}

        {drafts.length > 0 && (
          <div className="mt-5 flex gap-3 rounded-2xl border border-gold-400/50 bg-gold-200/30 px-5 py-4">
            <FaExclamationTriangle
              aria-hidden="true"
              className="mt-0.5 shrink-0 text-crimson-600"
            />
            <p className="text-sm leading-relaxed text-ink/80">
              {draftNotice ??
                `${drafts.length} of the sections below are marked provisional and are still being confirmed by the owner. If anything here matters to your booking, ask us and we will confirm it in writing before you pay.`}
            </p>
          </div>
        )}

        <div className="mt-10 space-y-10">
          {sections.map((section) => (
            <section key={section.key} id={section.key}>
              <h2 className="font-display text-xl font-semibold tracking-tight text-ink sm:text-2xl">
                {section.heading}
                {section.confirm && (
                  <span className="ml-2.5 align-middle rounded-full bg-gold-200/70 px-2.5 py-1 text-[0.6rem] font-semibold uppercase tracking-wider text-ink/70">
                    To be confirmed
                  </span>
                )}
              </h2>
              <div className="mt-3 space-y-3">
                {section.body.map((para, i) => (
                  <p key={i} className="text-[0.95rem] leading-relaxed text-ink/75">
                    {para}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
