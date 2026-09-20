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
  FaPlane,
} from "react-icons/fa";
import { CATEGORIES } from "../products/product";
import { site } from "../data/site";
import { localePath } from "@/app/i18n/config";
import Logo from "./Logo";
import SearchBar from "./SearchBar";
import PlaceChip from "./PlaceChip";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header({ locale = "en", dict }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [toursOpen, setToursOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const nav = dict?.nav ?? {};
  const cats = dict?.categories ?? {};
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

  // Close everything on navigation. Adjusted during render rather than in an
  // effect — an effect would paint the open menu once before closing it.
  const [renderedPath, setRenderedPath] = useState(pathname);
  if (renderedPath !== pathname) {
    setRenderedPath(pathname);
    setMobileOpen(false);
    setToursOpen(false);
  }

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  // Two label sets: the bar is tight, the mobile sheet has room. Without the
  // short forms "Airport transfers" and "About PPP" wrap onto two lines and
  // the whole row loses its baseline.
  const links = [
    {
      href: path("/tours"),
      label: nav.tours ?? "Things to do",
      short: nav.toursShort ?? nav.tours ?? "Things to do",
    },
    {
      href: path("/transfers"),
      label: nav.transfers ?? "Airport transfers",
      short: nav.transfersShort ?? "Transfers",
    },
    {
      href: path("/destinations"),
      label: nav.destinations ?? "Destinations",
      short: nav.destinationsShort ?? nav.destinations ?? "Destinations",
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
            {/* The resort picker lives here rather than in the main row: it is a
                persistent setting, not navigation, and the row below has no space
                left once the nav and the booking button are in it. */}
            <PlaceChip dict={dict} compact />
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
              <FaWhatsapp className="text-sm" />
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
        className={`sticky top-0 z-50 transition-all duration-300 ${
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
            {/*
              This was a <button> that only toggled the dropdown, which left the
              desktop bar with no link to /tours at all — the full catalogue was
              reachable from the footer, the hero and the dropdown's contents,
              but not from the nav item named after it. It is a link now; the
              dropdown still opens on hover, and on focus so it is reachable
              from the keyboard without swallowing the click.
            */}
            <div
              className="relative"
              onMouseEnter={() => setToursOpen(true)}
              onMouseLeave={() => setToursOpen(false)}
            >
              <Link
                href={links[0].href}
                onFocus={() => setToursOpen(true)}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-[0.9rem] font-medium transition ${
                  overHero
                    ? "text-white/90 hover:bg-white/10 hover:text-white"
                    : "text-ink/75 hover:bg-ink/5 hover:text-ink"
                }`}
              >
                {nav.toursShort ?? nav.tours ?? "Things to do"}
                <FaChevronDown
                  className={`text-[0.6rem] transition-transform duration-200 ${
                    toursOpen ? "rotate-180" : ""
                  }`}
                />
              </Link>

              {toursOpen && (
                <div className="absolute left-0 top-full w-[30rem] pt-3">
                  <div className="animate-fade-up overflow-hidden rounded-2xl border border-ink/[0.07] bg-white p-2 shadow-lift">
                    <div className="grid grid-cols-2 gap-1">
                      {CATEGORIES.map((c) => (
                        <Link
                          key={c.type}
                          href={
                            c.type === "transfers"
                              ? path("/transfers")
                              : path(`/category/${c.type}`)
                          }
                          className="rounded-xl px-3 py-2.5 transition hover:bg-crimson-50"
                        >
                          <span className="block text-sm font-medium text-ink">
                            {cats[c.type]?.title ?? c.title}
                          </span>
                          {c.parish && (
                            <span className="mt-0.5 block text-xs text-ink/45">
                              {c.parish}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {links.slice(1).map((l) => (
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
            <div className="hidden md:block">
              <SearchBar compact light={overHero} locale={locale} dict={dict} />
            </div>
            <LanguageSwitcher locale={locale} light={overHero} />

            <a
              href={site.contact.whatsappHref}
              target="_blank"
              rel="noreferrer"
              className="hidden shrink-0 items-center gap-2 whitespace-nowrap rounded-full bg-crimson-600 px-4 py-2.5 text-[0.9rem] font-semibold text-white shadow-glow transition hover:bg-crimson-700 lg:flex"
            >
              <FaWhatsapp className="text-base" />
              {nav.book ?? "Book now"}
            </a>

            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label={nav.openMenu ?? "Open menu"}
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition lg:hidden ${
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
          <div className="absolute inset-y-0 right-0 flex w-[min(22rem,88vw)] flex-col overflow-y-auto bg-white shadow-lift">
            <div className="flex items-center justify-between border-b border-ink/[0.07] px-5 py-4">
              <Logo />
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label={nav.closeMenu ?? "Close menu"}
                className="grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-ink/60 transition hover:bg-ink/10"
              >
                <FaTimes />
              </button>
            </div>

            <div className="border-b border-ink/[0.07] px-4 py-3">
              <PlaceChip dict={dict} className="w-full !max-w-none justify-start" />
            </div>

            <div className="px-4 py-3">
              <SearchBar locale={locale} dict={dict} onNavigate={() => setMobileOpen(false)} />
            </div>

            <nav className="flex-1 px-3 pb-4">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="block rounded-xl px-4 py-3 text-sm font-semibold text-ink transition hover:bg-crimson-50"
                >
                  {l.label}
                </Link>
              ))}

              <p className="px-4 pb-2 pt-5 text-[0.68rem] font-semibold uppercase tracking-wider text-ink/40">
                {nav.browse ?? "Browse"}
              </p>
              {CATEGORIES.map((c) => (
                <Link
                  key={c.type}
                  href={
                    c.type === "transfers"
                      ? path("/transfers")
                      : path(`/category/${c.type}`)
                  }
                  className="block rounded-xl px-4 py-2.5 text-sm text-ink/70 transition hover:bg-crimson-50"
                >
                  {cats[c.type]?.title ?? c.title}
                </Link>
              ))}
            </nav>

            <div className="space-y-2 border-t border-ink/[0.07] p-4">
              <a
                href={site.contact.whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="btn-primary w-full"
              >
                <FaWhatsapp className="text-lg" />
                {nav.book ?? "Book now"}
              </a>
              <a href={site.contact.phoneHref} className="btn-ghost w-full">
                <FaPhoneAlt className="text-xs" />
                {site.contact.phone}
              </a>
              <Link href={path("/transfers")} className="btn-ghost w-full">
                <FaPlane className="text-xs" />
                {nav.transfers ?? "Airport transfers"}
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
