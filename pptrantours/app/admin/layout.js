import "../globals.css";
import { Plus_Jakarta_Sans, Fraunces } from "next/font/google";

/**
 * The console's own document.
 *
 * `/admin` sits outside `app/[locale]`, and `app/layout.js` is a passthrough
 * that renders neither `<html>` nor `<body>` and imports no stylesheet — the
 * locale layout does both, because only it knows which language it is serving.
 * So this route was being served with no Tailwind at all: unstyled serif text,
 * a browser-default button, no layout. `app/not-found.jsx` is outside the
 * locale segment for the same reason and already carries its own copy of this.
 *
 * The fonts are declared here rather than imported from the locale layout on
 * purpose: `next/font` generates a distinct CSS variable per call site, and
 * sharing one instance across two independent document roots is not something
 * it supports.
 */

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
  title: "Bookings | PPP Tran Tours",
  robots: { index: false, follow: false, nocache: true },
};

export default function AdminLayout({ children }) {
  return (
    <html lang="en" dir="ltr" data-scroll-behavior="smooth" className={`${sans.variable} ${display.variable}`}>
      <body className="min-h-screen bg-sand">{children}</body>
    </html>
  );
}
