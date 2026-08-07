import {
  FaPhoneAlt,
  FaWhatsapp,
  FaEnvelope,
  FaMapMarkerAlt,
  FaClock,
} from "react-icons/fa";
import PageHeader from "../components/PageHeader";
import FaqAccordion from "../components/FaqAccordion";
import SectionHeading from "../components/SectionHeading";
import ContactForm from "./ContactForm";
import { site } from "../data/site";

export const metadata = {
  title: "Contact & FAQ",
  description:
    "Reach PPP Tran Tours Jamaica by phone, WhatsApp or email — or send us your dates and we'll build the day around them.",
};

const CHANNELS = [
  {
    Icon: FaWhatsapp,
    label: "WhatsApp / Messenger",
    value: site.contact.phone,
    href: site.contact.whatsappHref,
    note: "Fastest way to reach us",
    external: true,
  },
  {
    Icon: FaPhoneAlt,
    label: "Call us",
    value: site.contact.phone,
    href: site.contact.phoneHref,
    note: "Dispatch, 6am – 10pm daily",
  },
  {
    Icon: FaEnvelope,
    label: "Email",
    value: site.contact.email,
    href: site.contact.emailHref,
    note: "Replies within a few hours",
  },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader
        eyebrow="Get in touch"
        title="Tell us your dates. We'll do the rest."
        description="Send your flight number, hotel and group size and we'll come back with a plan and a firm price — usually within the hour."
        image="/local/hero-1.jpg"
        breadcrumbs={[{ label: "Contact" }]}
      />

      {/* Channels — lifted over the banner, so it needs to win the stacking order. */}
      <section className="shell relative z-10 -mt-8 lg:-mt-12">
        <div className="grid gap-4 sm:grid-cols-3">
          {CHANNELS.map(({ Icon, label, value, href, note, external }) => (
            <a
              key={label}
              href={href}
              {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
              className="group card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-crimson-50 text-crimson-600 transition-colors group-hover:bg-crimson-600 group-hover:text-white">
                <Icon className="text-lg" />
              </span>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-ink/45">
                {label}
              </p>
              <p className="mt-1 break-all font-display text-lg font-semibold text-ink">
                {value}
              </p>
              <p className="mt-1 text-xs text-ink/50">{note}</p>
            </a>
          ))}
        </div>
      </section>

      {/* Form + details */}
      <section className="shell py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
          <div>
            <SectionHeading
              eyebrow="Send a message"
              title="Plan your day with us."
              description="No payment is taken here — we confirm availability and price first."
            />
            <ContactForm />
          </div>

          <aside className="space-y-6">
            <div className="card p-7">
              <h3 className="font-display text-xl font-semibold text-ink">
                Where to find us
              </h3>
              <ul className="mt-5 space-y-5 text-sm">
                <li className="flex gap-3.5">
                  <FaMapMarkerAlt className="mt-1 shrink-0 text-crimson-600" />
                  <address className="not-italic leading-relaxed text-ink/70">
                    {site.address.line1}
                    <br />
                    {site.address.line2}
                    <br />
                    {site.address.city}, {site.address.parish}
                    <br />
                    {site.address.country}
                  </address>
                </li>
                <li className="flex gap-3.5">
                  <FaClock className="mt-1 shrink-0 text-crimson-600" />
                  <span className="leading-relaxed text-ink/70">{site.hours}</span>
                </li>
              </ul>
            </div>

            <div className="overflow-hidden rounded-2xl border border-ink/[0.07] shadow-card">
              <iframe
                title="PPP Tran Tours location in Montego Bay"
                src="https://www.google.com/maps?q=White%20Sands%20Beach%2C%20Montego%20Bay%2C%20Jamaica&output=embed"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="h-72 w-full border-0"
              />
            </div>

            <div className="rounded-2xl bg-ink p-7 text-white">
              <h3 className="font-display text-xl font-semibold">
                Booking an airport transfer?
              </h3>
              <p className="mt-2.5 text-sm leading-relaxed text-white/65">
                Have your flight number, landing time and hotel name ready. With those
                three things we can confirm on the spot — and we track the flight, so a
                delay costs you nothing.
              </p>
              <a
                href={site.contact.whatsappHref}
                target="_blank"
                rel="noreferrer"
                className="btn-gold mt-6 w-full"
              >
                <FaWhatsapp className="text-lg" />
                Send flight details
              </a>
            </div>
          </aside>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-sand py-16 lg:py-24">
        <div className="shell">
          <SectionHeading
            align="center"
            eyebrow="FAQ"
            title="Everything else, answered."
          />
          <div className="mx-auto max-w-3xl">
            <FaqAccordion />
          </div>
        </div>
      </section>
    </>
  );
}
