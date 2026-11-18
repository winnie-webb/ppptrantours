import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa";
import PageHeader from "@/app/components/PageHeader";
import FaqAccordion from "@/app/components/FaqAccordion";
import DriveTimes from "@/app/components/DriveTimes";
import SectionHeading from "@/app/components/SectionHeading";
import CtaBand from "@/app/components/CtaBand";
import JsonLd from "@/app/components/JsonLd";
import { site } from "@/app/data/site";
import { faqSchema } from "@/app/data/schema";
import { LOCALES, localePath } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/dictionaries";
import { languageAlternates } from "../layout";

export function generateStaticParams() {
  return LOCALES.map((l) => ({ locale: l.code }));
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const t = dict.faqPage ?? {};
  return {
    title: t.metaTitle ?? "FAQs",
    description: t.metaDescription,
    alternates: {
      canonical: localePath(locale, "/faq"),
      languages: languageAlternates("/faq"),
    },
  };
}

/** Group order on the page. A question with no group lands in the last one. */
const GROUPS = [
  { key: "cancel", title: "Cancellations & bad weather" },
  { key: "booking", title: "Booking & payment" },
  { key: "transfers", title: "Airport transfers" },
  { key: "tours", title: "Tours & cruise excursions" },
  { key: "vehicles", title: "Vehicles & groups" },
];

/**
 * Every FAQ on one page (owner, 2026-11-18: "in the spirit of user
 * friendliness can't we put all the questions and answers on one FAQs page?").
 *
 * Questions used to be split between the homepage and the bottom of Contact;
 * this is now the one place they all live, and the only page carrying the
 * FAQPage structured data. The homepage still shows a few, linking here.
 */
export default async function FaqPage({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const t = dict.faqPage ?? {};
  const faqs = dict.faqs ?? [];

  const lastGroup = GROUPS[GROUPS.length - 1].key;
  const groups = GROUPS.map((g) => ({
    ...g,
    title: t.groups?.[g.key] ?? g.title,
    items: faqs.filter((f) =>
      g.key === lastGroup
        ? f.group === g.key || !GROUPS.some((x) => x.key === f.group)
        : f.group === g.key
    ),
  })).filter((g) => g.items.length > 0);

  return (
    <>
      <JsonLd data={faqSchema(faqs)} />

      <PageHeader
        eyebrow={t.eyebrow ?? "FAQs"}
        title={t.title ?? "Every question, answered on one page."}
        description={t.description}
        image="/ppp/banner-sunset.jpg"
        locale={locale}
        homeLabel={dict.nav?.home ?? "Home"}
        breadcrumbs={[{ label: t.crumb ?? "FAQs" }]}
      />

      <section className="shell py-12 lg:py-16">
        <div className="mx-auto max-w-3xl">
          <nav aria-label={t.jump ?? "Jump to"} className="mb-10 flex flex-wrap items-center gap-2">
            <span className="mr-1 text-sm font-semibold text-ink/60">{t.jump ?? "Jump to"}</span>
            {groups.map((g) => (
              <a
                key={g.key}
                href={`#${g.key}`}
                className="rounded-full border border-ink/10 bg-white px-3.5 py-1.5 text-sm text-ink/75 shadow-card transition hover:border-crimson-200 hover:text-crimson-700"
              >
                {g.title}
              </a>
            ))}
            <a
              href="#drive-times"
              className="rounded-full border border-ink/10 bg-white px-3.5 py-1.5 text-sm text-ink/75 shadow-card transition hover:border-crimson-200 hover:text-crimson-700"
            >
              {dict.driveTimes?.eyebrow ?? "Drive times"}
            </a>
          </nav>

          <div className="space-y-12">
            {groups.map((g) => (
              <div key={g.key} id={g.key} className="scroll-mt-28">
                <h2 className="mb-4 font-display text-2xl font-semibold text-ink">{g.title}</h2>
                <FaqAccordion items={g.items} initialOpen={g.key === groups[0].key ? 0 : -1} />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="drive-times" className="scroll-mt-24 bg-sand py-16 lg:py-20">
        <div className="shell">
          <SectionHeading
            title={dict.driveTimes?.title ?? "How long is the drive?"}
            description={dict.driveTimes?.description}
          />
          <DriveTimes dict={dict} />
          <p className="mt-6 text-sm text-ink/70">
            <Link href={`${localePath(locale, "/about-us")}#vehicles`} className="font-semibold text-crimson-700 hover:underline">
              {dict.fleet?.title ?? "Our vehicles"}
            </Link>
            {" · "}
            <Link href={`${localePath(locale, "/terms")}#cancel`} className="font-semibold text-crimson-700 hover:underline">
              {dict.policyNote?.terms ?? "Read the booking terms"}
            </Link>
          </p>
        </div>
      </section>

      <section className="shell py-14 text-center">
        <h2 className="font-display text-2xl font-semibold text-ink">
          {t.stillTitle ?? "Still have a question?"}
        </h2>
        <p className="mt-2 text-ink/70">
          {t.stillBody ?? "Message us on WhatsApp — someone answers seven days a week."}
        </p>
        <a
          href={site.contact.whatsappHref}
          target="_blank"
          rel="noreferrer"
          className="btn-primary mt-6"
        >
          <FaWhatsapp className="text-base" />
          WhatsApp {site.contact.phone}
        </a>
      </section>

      <CtaBand locale={locale} dict={dict} />
    </>
  );
}
