import Link from "next/link";
import Image from "next/image";
import { FaArrowRight } from "react-icons/fa";

export const metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <section className="relative isolate -mt-[4.5rem] flex min-h-[38rem] items-center overflow-hidden bg-ink lg:-mt-20">
      <Image
        src="/local/hero-3.jpg"
        alt=""
        fill
        sizes="100vw"
        className="object-cover opacity-25"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-t from-ink via-ink/85 to-ink/60"
      />

      <div className="shell relative pt-24 text-center">
        <p className="eyebrow-light">404</p>
        <h1 className="mt-3 font-display text-4xl font-semibold text-white sm:text-5xl">
          That road doesn&apos;t go anywhere.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-white/65">
          The page you were after has moved or never existed. Let&apos;s get you back
          on route.
        </p>
        <div className="mt-9 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn-gold group">
            Back to home
            <FaArrowRight className="text-xs transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link href="/tours" className="btn-ghost-light">
            Browse all tours
          </Link>
        </div>
      </div>
    </section>
  );
}
