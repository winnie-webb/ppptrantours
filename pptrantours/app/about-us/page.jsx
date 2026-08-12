import Image from "next/image";
import Link from "next/link";
import { FaCheck, FaQuoteLeft, FaArrowRight } from "react-icons/fa";
import PageHeader from "../components/PageHeader";
import StatsBar from "../components/StatsBar";
import FleetSection from "../components/FleetSection";
import Testimonials from "../components/Testimonials";
import CtaBand from "../components/CtaBand";
import SectionHeading from "../components/SectionHeading";
import { site, credentials, promise } from "../data/site";

export const metadata = {
  title: "About PPP",
  description:
    "PPP Tran Tours Jamaica — private, personalized, professional transport since 2010, run out of Montego Bay by owner Donovan Pugh.",
};

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About PPP"
        title="Private. Personalized. Professional."
        description="Three words the company was named for, and the only three standards we've ever needed."
        image="/ppp/banner-waterfall-guests.jpg"
        breadcrumbs={[{ label: "About PPP" }]}
      />

      <StatsBar />

      {/* Our history */}
      <section className="shell py-16 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-20">
          <div>
            <SectionHeading
              eyebrow="Our history"
              title="Built on repeat guests, not advertising."
            />
            <div className="space-y-5 text-[1.05rem] leading-relaxed text-ink/70">
              <p>
                From the beginning, personalized service and customer satisfaction
                have been the cornerstones used to build the standard and reputation
                of PPP Tran Tours Jamaica.
              </p>
              <p>
                Every service we offer is private — airport transfers, tours and
                excursions from hotels, resorts and cruise ship piers. We are licensed
                by the Jamaica Tourist Board and by Jamaica&apos;s Transport Authority.
                Every vehicle is air-conditioned, clean, comfortable and current, and
                every driver is patient, polite and knowledgeable.
              </p>
              <p>
                Customized combo tours — two or three attractions in the same day —
                are no problem, and are reasonably priced. Booking with PPP lets you
                move at your own pace while exploring Jamaica parish to parish with
                trained professionals.
              </p>
              <p className="font-display text-xl font-semibold text-crimson-700">
                Approach Jamaica with confidence.
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
                Years driving guests across the island
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
              {site.owner.short} with guests at the end of a day out.
            </figcaption>
          </figure>

          <div>
            <p className="eyebrow-light">Meet the owner</p>
            <h2 className="mt-3 font-display text-3xl font-semibold text-white sm:text-[2.5rem]">
              {site.owner.name}
            </h2>
            <p className="mt-1.5 text-sm font-medium uppercase tracking-wider text-crimson-300">
              {site.owner.role}
            </p>

            <FaQuoteLeft className="mt-8 text-2xl text-crimson-500/40" />
            <p className="mt-4 text-[1.15rem] leading-relaxed text-white/75">
              {site.owner.bio}
            </p>
            <p className="mt-5 text-[1.05rem] leading-relaxed text-white/55">
              Being a private-services-only company allows us to pay close attention
              to what our customers want. It is also why, across {site.rating.count}{" "}
              Tripadvisor reviews, most people mention Mr. Pugh by name.
            </p>

            <Link href="/contact-us" className="btn-gold group mt-9">
              Plan a day with us
              <FaArrowRight className="text-xs transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Standards */}
      <section className="shell py-16 lg:py-24">
        <SectionHeading
          align="center"
          eyebrow="Why choose PPP"
          title="The standard hasn't moved in fifteen years."
          description="Licensed, insured, air-conditioned and private — every single trip."
        />

        <div className="grid gap-5 sm:grid-cols-2">
          {credentials.map((c) => (
            <div key={c.title} className="card p-7">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-crimson-50 text-crimson-600">
                <FaCheck className="text-sm" />
              </span>
              <h3 className="mt-5 font-display text-xl font-semibold text-ink">
                {c.title}
              </h3>
              <p className="mt-2.5 text-[0.95rem] leading-relaxed text-ink/60">
                {c.body}
              </p>
            </div>
          ))}
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
                {p.word}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/60">{p.body}</p>
            </div>
          ))}
        </div>
      </section>

      <FleetSection />
      <Testimonials />
      <CtaBand />
    </>
  );
}
