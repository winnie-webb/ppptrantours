import PageHeader from "@/app/components/PageHeader";
import PolicyDocument from "@/app/components/PolicyDocument";
import CtaBand from "@/app/components/CtaBand";
import { privacyPolicy } from "@/app/data/policies";
import { LOCALES, localePath } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/dictionaries";
import { clientDict } from "@/app/i18n/client";
import { languageAlternates } from "../layout";

/**
 * Privacy policy.
 *
 * Not optional here: the booking form collects a name, an email, a phone
 * number, a hotel and a flight number, and the site ships de/fr/it/nl/pt/es
 * deliberately because European visitors are the target. That makes GDPR the
 * governing regime for a good share of the traffic.
 */
export function generateStaticParams() {
  return LOCALES.map((l) => ({ locale: l.code }));
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const t = dict.privacyPage ?? {};

  return {
    title: t.metaTitle ?? "Privacy policy",
    description:
      t.metaDescription ??
      "What PPP Tran Tours collects when you send a booking request, why, who else sees it, how long it is kept, and how to have it deleted.",
    alternates: {
      canonical: localePath(locale, "/privacy"),
      languages: languageAlternates("/privacy"),
    },
  };
}

export default async function PrivacyPage({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const client = clientDict(dict);
  const t = dict.privacyPage ?? {};

  return (
    <>
      <PageHeader
        eyebrow={t.eyebrow ?? "Your details"}
        title={t.title ?? "Privacy policy"}
        description={
          t.description ??
          "We ask for what is needed to meet you at an airport, and nothing else. No trackers, no advertising, no selling anything on."
        }
        image="/ppp/banner-sunset.jpg"
        locale={locale}
        homeLabel={dict.nav?.home ?? "Home"}
        breadcrumbs={[{ label: t.crumb ?? "Privacy" }]}
      />

      <PolicyDocument sections={privacyPolicy} updated="10 September 2026" />

      <CtaBand locale={locale} dict={client} />
    </>
  );
}
