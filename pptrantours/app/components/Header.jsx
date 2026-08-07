"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FaBars,
  FaTimes,
  FaChevronDown,
  FaPhoneAlt,
  FaWhatsapp,
} from "react-icons/fa";
import { CATEGORIES } from "../products/product";
import { site } from "../data/site";
import Logo from "./Logo";
import SearchBar from "./SearchBar";

export default function Header() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toursOpen, setToursOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // The homepage hero sits behind a transparent header; every other page needs
  // the solid treatment from the first pixel.
  const overHero = pathname === "/" && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close everything on navigation. Adjusted during render rather than in an
  // effect — an effect would paint the open menu once before closing it.
  const [renderedPath, setRenderedPath] = useState(pathname);
  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    setMobileOpen(false);
    setToursOpen(false);
  }

  // Lock body scroll while the mobile sheet is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const isActive = (href) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <>
      {/* Utility strip */}
      <div className="hidden bg-ink text-white/70 lg:block">
        <div className="shell flex h-9 items-center justify-between text-xs">
          <p className="tracking-wide">
            Licensed by the Jamaica Tourist Board &amp; Transport Authority
          </p>
          <div className="flex items-center gap-6">
            <a
              href={site.contact.phoneHref}
              className="flex items-center gap-2 transition hover:text-white"
            >
              <FaPhoneAlt className="text-[0.65rem]" />
              {site.contact.phone}
            </a>
            <a
              href={site.contact.whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-2 transition hover:text-white"
            >
              <FaWhatsapp className="text-sm" />
              WhatsApp
            </a>
            <a
              href={site.contact.emailHref}
              className="transition hover:text-white"
            >
              {site.contact.email}
            </a>
          </div>
        </div>
      </div>

      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          overHero
            ? "bg-transparent"
            : "border-b border-ink/[0.07] bg-white/85 shadow-[0_1px_24px_-12px_rgba(7,17,13,.25)] backdrop-blur-xl"
        }`}
      >
        <div className="shell flex h-[4.5rem] items-center gap-4 lg:h-20 lg:gap-8">
          <Link href="/" aria-label={`${site.name} home`} className="shrink-0">
            <Logo light={overHero} />
          </Link>

          {/* Desktop nav */}
          <nav className="ml-2 hidden items-center gap-1 lg:flex">
            <div
              className="relative"
              onMouseEnter={() => setToursOpen(true)}
              onMouseLeave={() => setToursOpen(false)}
            >
              <button
                type="button"
                onClick={() => setToursOpen((v) => !v)}
                aria-expanded={toursOpen}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition ${
                  overHero
                    ? "text-white/90 hover:bg-white/10 hover:text-white"
                    : "text-ink/75 hover:bg-ink/5 hover:text-ink"
                }`}
              >
                Tours
                <FaChevronDown
                  className={`text-[0.6rem] transition-transform duration-200 ${
                    toursOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {toursOpen && (
                <div className="absolute left-0 top-full w-[30rem] pt-3">
                  <div className="animate-fade-up overflow-hidden rounded-2xl border border-ink/[0.07] bg-white p-2 shadow-lift">
                    <div className="grid grid-cols-2 gap-1">
                      {CATEGORIES.map((c) => (
                        <Link
                          key={c.type}
                          href={`/category/${c.type}`}
                          className="rounded-xl px-3 py-2.5 text-sm text-ink/75 transition hover:bg-crimson-50 hover:text-crimson-700"
                        >
                          {c.title}
                        </Link>
                      ))}
                    </div>
                    <Link
                      href="/tours"
                      className="mt-1 block rounded-xl bg-ink px-3 py-3 text-center text-sm font-semibold text-white transition hover:bg-ink-700"
                    >
                      Browse all 100+ tours &amp; transfers
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {[
              { href: "/destinations", label: "Destinations" },
              { href: "/about-us", label: "About PPP" },
              { href: "/contact-us", label: "Contact" },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  overHero
                    ? `text-white/90 hover:bg-white/10 hover:text-white ${
                        isActive(l.href) ? "bg-white/10 text-white" : ""
                      }`
                    : `text-ink/75 hover:bg-ink/5 hover:text-ink ${
                        isActive(l.href) ? "bg-ink/5 text-ink" : ""
                      }`
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-3 lg:flex">
            <SearchBar compact light={overHero} />
            <Link href="/tours" className="btn-primary whitespace-nowrap">
              Book Now
            </Link>
          </div>

          {/* Mobile trigger */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
            className={`ml-auto grid h-11 w-11 place-items-center rounded-full transition lg:hidden ${
              overHero ? "bg-white/15 text-white" : "bg-ink/5 text-ink"
            }`}
          >
            <FaBars />
          </button>
        </div>
      </header>

      {/* Mobile sheet */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <div
            className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex w-full max-w-sm animate-fade-in flex-col bg-white shadow-lift">
            <div className="flex h-[4.5rem] items-center justify-between border-b border-ink/[0.07] px-5">
              <Logo />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="grid h-10 w-10 place-items-center rounded-full bg-ink/5 text-ink"
              >
                <FaTimes />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-6">
              <SearchBar onNavigate={() => setMobileOpen(false)} />

              <p className="eyebrow mt-8">Tours &amp; Transfers</p>
              <div className="mt-3 space-y-0.5">
                {CATEGORIES.map((c) => (
                  <Link
                    key={c.type}
                    href={`/category/${c.type}`}
                    className="block rounded-xl px-3 py-2.5 text-[0.95rem] text-ink/80 transition hover:bg-crimson-50 hover:text-crimson-700"
                  >
                    {c.title}
                  </Link>
                ))}
              </div>

              <p className="eyebrow mt-8">Company</p>
              <div className="mt-3 space-y-0.5">
                {[
                  { href: "/tours", label: "All Tours" },
                  { href: "/destinations", label: "Destinations" },
                  { href: "/about-us", label: "About PPP" },
                  { href: "/contact-us", label: "Contact" },
                ].map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="block rounded-xl px-3 py-2.5 text-[0.95rem] text-ink/80 transition hover:bg-crimson-50 hover:text-crimson-700"
                  >
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="space-y-2 border-t border-ink/[0.07] p-5">
              <a
                href={site.contact.whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="btn-primary w-full"
              >
                <FaWhatsapp className="text-base" />
                WhatsApp {site.contact.phone}
              </a>
              <a href={site.contact.phoneHref} className="btn-ghost w-full">
                <FaPhoneAlt className="text-xs" />
                Call us
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
