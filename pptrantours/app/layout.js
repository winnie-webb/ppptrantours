import "./globals.css";
import { Plus_Jakarta_Sans, Fraunces } from "next/font/google";
import Header from "./components/Header";
import Footer from "./components/Footer";
import WhatsAppFab from "./components/WhatsAppFab";
import { site } from "./data/site";

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

export const metadata = {
  metadataBase: new URL("https://ppptrantours.com"),
  title: {
    default: `${site.longName} — ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description: site.descriptor,
  keywords: [
    "Jamaica airport transfer",
    "Montego Bay private tours",
    "Sangster airport transfer",
    "Negril tours",
    "Ocho Rios excursions",
    "Falmouth cruise excursions",
    "PPP Tran Tours",
  ],
  openGraph: {
    title: `${site.longName} — ${site.tagline}`,
    description: site.descriptor,
    type: "website",
    locale: "en_JM",
    siteName: site.legalName,
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export const viewport = {
  themeColor: "#a80424",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable}`}>
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <WhatsAppFab />
      </body>
    </html>
  );
}
