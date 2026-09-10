import Link from "next/link";
import {
  FaFacebookF,
  FaInstagram,
  FaTripadvisor,
  FaWhatsapp,
  FaPhoneAlt,
  FaEnvelope,
  FaMapMarkerAlt,
} from "react-icons/fa";
import { site, destinations } from "../data/site";
import { CATEGORIES } from "../products/product";
import { localePath } from "@/app/i18n/config";
import Logo from "./Logo";

const socials = [
  { href: site.social.tripadvisor, label: "Tripadvisor", Icon: FaTripadvisor },
  { href: site.social.facebook, label: "Facebook", Icon: FaFacebookF },
  { href: site.social.instagram, label: "Instagram", Icon: FaInstagram },
];

export default function Footer({ locale = "en", dict }) {
  const t = dict?.footer ?? {};
  const cats = dict?.categories ?? {};
  const path = (p) => localePath(locale, p);
  return (
    <footer className="relative overflow-hidden bg-ink text-white/65">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-crimson-600/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-gold-500/10 blur-3xl"
      />

      <div className="shell relative py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
          {/* Brand */}
          <div>
            <Logo light />
            <p className="mt-5 max-w-xs text-sm leading-relaxed">
              {dict?.meta?.description ?? site.descriptor}
            </p>
            <div className="mt-6 flex gap-2.5">
              {socials.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="grid h-10 w-10 place-items-center rounded-full bg-white/[0.07] text-white/75 transition hover:bg-crimson-600 hover:text-white"
                >
                  <Icon className="text-sm" />
                </a>
              ))}
            </div>
          </div>

          {/* Tours */}
          <nav aria-label="Tours">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              {t.tours ?? "Things to do"}
            </h3>
            <ul className="mt-5 space-y-2.5 text-sm">
              {CATEGORIES.slice(0, 6).map((c) => (
                <li key={c.type}>
                  <Link
                    href={
                      c.type === "transfers"
                        ? path("/transfers")
                        : path(`/category/${c.type}`)
                    }
                    className="transition hover:text-crimson-300"
                  >
                    {cats[c.type]?.title ?? c.title}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href={path("/tours")}
                  className="font-medium text-crimson-300 hover:text-crimson-200"
                >
                  {t.viewAll ?? "View all"} →
                </Link>
              </li>
            </ul>
          </nav>

          {/* Destinations */}
          <nav aria-label="Destinations">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              {t.destinations ?? "Destinations"}
            </h3>
            <ul className="mt-5 space-y-2.5 text-sm">
              {destinations.map((d) => (
                <li key={d.slug}>
                  <Link
                    href={path(`/destinations#${d.slug}`)}
                    className="transition hover:text-crimson-300"
                  >
                    {d.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link href={path("/about-us")} className="transition hover:text-crimson-300">
                  {t.about ?? "About PPP"}
                </Link>
              </li>
              <li>
                <Link href={path("/contact-us")} className="transition hover:text-crimson-300">
                  {t.contact ?? "Contact & FAQ"}
                </Link>
              </li>
            </ul>
          </nav>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">
              {t.getInTouch ?? "Get in touch"}
            </h3>
            <ul className="mt-5 space-y-4 text-sm">
              <li className="flex gap-3">
                <FaMapMarkerAlt className="mt-1 shrink-0 text-crimson-400" />
                <address className="not-italic leading-relaxed">
                  {site.address.line1}
                  <br />
                  {site.address.line2}
                  <br />
                  {site.address.city}, {site.address.parish}
                  <br />
                  {site.address.country}
                </address>
              </li>
              <li>
                <a
                  href={site.contact.phoneHref}
                  className="flex items-center gap-3 transition hover:text-crimson-300"
                >
                  <FaPhoneAlt className="shrink-0 text-crimson-400" />
                  {site.contact.phone}
                </a>
              </li>
              <li>
                <a
                  href={site.contact.whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 transition hover:text-crimson-300"
                >
                  <FaWhatsapp className="shrink-0 text-crimson-400" />
                  WhatsApp / Messenger
                </a>
              </li>
              <li>
                <a
                  href={site.contact.emailHref}
                  className="flex items-center gap-3 break-all transition hover:text-crimson-300"
                >
                  <FaEnvelope className="shrink-0 text-crimson-400" />
                  {site.contact.email}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-14 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {site.legalName}. {t.rights ?? "All rights reserved."}
          </p>
          <p className="text-white/45">
            {t.licensed ??
              "Licensed by the Jamaica Tourist Board & the Transport Authority of Jamaica."}
          </p>
        </div>
      </div>
    </footer>
  );
}
