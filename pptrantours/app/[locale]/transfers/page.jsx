import { PLACES } from "@/app/data/places";
import { money, minimumFare, MIN_BILLED_PAX } from "@/app/products/pricing";
import PageHeader from "@/app/components/PageHeader";
import TransferBooking from "@/app/components/TransferBooking";
import CtaBand from "@/app/components/CtaBand";
import { LOCALES, localePath } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/dictionaries";
import JsonLd from "@/app/components/JsonLd";
import { site } from "@/app/data/site";
import { transferListSchema } from "@/app/data/schema";
import { clientDict } from "@/app/i18n/client";
import { paymentsConfigured, paypalPublicConfig } from "@/lib/payments";
import { languageAlternates } from "../layout";

export function generateStaticParams() {
  return LOCALES.map((l) => ({ locale: l.code }));
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const client = clientDict(dict);
  const t = dict.transfersPage ?? {};

  return {
    title: t.metaTitle ?? "Montego Bay Airport Transfers",
    description: t.metaDescription,
    alternates: {
      canonical: localePath(locale, "/transfers"),
      languages: languageAlternates("/transfers"),
    },
  };
}

export default async function TransfersPage({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const client = clientDict(dict);
  const t = dict.transfersPage ?? {};

  // A total, like every other figure on this page. The cheapest published
  // one-way rate is $5, and nobody has ever been charged $5 for a transfer.
  const cheapest = minimumFare(
    Math.min(...PLACES.filter((p) => p.transfer).map((p) => p.transfer.oneWay))
  );

  return (
    <>
      <JsonLd
        data={transferListSchema(site.url, (path) => localePath(locale, path))}
      />

      <PageHeader
        eyebrow={t.eyebrow ?? "Airport transfers"}
        title={t.title ?? "Sangster International to your front door."}
        description={
          t.description ??
          `Published fares to every resort we serve, from ${money(cheapest)} for up to ${MIN_BILLED_PAX} passengers. Pick your hotel below and book it on this page.`
        }
        image="/ppp/donovan-airport-van.jpg"
      />

      {/* Lifted over the banner. PageHeader is positioned, so a static sibling
          pulled up by a negative margin paints behind it however late it comes
          in the DOM — this needs its own stacking position to sit on top. */}
      <section className="shell relative z-10 -mt-10 pb-14 lg:-mt-16">
        <TransferBooking
          locale={locale}
          dict={client}
          /* Must match the title /transfer/[place] builds for the same resort;
             the API stores whatever the client posts. */
          titlePrefix={dict.transferPage?.transferTo ?? "Airport transfer to"}
          /* Server-only env, so the page has to hand these down. */
          paymentsEnabled={paymentsConfigured("USD")}
          paypal={paypalPublicConfig("USD")}
        />
      </section>

      <CtaBand locale={locale} dict={dict} />
    </>
  );
}
