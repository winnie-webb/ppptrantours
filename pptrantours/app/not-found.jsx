import "./globals.css";
import Link from "next/link";
import { Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import { FaArrowRight, FaWhatsapp } from "react-icons/fa";
import { site } from "@/app/data/site";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const display = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  axes: ["SOFT", "WONK", "opsz"],
});

export const metadata = {
  title: "Page not found | PPP Tran Tours",
  robots: { index: false, follow: false },
};

/**
 * The 404 for URLs that match no route at all.
 *
 * `app/[locale]/not-found.jsx` only covers `notFound()` raised *inside* a
 * matched locale route. A path that resolves to nothing — a typo, a stale
 * inbound link from the years the old site served blank pages — never enters
 * the `[locale]` segment, so it fell through to Next's stock "This page could
 * not be found": no branding, no header, no way back.
 *
 * This renders `<html>` and `<body>` itself because `app/layout.js` is a
 * deliberate passthrough (the `lang` attribute has to be the served locale,
 * which only the `[locale]` layout knows). There is no locale here, so the
 * document is English and the links are unprefixed — which is exactly what the
 * bare paths serve.
 *
 * Kept self-contained on purpose: no Header, no Footer, no PlaceProvider. Those
 * need a dictionary and a locale, and neither exists on this route.
 */
export default function NotFound() {
  return (
    <html lang="en" dir="ltr" data-scroll-behavior="smooth" className={`${sans.variable} ${display.variable}`}>
      <body className="flex min-h-screen flex-col bg-ink">
        <main className="flex flex-1 items-center justify-center px-5 py-20">
          <div className="mx-auto max-w-lg text-center">
            <p className="eyebrow-light">404</p>
            <h1 className="mt-3 font-display text-4xl font-semibold text-white sm:text-5xl">
              That road doesn&apos;t go anywhere.
            </h1>
            <p className="mx-auto mt-4 max-w-md text-white/70">
              The page you were after has moved or never existed. Let&apos;s get you
              back on route — or just tell us where you&apos;re staying and
              we&apos;ll quote the ride.
            </p>

            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link href="/" className="btn-gold group">
                Back to home
                <FaArrowRight className="text-xs transition-transform group-hover:translate-x-0.5" />
              </Link>
              <Link href="/transfers" className="btn-ghost-light">
                Airport transfer rates
              </Link>
              <Link href="/tours" className="btn-ghost-light">
                Browse all tours
              </Link>
            </div>

            <a
              href={site.contact.whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-gold-400 hover:text-gold-300"
            >
              <FaWhatsapp className="text-base text-whatsapp" />
              {site.contact.phone}
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
