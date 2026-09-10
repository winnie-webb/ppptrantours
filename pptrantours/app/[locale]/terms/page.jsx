import PageHeader from "@/app/components/PageHeader";
import PolicyDocument from "@/app/components/PolicyDocument";
import CtaBand from "@/app/components/CtaBand";
import { bookingTerms } from "@/app/data/policies";
import { LOCALES, localePath } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/dictionaries";
import { clientDict } from "@/app/i18n/client";
import { languageAlternates } from "../layout";

/**
 * Booking terms, including cancellation and refunds.
 *
 * The prose is English only and says so — `policies.js` closes with a governing
 * -language clause. Translating a contract with an automated pass would be
 * worse than not translating it: a mistranslated cancellation window is a term
 * a guest can hold the company to.
 */
export function generateStaticParams() {
  return LOCALES.map((l) => ({ locale: l.code }));
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const t = dict.termsPage ?? {};

  return {
    title: t.metaTitle ?? "Booking terms & cancellation policy",
    description:
      t.metaDescription ??
      "How a PPP Tran Tours booking is confirmed, what the price covers, how to cancel or change it, and when a refund is due.",
    alternates: {
      canonical: localePath(locale, "/terms"),
      languages: languageAlternates("/terms"),
    },
  };
}

export default async function TermsPage({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const client = clientDict(dict);
  const t = dict.termsPage ?? {};

  return (
    <>
      <PageHeader
        eyebrow={t.eyebrow ?? "The small print, in plain words"}
        title={t.title ?? "Booking terms"}
        description={
          t.description ??
          "What you are agreeing to when you book, what the price includes, and exactly what happens if plans change."
        }
        image="/ppp/banner-sunset.jpg"
        locale={locale}
        homeLabel={dict.nav?.home ?? "Home"}
        breadcrumbs={[{ label: t.crumb ?? "Booking terms" }]}
      />

      <PolicyDocument sections={bookingTerms} updated="10 September 2026" />

      <CtaBand locale={locale} dict={client} />
    </>
  );
}
