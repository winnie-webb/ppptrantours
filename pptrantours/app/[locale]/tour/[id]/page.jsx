import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  FaCheck,
  FaClock,
  FaCar,
  FaUserTie,
  FaMapMarkerAlt,
  FaStar,
  FaChevronRight,
} from "react-icons/fa";
import { TOURS } from "@/app/data/catalogue";
import { ZONES } from "@/app/data/places";
import { filterProductById, getRelatedProducts } from "@/app/products/product";
import { money, perPerson, VEHICLE_CAPACITY } from "@/app/products/pricing";
import { site } from "@/app/data/site";
import BookingForm from "@/app/components/BookingForm";
import TourCard from "@/app/components/TourCard";
import SectionHeading from "@/app/components/SectionHeading";
import { LOCALES, localePath } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/dictionaries";
import { clientDict } from "@/app/i18n/client";
import { languageAlternates } from "../../layout";

export function generateStaticParams() {
  return LOCALES.flatMap((l) => TOURS.map((t) => ({ locale: l.code, id: t.id })));
}

export async function generateMetadata({ params }) {
  const { locale, id } = await params;
  const tour = filterProductById(id);
  if (!tour) return { title: "Tour not found" };

  const dict = await getDictionary(locale);
  const copy = dict.tours?.[id] ?? {};
  const title = copy.title ?? tour.title;
  const desc = copy.desc ?? tour.desc;

  return {
    title,
    description: desc.slice(0, 155),
    alternates: {
      canonical: localePath(locale, `/tour/${id}`),
      languages: languageAlternates(`/tour/${id}`),
    },
    openGraph: {
      title,
      description: desc.slice(0, 155),
      images: [tour.image],
    },
  };
}

export default async function TourPage({ params }) {
  const { locale, id } = await params;
  const base = filterProductById(id);
  if (!base || base.kind === "transfer") notFound();

  const dict = await getDictionary(locale);
  const client = clientDict(dict);
  const copy = dict.tours?.[id] ?? {};

  // Translated copy overlays the catalogue record, so prices and structure
  // stay single-sourced while the words change per locale.
  const tour = {
    ...base,
    title: copy.title ?? base.title,
    subtitle: copy.subtitle ?? base.subtitle,
    desc: copy.desc ?? base.desc,
    highlights: copy.highlights ?? base.highlights,
  };

  const t = dict.tourPage ?? {};
  const related = getRelatedProducts(base, 3);
  const pricedZones = ZONES.filter((zoneDef) => base.zones?.[zoneDef.key]);
  const entryComponents = base.entry?.components ?? [];
  const entryAddons = base.entry?.addons ?? [];

  const included = [
    { Icon: FaCar, text: t.inc1 ?? "Private air-conditioned vehicle, yours alone" },
    { Icon: FaUserTie, text: t.inc2 ?? "Licensed, insured local driver and guide" },
    { Icon: FaMapMarkerAlt, text: t.inc3 ?? "Pickup and drop-off at your door" },
    { Icon: FaClock, text: t.inc4 ?? "No fixed departure — you set the pace" },
  ];

  return (
    <>
      {/* Hero */}
      <section className="relative isolate -mt-[4.5rem] overflow-hidden bg-ink pb-12 pt-28 lg:-mt-20 lg:pb-16 lg:pt-40">
        <Image
          src={tour.image}
          alt=""
          fill
          priority
          sizes="100vw"
          className="scale-105 object-cover opacity-25 blur-sm"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-gradient-to-t from-ink via-ink/90 to-ink/70"
        />

        <div className="shell relative">
          <nav aria-label="Breadcrumb" className="mb-5">
            <ol className="flex flex-wrap items-center gap-2 text-xs text-white/50">
              <li>
                <Link href={localePath(locale, "/")} className="transition hover:text-white">
                  {dict.nav?.home ?? "Home"}
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <FaChevronRight className="text-[0.5rem] opacity-50" />
                <Link
                  href={localePath(locale, "/tours")}
                  className="transition hover:text-white"
                >
                  {dict.nav?.tours ?? "Things to do"}
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <FaChevronRight className="text-[0.5rem] opacity-50" />
                <Link
                  href={localePath(locale, `/category/${base.region}`)}
                  className="transition hover:text-white"
                >
                  {dict.categories?.[base.region]?.title ?? base.region}
                </Link>
              </li>
            </ol>
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-crimson-600/20 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-wider text-crimson-300">
              {base.kind === "combo"
                ? dict.categories?.combos?.short ?? "Combo"
                : dict.categories?.[base.region]?.short ?? base.region}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-white/60">
              <span className="flex text-gold-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <FaStar key={i} className="text-[0.6rem]" />
                ))}
              </span>
              {site.rating.score} · {site.rating.count}{" "}
              {dict.common?.reviews ?? "reviews"}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-white/60">
              <FaClock className="text-[0.65rem]" />
              {dict.durations?.[base.duration] ?? base.duration}
            </span>
          </div>

          <h1 className="mt-4 max-w-4xl font-display text-3xl font-semibold leading-[1.1] text-white sm:text-4xl lg:text-[3.25rem]">
            {tour.title}
          </h1>
          {tour.subtitle && (
            <p className="mt-2 text-sm font-medium text-white/50">{tour.subtitle}</p>
          )}
        </div>
      </section>

      {/* Body */}
      <section className="shell py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-14">
          <div>
            <figure className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-ink/5 shadow-card">
              <Image
                src={tour.image}
                alt={tour.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 62vw"
                className="object-cover"
              />
            </figure>

            <div className="mt-10">
              <h2 className="font-display text-2xl font-semibold text-ink">
                {t.about ?? "About this tour"}
              </h2>
              <p className="mt-4 text-[1.05rem] leading-relaxed text-ink/70">
                {tour.desc}
              </p>
            </div>

            {/* Highlights */}
            <div className="mt-10">
              <h2 className="font-display text-2xl font-semibold text-ink">
                {t.highlights ?? "Highlights"}
              </h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {tour.highlights.map((h) => (
                  <li
                    key={h}
                    className="flex items-start gap-3 rounded-xl border border-ink/[0.07] bg-white p-4 shadow-card"
                  >
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-crimson-100 text-[0.6rem] text-crimson-700">
                      <FaCheck />
                    </span>
                    <span className="text-sm leading-relaxed text-ink/75">{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Included */}
            <div className="mt-10">
              <h2 className="font-display text-2xl font-semibold text-ink">
                {t.included ?? "What's included"}
              </h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {included.map(({ Icon, text }) => (
                  <li key={text} className="flex items-center gap-3 text-sm text-ink/75">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-crimson-50 text-crimson-600">
                      <Icon className="text-sm" />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            {/* Transport price by resort area */}
            {pricedZones.length > 0 && (
              <div className="mt-10">
                <h2 className="font-display text-2xl font-semibold text-ink">
                  {t.transportTable ?? "What the transport costs"}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-ink/55">
                  {t.transportTableNote ??
                    `Per person is the vehicle price shared between ${VEHICLE_CAPACITY} — the vehicle costs the same whether one of you travels or four. A fifth passenger and each one after adds the last figure.`}
                </p>

                <div className="mt-5 overflow-x-auto rounded-2xl border border-ink/[0.07] shadow-card">
                  <table className="w-full min-w-[30rem] text-sm">
                    <thead className="bg-sand text-left">
                      <tr>
                        <th className="px-5 py-3.5 font-semibold text-ink/70">
                          {t.pickingUpFrom ?? "Picking you up from"}
                        </th>
                        <th className="px-5 py-3.5 text-right font-semibold text-ink/70">
                          {t.perPersonCol ?? "Per person"}
                        </th>
                        <th className="px-5 py-3.5 text-right font-semibold text-ink/70">
                          {t.upToFour ?? `Up to ${VEHICLE_CAPACITY}`}
                        </th>
                        <th className="px-5 py-3.5 text-right font-semibold text-ink/70">
                          {t.eachExtra ?? "Each extra"}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/[0.07] bg-white">
                      {pricedZones.map((zoneDef) => {
                        const band = base.zones[zoneDef.key];
                        return (
                          <tr key={zoneDef.key} className="transition hover:bg-crimson-50/50">
                            <td className="px-5 py-3.5 text-ink/75">
                              {dict.zones?.[zoneDef.key] ?? zoneDef.label}
                              {band.est && (
                                <span className="ml-2 rounded bg-gold-200/50 px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide text-ink/50">
                                  {t.estimatedMark ?? "indicative"}
                                </span>
                              )}
                            </td>
                            <td className="px-5 py-3.5 text-right font-semibold text-crimson-700">
                              {money(perPerson(band.price, VEHICLE_CAPACITY))}
                            </td>
                            <td className="px-5 py-3.5 text-right text-ink/70">
                              {money(band.price)}
                            </td>
                            <td className="px-5 py-3.5 text-right text-ink/60">
                              {money(band.extra)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {pricedZones.length < ZONES.length && (
                  <p className="mt-3 text-sm leading-relaxed text-ink/55">
                    {t.otherResorts ??
                      "Staying somewhere else? We still run this trip — send us a message and we'll quote your resort directly."}
                  </p>
                )}
              </div>
            )}

            {/* Entry fees */}
            <div className="mt-10">
              <h2 className="font-display text-2xl font-semibold text-ink">
                {t.entryTable ?? "What the attraction charges"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink/55">
                {entryComponents.length === 0 && entryAddons.length === 0
                  ? t.noEntry ?? "Nothing. There is no gate fee on this one."
                  : t.entryTableNote ??
                    "Paid at the gate on the day, straight to the attraction. We never resell these or add anything to them."}
              </p>

              {(entryComponents.length > 0 || entryAddons.length > 0) && (
                <div className="mt-5 overflow-x-auto rounded-2xl border border-ink/[0.07] shadow-card">
                  <table className="w-full min-w-[30rem] text-sm">
                    <thead className="bg-sand text-left">
                      <tr>
                        <th className="px-5 py-3.5 font-semibold text-ink/70">
                          {t.entryItem ?? "Ticket"}
                        </th>
                        <th className="px-5 py-3.5 text-right font-semibold text-ink/70">
                          {t.entryAdult ?? "Adult"}
                        </th>
                        <th className="px-5 py-3.5 text-right font-semibold text-ink/70">
                          {t.entryChild ?? "Child"}
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/[0.07] bg-white">
                      {entryComponents.flatMap((c) => {
                        if (c.kind === "choice") {
                          return c.options.map((o) => (
                            <EntryRow
                              key={`${c.key}-${o.key}`}
                              label={o.label}
                              rate={o}
                              dict={dict}
                            />
                          ));
                        }
                        if (c.kind === "unit") {
                          return (
                            <tr key={c.label} className="transition hover:bg-crimson-50/50">
                              <td className="px-5 py-3.5 text-ink/75">
                                {c.label}
                                <span className="block text-xs text-ink/40">{c.note}</span>
                              </td>
                              <td
                                colSpan={2}
                                className="px-5 py-3.5 text-right font-semibold text-crimson-700"
                              >
                                {money(c.price)}{" "}
                                <span className="text-xs font-normal text-ink/45">
                                  / {c.unit}
                                </span>
                              </td>
                            </tr>
                          );
                        }
                        return (
                          <EntryRow key={c.label} label={c.label} rate={c} dict={dict} />
                        );
                      })}
                      {entryAddons.map((a) => (
                        <EntryRow
                          key={a.key}
                          label={`${a.label} (${t.optional ?? "optional"})`}
                          rate={a}
                          dict={dict}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {base.entry?.note && (
                <p className="mt-3 text-sm leading-relaxed text-ink/55">
                  {base.entry.note}
                </p>
              )}
            </div>
          </div>

          {/* Sticky booking rail */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <BookingForm tour={tour} locale={locale} dict={client} mode="tour" />
          </aside>
        </div>
      </section>

      {related.length > 0 && (
        <section className="bg-sand py-16 lg:py-20">
          <div className="shell">
            <SectionHeading
              eyebrow={t.alsoLike ?? "You might also like"}
              title={
                dict.categories?.[base.region]?.title ?? t.moreTours ?? "More tours"
              }
              href={localePath(locale, `/category/${base.region}`)}
              linkLabel={dict.common?.seeAll ?? "See all"}
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((r) => (
                <TourCard
                  key={r.id}
                  tour={{ ...r, ...(dict.tours?.[r.id] ?? {}) }}
                  locale={locale}
                  dict={client}
                />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function EntryRow({ label, rate, dict }) {
  const from = rate.from ? `${dict.booking?.fromWord ?? "from"} ` : "";
  return (
    <tr className="transition hover:bg-crimson-50/50">
      <td className="px-5 py-3.5 text-ink/75">
        {label}
        {rate.childNote && (
          <span className="block text-xs text-ink/40">{rate.childNote}</span>
        )}
      </td>
      <td className="px-5 py-3.5 text-right font-semibold text-crimson-700">
        {from}
        {money(rate.adult)}
      </td>
      <td className="px-5 py-3.5 text-right text-ink/60">
        {rate.child == null ? "—" : `${from}${money(rate.child)}`}
      </td>
    </tr>
  );
}
