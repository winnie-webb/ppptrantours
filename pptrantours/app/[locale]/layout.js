import "../globals.css";
import { notFound } from "next/navigation";
import { Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import WhatsAppFab from "@/app/components/WhatsAppFab";
import { PlaceProvider } from "@/app/components/PlaceProvider";
import PlacePicker from "@/app/components/PlacePicker";
import { site } from "@/app/data/site";
import {
  DEFAULT_LOCALE,
  LOCALES,
  getLocale,
  isLocale,
  localePath,
} from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/dictionaries";
import { clientDict } from "@/app/i18n/client";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const display = Fraunces({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  axes: ["SOFT", "WONK", "opsz"],
});

const BASE = "https://ppptrantoursjamaica.com";

export function generateStaticParams() {
  return LOCALES.map((l) => ({ locale: l.code }));
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const meta = dict.meta;

  return {
    metadataBase: new URL(BASE),
    title: {
      default: `${site.longName} — ${meta.tagline}`,
      template: `%s | ${site.name}`,
    },
    description: meta.description,
    keywords: meta.keywords,
    alternates: {
      canonical: localePath(locale, "/"),
      languages: languageAlternates("/"),
    },
    openGraph: {
      title: `${site.longName} — ${meta.tagline}`,
      description: meta.description,
      type: "website",
      locale,
      siteName: site.legalName,
    },
    twitter: { card: "summary_large_image" },
    robots: { index: true, follow: true },
  };
}

/**
 * hreflang for every language plus x-default.
 *
 * Exported because each page has to repeat it for its own path — Next merges
 * `alternates` shallowly, so a page that sets its own canonical without this
 * would silently drop the whole language map.
 */
export function languageAlternates(path) {
  const languages = Object.fromEntries(
    LOCALES.map((l) => [l.hreflang, localePath(l.code, path)])
  );
  return { ...languages, "x-default": localePath(DEFAULT_LOCALE, path) };
}

export const viewport = {
  themeColor: "#a80424",
};

export default async function LocaleLayout({ children, params }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);
  const client = clientDict(dict);
  const { dir } = getLocale(locale);

  return (
    <html lang={locale} dir={dir} className={`${sans.variable} ${display.variable}`}>
      <body className="flex min-h-screen flex-col">
        <PlaceProvider>
          <Header locale={locale} dict={client} />
          <main className="flex-1">{children}</main>
          <Footer locale={locale} dict={dict} />
          <WhatsAppFab dict={client} />
          <PlacePicker dict={client} />
        </PlaceProvider>
      </body>
    </html>
  );
}
