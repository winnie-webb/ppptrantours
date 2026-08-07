import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";

export default function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkLabel = "View all",
  light = false,
  align = "between",
}) {
  const centered = align === "center";

  return (
    <div
      className={`mb-10 gap-6 ${
        centered
          ? "mx-auto max-w-2xl text-center"
          : "flex flex-col items-start justify-between sm:flex-row sm:items-end"
      }`}
    >
      <div className={centered ? "" : "max-w-2xl"}>
        {eyebrow && <p className={light ? "eyebrow-light" : "eyebrow"}>{eyebrow}</p>}
        <h2
          className={`mt-2.5 font-display text-3xl font-semibold leading-tight sm:text-[2.5rem] ${
            light ? "text-white" : "text-ink"
          }`}
        >
          {title}
        </h2>
        {description && (
          <p
            className={`mt-3.5 text-[1.05rem] leading-relaxed ${
              light ? "text-white/65" : "text-ink/60"
            }`}
          >
            {description}
          </p>
        )}
      </div>

      {href && (
        <Link
          href={href}
          className={`group inline-flex shrink-0 items-center gap-2 text-sm font-semibold transition ${
            light ? "text-crimson-300 hover:text-crimson-200" : "text-crimson-700 hover:text-crimson-800"
          } ${centered ? "mt-6" : ""}`}
        >
          {linkLabel}
          <FaArrowRight className="text-xs transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
