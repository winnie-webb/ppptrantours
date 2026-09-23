import "../globals.css";
import { notFound } from "next/navigation";
import { Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import WhatsAppFab from "@/app/components/WhatsAppFab";
import { PlaceProvider } from "@/app/components/PlaceProvider";
import PlacePicker from "@/app/components/PlacePicker";
import JsonLd from "@/app/components/JsonLd";
import { site } from "@/app/data/site";
import { organizationSchema, websiteSchema } from "@/app/data/schema";
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

const BASE = site.url;

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
    /*
     * `images` and `url` are not optional here.
     *
     * Setting an explicit `openGraph` object supersedes the
     * `app/opengraph-image.jpg` file convention entirely, so this block
     * previously shipped a `twitter:card` of `summary_large_image` with no
     * image to put in it — and WhatsApp is where this company's links actually
     * get pasted. Every page except `tour/[id]` (which sets its own) inherits
     * this one.
     */
    openGraph: {
      title: `${site.longName} — ${meta.tagline}`,
      description: meta.description,
      type: "website",
      locale,
      siteName: site.legalName,
      url: localePath(locale, "/"),
      images: [
        {
          url: "/opengraph-image.jpg",
          width: 1200,
          height: 630,
          alt: `${site.longName} — ${meta.tagline}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${site.longName} — ${meta.tagline}`,
      description: meta.description,
      images: ["/opengraph-image.jpg"],
    },
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
        <a href="#main" className="skip-link">
          {dict.common?.skipToContent ?? "Skip to content"}
        </a>
        <PlaceProvider>
          <Header locale={locale} dict={client} />
          <main id="main" tabIndex={-1} className="flex-1 outline-none">
            {children}
          </main>
          <Footer locale={locale} dict={dict} />
          <WhatsAppFab dict={client} />
          <PlacePicker dict={client} />
        </PlaceProvider>

        {/*
          One organization node for the whole site, referenced by @id from the
          per-page Product/Service graphs rather than repeated in each. Emitted
          once per locale, which is correct: each locale is its own document.
        */}
        <JsonLd data={[organizationSchema(BASE), websiteSchema(BASE)]} />
      </body>
    </html>
  );
}
