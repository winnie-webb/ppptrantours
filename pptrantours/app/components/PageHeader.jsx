import Link from "next/link";
import Image from "next/image";
import { FaChevronRight } from "react-icons/fa";

/** Compact dark banner used at the top of every interior page. */
export default function PageHeader({
  eyebrow,
  title,
  description,
  image = "/local/hero-2.jpg",
  breadcrumbs = [],
  children,
}) {
  return (
    <section className="relative isolate -mt-[4.5rem] overflow-hidden bg-ink pb-14 pt-32 lg:-mt-20 lg:pb-20 lg:pt-44">
      <Image
        src={image}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover opacity-55"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-ink via-ink/75 to-ink/45"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-ink/75 to-transparent"
      />

      <div className="shell relative">
        {breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-5">
            <ol className="flex flex-wrap items-center gap-2 text-xs text-white/50">
              <li>
                <Link href="/" className="transition hover:text-white">
                  Home
                </Link>
              </li>
              {breadcrumbs.map((c) => (
                <li key={c.label} className="flex items-center gap-2">
                  <FaChevronRight className="text-[0.5rem] opacity-50" />
                  {c.href ? (
                    <Link href={c.href} className="transition hover:text-white">
                      {c.label}
                    </Link>
                  ) : (
                    <span className="text-white/80">{c.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {eyebrow && <p className="eyebrow-light">{eyebrow}</p>}
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-[1.08] text-white sm:text-5xl lg:text-[3.5rem]">
          {title}
        </h1>
        {description && (
          <p className="mt-5 max-w-2xl text-[1.05rem] leading-relaxed text-white/65">
            {description}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
