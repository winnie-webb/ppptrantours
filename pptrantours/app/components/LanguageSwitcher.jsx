"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { FaGlobe, FaCheck, FaChevronDown } from "react-icons/fa";
import { LOCALES, localePath, stripLocale } from "@/app/i18n/config";

/**
 * Language menu.
 *
 * Switching keeps you on the page you are reading — `/transfer/riu-reggae`
 * becomes `/es/transfer/riu-reggae`, not the Spanish homepage. Losing your
 * place is the thing that makes people give up on a translated site.
 *
 * These are real `<a>` elements, not router pushes, so each one is a crawlable
 * link between the language versions.
 */
export default function LanguageSwitcher({ locale, light = false }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const current = LOCALES.find((l) => l.code === locale) ?? LOCALES[0];
  const bare = stripLocale(pathname ?? "/");

  useEffect(() => {
    if (!open) return;
    const onClickAway = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClickAway);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickAway);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Language: ${current.name}`}
        className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition ${
          light
            ? "text-white/90 hover:bg-white/10 hover:text-white"
            : "text-ink/75 hover:bg-ink/5 hover:text-ink"
        }`}
      >
        <FaGlobe className="text-sm" />
        <span className="hidden sm:inline">{current.native}</span>
        <span className="sm:hidden">{current.code.toUpperCase()}</span>
        <FaChevronDown
          className={`text-[0.55rem] opacity-50 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-52 animate-fade-up overflow-hidden rounded-2xl border border-ink/[0.07] bg-white p-1.5 shadow-lift"
        >
          {LOCALES.map((l) => (
            <a
              key={l.code}
              href={localePath(l.code, bare)}
              hrefLang={l.hreflang}
              role="menuitem"
              lang={l.code}
              className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm transition hover:bg-crimson-50 ${
                l.code === locale
                  ? "font-semibold text-crimson-700"
                  : "text-ink/75"
              }`}
            >
              <span className="flex-1">{l.native}</span>
              <span className="text-xs text-ink/35">{l.name}</span>
              {l.code === locale && <FaCheck className="text-[0.6rem]" />}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
