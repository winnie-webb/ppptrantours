import Image from "next/image";
import Link from "next/link";
import { FaCheck, FaQuoteLeft, FaArrowRight } from "react-icons/fa";
import PageHeader from "@/app/components/PageHeader";
import StatsBar from "@/app/components/StatsBar";
import FleetSection from "@/app/components/FleetSection";
import GallerySection from "@/app/components/GallerySection";
import Testimonials from "@/app/components/Testimonials";
import CtaBand from "@/app/components/CtaBand";
import SectionHeading from "@/app/components/SectionHeading";
import { site, credentials, promise } from "@/app/data/site";
import SloganBand from "@/app/components/SloganBand";
import { LOCALES, localePath } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/dictionaries";
import { clientDict } from "@/app/i18n/client";
import { languageAlternates } from "../layout";

export function generateStaticParams() {
  return LOCALES.map((l) => ({ locale: l.code }));
}

export async function generateMetadata({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const t = dict.aboutPage ?? {};
  return {
    title: t.metaTitle ?? "About PPP",
    description: t.metaDescription,
    alternates: {
      canonical: localePath(locale, "/about-us"),
      languages: languageAlternates("/about-us"),
    },
  };
}

export default async function AboutPage({ params }) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const client = clientDict(dict);
  const t = dict.aboutPage ?? {};
  const words = dict.promise?.words ?? {};
  const creds = t.credentials ?? {};

  return (
    <>
      <PageHeader
        eyebrow={t.eyebrow ?? "About PPP"}
        title={t.title ?? "Private. Personalized. Professional."}
        description={
          t.description ??
          "Three words the company was named for, and the only three standards we've ever needed."
        }
        image="/ppp/banner-waterfall-guests.jpg"
        locale={locale}
        homeLabel={dict.nav?.home ?? "Home"}
        breadcrumbs={[{ label: t.crumb ?? "About PPP" }]}
      />

      <StatsBar dict={dict} />

      {/* Our history */}
      <section className="shell py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-20">
          <div>
            <SectionHeading
              eyebrow={t.historyEyebrow ?? "Our history"}
              title={t.historyTitle ?? "Built on repeat guests, not advertising."}
            />
            <div className="space-y-5 text-[1.05rem] leading-relaxed text-ink/70">
              {(t.history ?? DEFAULT_HISTORY).map((para) => (
                <p key={para}>{para}</p>
              ))}
              <p className="font-display text-xl font-semibold text-crimson-700">
                {dict.slogan?.full ?? "Approach Jamaica with confidence."}
              </p>
            </div>
          </div>

          <div className="relative">
            <figure className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-lift">
              <Image
                src="/local/hero-2.jpg"
                alt="The Jamaican coastline near Montego Bay"
                fill
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
            </figure>
            <div className="absolute -bottom-6 -left-6 hidden w-56 rounded-2xl bg-crimson-700 p-5 text-white shadow-lift sm:block">
              <p className="font-display text-4xl font-semibold">15+</p>
              <p className="mt-1 text-sm text-white/75">
                {t.yearsCaption ?? "Years driving guests across the island"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Meet the owner */}
      <section className="bg-ink py-16 lg:py-24">
        <div className="shell grid gap-12 lg:grid-cols-[1fr_1.2fr] lg:items-center lg:gap-20">
          <figure className="relative aspect-[4/3] overflow-hidden rounded-2xl lg:aspect-square">
            <Image
              src="/team/donovan-pugh.jpg"
              alt={`${site.owner.name}, owner of ${site.legalName}, with guests in Montego Bay`}
              fill
              sizes="(max-width: 1024px) 100vw, 40vw"
              className="object-cover"
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/90 via-ink/40 to-transparent p-5 pt-12 text-xs text-white/70">
              {t.ownerCaption ??
                `${site.owner.short} with guests at the end of a day out.`}
            </figcaption>
          </figure>

          <div>
            <p className="eyebrow-light">{t.meetOwner ?? "Meet the owner"}</p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-white sm:text-[2.5rem]">
              {site.owner.name}
            </h2>
            <p className="mt-1.5 text-sm font-medium uppercase tracking-wider text-crimson-300">
              {t.ownerRole ?? site.owner.role}
            </p>

            <FaQuoteLeft className="mt-8 text-2xl text-crimson-500/40" />
            <p className="mt-4 text-[1.15rem] leading-relaxed text-white/75">
              {t.ownerBio ?? site.owner.bio}
            </p>
            <p className="mt-5 text-[1.05rem] leading-relaxed text-white/70">
              {t.ownerNote?.replace("{count}", String(site.rating.count)) ??
                `Being a private-services-only company allows us to pay close attention to what our customers want. It is also why, across ${site.rating.count} Tripadvisor reviews, most people mention Mr. Pugh by name.`}
            </p>

            <Link
              href={localePath(locale, "/contact-us")}
              className="btn-gold group mt-9"
            >
              {t.planDay ?? "Plan a day with us"}
              <FaArrowRight className="text-xs transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Standards */}
      <section className="shell py-16 lg:py-24">
        <SectionHeading
          align="center"
          eyebrow={t.whyEyebrow ?? "Why choose PPP"}
          title={t.whyTitle ?? "The standard hasn't moved in fifteen years."}
          description={
            t.whyDescription ??
            "Licensed, insured, air-conditioned and private — every single trip."
          }
        />

        <div className="grid gap-5 sm:grid-cols-2">
          {credentials.map((c) => (
            <div key={c.key} className="card p-7">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-crimson-50 text-crimson-600">
                <FaCheck className="text-sm" />
              </span>
              <h3 className="mt-5 font-display text-xl font-semibold text-ink">
                {creds[c.key]?.title ?? c.title}
              </h3>
              <p className="mt-2.5 text-[0.95rem] leading-relaxed text-ink/60">
                {creds[c.key]?.body ?? c.body}
              </p>
            </div>
          ))}
        </div>

        {/*
          Recovered from the old site's media library. Rendered at native size —
          they are small originals and upscaling would show.
        */}
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 rounded-2xl border border-ink/[0.07] bg-sand/60 px-6 py-7">
          <Image
            src="/ppp/awards/tripadvisor-2017.png"
            alt="Tripadvisor Certificate of Excellence 2017 awarded to PPP Tran Tours"
            width={159}
            height={138}
            className="h-[5.5rem] w-auto"
          />
          <Image
            src="/ppp/awards/tripadvisor-2018.jpg"
            alt="Tripadvisor Certificate of Excellence 2018 awarded to PPP Tran Tours"
            width={150}
            height={126}
            className="h-[5.5rem] w-auto"
          />
          <p className="max-w-xs text-sm leading-relaxed text-ink/60">
            {t.awards
              ?.replace("{score}", site.rating.score)
              .replace("{count}", String(site.rating.count)) ??
              `Recognised by Tripadvisor in consecutive years, and still holding ${site.rating.score} across ${site.rating.count} reviews.`}
          </p>
        </div>

        {/* The three P's */}
        <div className="mt-16 grid gap-5 sm:grid-cols-3">
          {promise.map((p) => (
            <div
              key={p.word}
              className="rounded-2xl border border-crimson-200/60 bg-crimson-50/50 p-7 text-center"
            >
              <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-crimson-600 font-display text-xl font-semibold text-white">
                {p.letter}
              </span>
              <h3 className="mt-4 font-display text-xl font-semibold text-ink">
                {words[p.word]?.word ?? p.word}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/60">
                {words[p.word]?.body ?? p.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <FleetSection dict={dict} />
      <GallerySection dict={client} />
      <Testimonials dict={dict} />
      <CtaBand locale={locale} dict={dict} />
      <SloganBand dict={dict} />
    </>
  );
}

const DEFAULT_HISTORY = [
  "From the beginning, personalized service and customer satisfaction have been the cornerstones used to build the standard and reputation of PPP Tran Tours Jamaica.",
  "Every service we offer is private — airport transfers, tours and excursions from hotels, resorts and cruise ship piers. We are licensed by the Jamaica Tourist Board and by Jamaica's Transport Authority. Every vehicle is air-conditioned, clean, comfortable and current, and every driver is patient, polite and knowledgeable.",
  "Customized combo tours — two or three attractions in the same day — are no problem, and are reasonably priced. Booking with PPP lets you move at your own pace while exploring Jamaica parish to parish with trained professionals.",
];
