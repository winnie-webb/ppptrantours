"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FaBars, FaTimes, FaPhoneAlt, FaWhatsapp, FaArrowRight } from "react-icons/fa";
import { site } from "../data/site";
import { localePath } from "@/app/i18n/config";
import Logo from "./Logo";
import LanguageSwitcher from "./LanguageSwitcher";

/**
 * A flat, four-item nav — 03_INFORMATION_ARCHITECTURE.md §2.
 *
 * This used to carry a hover mega-menu under "Things to do" (every
 * region/category as a tile) and a header search over tours and hotels.
 * Both are gone on purpose, not trimmed: regions are chips on /tours now,
 * not a menu a guest has to open first to find them, and a hotel is
 * searched inside the booking tool itself, where the answer changes a
 * price — a second search box duplicating that one more often confused
 * guests than it saved them a tap. "Revisit if analytics show search
 * usage" is the IA doc's own hedge on that call, not a instruction to
 * bring it back speculatively.
 */
export default function Header({ locale = "en", dict }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const nav = dict?.nav ?? {};
  const path = (p) => localePath(locale, p);

  // The homepage hero sits behind a transparent header; every other page needs
  // the solid treatment from the first pixel.
  const overHero = pathname === path("/") && !scrolled;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile sheet on navigation. Adjusted during render rather than
  // in an effect — an effect would paint the open menu once before closing it.
  const [renderedPath, setRenderedPath] = useState(pathname);
  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    setMobileOpen(false);
  }

  const menuButtonRef = useRef(null);
  const sheetRef = useRef(null);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    if (!mobileOpen) return;

    const sheet = sheetRef.current;
    const trigger = menuButtonRef.current;
    const focusables = () =>
      sheet?.querySelectorAll(
        'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ) ?? [];
    focusables()[0]?.focus();

    const onKey = (e) => {
      if (e.key === "Escape") return setMobileOpen(false);
      if (e.key !== "Tab") return;
      const list = focusables();
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
      trigger?.focus();
    };
  }, [mobileOpen]);

  const links = [
    {
      href: path("/transfers"),
      label: nav.transfers ?? "Airport transfers",
      short: nav.transfersShort ?? "Transfers",
    },
    {
      href: path("/tours"),
      label: nav.tours ?? "Tours",
      short: nav.toursShort ?? nav.tours ?? "Tours",
    },
    {
      href: path("/about-us"),
      label: nav.about ?? "About PPP",
      short: nav.aboutShort ?? "About",
    },
    {
      href: path("/contact-us"),
      label: nav.contact ?? "Contact",
      short: nav.contact ?? "Contact",
    },
  ];

  const isActive = (href) =>
    href === path("/") ? pathname === href : pathname.startsWith(href);

  /*
   * The header CTA is "Book a transfer" everywhere except the page that IS
   * that action — a guest already on /transfers or a /transfer/[hotel] page
   * does not need the header repeating the button they are standing on, so
   * it offers the other product instead (03_INFORMATION_ARCHITECTURE.md §2).
   */
  const onTransferPages =
    pathname.startsWith(path("/transfers")) || pathname.startsWith(path("/transfer/"));
  const headerCta = onTransferPages
    ? { href: path("/tours"), label: nav.tours ?? "Tours" }
    : { href: path("/transfers"), label: nav.bookTransfer ?? "Book a transfer" };

  return (
    <>
      {/* Utility strip */}
      <div className="hidden bg-ink text-white/70 lg:block">
        <div className="shell flex h-9 items-center justify-between gap-4 text-xs">
          <div className="flex min-w-0 items-center gap-3">
            <p className="hidden truncate tracking-wide 2xl:block">
              {nav.licensed ??
                "Licensed by the Jamaica Tourist Board & Transport Authority"}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-5">
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
              <FaWhatsapp className="text-sm text-whatsapp" />
              WhatsApp
            </a>
            <a
              href={site.contact.emailHref}
              className="hidden transition hover:text-white xl:block"
            >
              {site.contact.email}
            </a>
          </div>
        </div>
      </div>

      <header
        className={`sticky top-0 z-50 transform-gpu transition-all duration-300 ${
          overHero
            ? "bg-transparent"
            : "border-b border-ink/[0.07] bg-white/85 shadow-[0_1px_24px_-12px_rgba(7,17,13,.25)] backdrop-blur-xl"
        }`}
      >
        <div className="shell flex h-[4.5rem] items-center gap-2 lg:h-20 lg:gap-3">
          <Link href={path("/")} aria-label={`${site.name} home`} className="shrink-0">
            <Logo light={overHero} />
          </Link>

          {/* Desktop nav */}
          <nav className="ml-1 hidden items-center gap-0.5 lg:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`whitespace-nowrap rounded-full px-3 py-2 text-[0.9rem] font-medium transition ${
                  overHero
                    ? `text-white/90 hover:bg-white/10 hover:text-white ${
                        isActive(l.href) ? "bg-white/10" : ""
                      }`
                    : `text-ink/75 hover:bg-ink/5 hover:text-ink ${
                        isActive(l.href) ? "bg-ink/5 text-ink" : ""
                      }`
                }`}
              >
                {l.short}
              </Link>
            ))}
          </nav>

          <div className="ml-auto flex shrink-0 items-center gap-1.5">
            <LanguageSwitcher locale={locale} light={overHero} />

            <Link
              href={headerCta.href}
              className="hidden shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-crimson-600 px-4 py-2.5 text-[0.9rem] font-semibold text-white shadow-glow transition hover:bg-crimson-700 lg:flex"
            >
              {headerCta.label}
              <FaArrowRight className="text-xs" />
            </Link>

            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label={nav.openMenu ?? "Open menu"}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              className={`grid h-11 w-11 shrink-0 place-items-center rounded-full transition lg:hidden ${
                overHero
                  ? "bg-white/15 text-white hover:bg-white/25"
                  : "bg-ink/5 text-ink/70 hover:bg-ink/10"
              }`}
            >
              <FaBars />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile sheet */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[70] lg:hidden">
          <div
            className="absolute inset-0 bg-ink/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            role="presentation"
          />
          <div
            ref={sheetRef}
            id="mobile-menu"
            role="dialog"
            aria-modal="true"
            aria-label={nav.menu ?? "Menu"}
            className="absolute inset-y-0 right-0 flex w-[min(22rem,88vw)] flex-col overflow-y-auto bg-white shadow-lift"
          >
            <div className="flex items-center justify-between border-b border-ink/[0.07] px-5 py-4">
              <Logo />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label={nav.closeMenu ?? "Close menu"}
                className="grid h-11 w-11 place-items-center rounded-full bg-ink/5 text-ink/70 transition hover:bg-ink/10"
              >
                <FaTimes />
              </button>
            </div>

            <nav className="flex-1 px-3 pb-4 pt-3">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="block rounded-xl px-4 py-3 text-base font-semibold text-ink transition hover:bg-crimson-50"
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="space-y-2 border-t border-ink/[0.07] p-4">
              <Link href={headerCta.href} className="btn-primary w-full">
                {headerCta.label}
                <FaArrowRight className="text-xs" />
              </Link>
              <a
                href={site.contact.whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="btn-ghost w-full"
              >
                <FaWhatsapp className="text-base text-whatsapp" />
                WhatsApp {site.contact.phone}
              </a>
              <a href={site.contact.phoneHref} className="btn-ghost w-full">
                <FaPhoneAlt className="text-xs" />
                {site.contact.phone}
              </a>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
