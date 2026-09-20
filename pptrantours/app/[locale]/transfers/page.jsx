import Link from "next/link";
import { FaArrowRight, FaPlane, FaClock, FaShieldAlt, FaTag } from "react-icons/fa";
import { AREAS, PLACES } from "@/app/data/places";
import { money, perPerson, VEHICLE_CAPACITY } from "@/app/products/pricing";
import PageHeader from "@/app/components/PageHeader";
import FareCalculator from "@/app/components/FareCalculator";
import CtaBand from "@/app/components/CtaBand";
import SectionHeading from "@/app/components/SectionHeading";
import { LOCALES, localePath } from "@/app/i18n/config";
import { getDictionary } from "@/app/i18n/dictionaries";
import JsonLd from "@/app/components/JsonLd";
import { site } from "@/app/data/site";
import { transferListSchema } from "@/app/data/schema";
import { clientDict } from "@/app/i18n/client";
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

  const groups = AREAS.map((area) => ({
    ...area,
    places: PLACES.filter((p) => p.area === area.key && p.transfer),
  })).filter((g) => g.places.length > 0);

  const cheapest = Math.min(
    ...PLACES.filter((p) => p.transfer).map((p) => p.transfer.oneWay)
  );

  const promises = [
    {
      Icon: FaPlane,
      title: t.p1Title ?? "Met inside arrivals",
      body: t.p1Body ?? "Your driver is in the hall with a name board, not in a car park somewhere.",
    },
    {
      Icon: FaClock,
      title: t.p2Title ?? "Flight tracked",
      body: t.p2Body ?? "If you land late we know before you do, and there is no charge for waiting.",
    },
    {
      Icon: FaShieldAlt,
      title: t.p3Title ?? "Private, always",
      body: t.p3Body ?? "Your group alone. No shared van, no circuit of other hotels first.",
    },
    {
      Icon: FaTag,
      title: t.p4Title ?? "The price is the price",
      body: t.p4Body ?? "One flat fare for up to four people. No fuel levy, no airport surcharge.",
    },
  ];

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
          `Flat, published rates to every resort we serve, from ${money(perPerson(cheapest, VEHICLE_CAPACITY))} per person. Pick your hotel below and see the fare before you give us a single detail.`
        }
        image="/ppp/donovan-airport-van.jpg"
      />

      {/* Lifted over the banner. PageHeader is positioned, so a static sibling
          pulled up by a negative margin paints behind it however late it comes
          in the DOM — this needs its own stacking position to sit on top. */}
      <section className="shell relative z-10 -mt-10 pb-14 lg:-mt-16">
        <FareCalculator locale={locale} dict={client} />
      </section>

      <section className="shell pb-16">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {promises.map(({ Icon, title, body }) => (
            <div
              key={title}
              className="rounded-2xl border border-ink/[0.07] bg-white p-5 shadow-card"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-crimson-50 text-crimson-600">
                <Icon className="text-sm" />
              </span>
              <h3 className="mt-3.5 text-sm font-semibold text-ink">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-ink/60">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Full published rate card */}
      <section className="bg-sand py-16 lg:py-20">
        <div className="shell">
          <SectionHeading
            eyebrow={t.ratesEyebrow ?? "Every rate we publish"}
            title={t.ratesTitle ?? "The whole price list, in the open."}
            description={
              t.ratesDescription ??
              "Per person is the fare shared between four — the vehicle costs the same whether one of you travels or four. The last column is what each passenger beyond the fourth adds."
            }
          />

          <div className="space-y-8">
            {groups.map((group) => (
              <div key={group.key}>
                <h3 className="mb-3 font-display text-lg font-semibold text-ink">
                  {dict.areas?.[group.key] ?? group.label}
                </h3>
                {/*
                  Below md this is a stack of cards, not a table.

                  The table is min-w-[36rem] — 576px inside a 348px column on a
                  390px phone — so on the device most of these guests are
                  holding, the published price list could only be read by
                  dragging it sideways, six times over. Same numbers, same
                  links, laid out to fit.
                */}
                <ul className="divide-y divide-ink/[0.07] overflow-hidden rounded-2xl border border-ink/[0.07] bg-white shadow-card md:hidden">
                  {group.places.map((p) => (
                    <li key={p.key}>
                      <Link
                        href={localePath(locale, `/transfer/${p.key}`)}
                        className="block px-4 py-3.5 transition active:bg-crimson-50"
                      >
                        <div className="flex items-center justify-between gap-3">
                          {/* Wraps rather than truncates: a guest scanning for
                              their own hotel needs the whole name. */}
                          <span className="min-w-0 font-medium leading-snug text-ink">
                            {p.name}
                          </span>
                          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-crimson-50 text-crimson-700">
                            <FaArrowRight className="text-[0.6rem]" />
                          </span>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="block text-ink/45">
                              {t.oneWay ?? "One way"}
                            </span>
                            <span className="font-semibold text-crimson-700">
                              {money(perPerson(p.transfer.oneWay, VEHICLE_CAPACITY))}
                            </span>
                            <span className="block text-[0.7rem] text-ink/45">
                              {money(p.transfer.oneWay)} {t.totalWord ?? "total"}
                            </span>
                          </div>
                          <div>
                            <span className="block text-ink/45">
                              {t.roundTrip ?? "Round trip"}
                            </span>
                            <span className="font-semibold text-ink/80">
                              {money(perPerson(p.transfer.roundTrip, VEHICLE_CAPACITY))}
                            </span>
                            <span className="block text-[0.7rem] text-ink/45">
                              {money(p.transfer.roundTrip)} {t.totalWord ?? "total"}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>

                <div className="hidden overflow-x-auto rounded-2xl border border-ink/[0.07] bg-white shadow-card md:block">
                  <table className="w-full min-w-[36rem] text-sm">
                    <thead className="bg-white text-left">
                      <tr className="border-b border-ink/[0.07]">
                        <th className="px-5 py-3.5 font-semibold text-ink/70">
                          {t.resort ?? "Resort"}
                        </th>
                        <th className="px-5 py-3.5 text-right font-semibold text-ink/70">
                          {t.oneWay ?? "One way"}
                        </th>
                        <th className="px-5 py-3.5 text-right font-semibold text-ink/70">
                          {t.roundTrip ?? "Round trip"}
                        </th>
                        <th className="px-5 py-3.5 text-right font-semibold text-ink/70">
                          {t.each ?? "Each extra"}
                        </th>
                        <th className="w-10" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-ink/[0.07]">
                      {group.places.map((p) => (
                        <tr key={p.key} className="group transition hover:bg-crimson-50/50">
                          <td className="px-5 py-3.5">
                            <Link
                              href={localePath(locale, `/transfer/${p.key}`)}
                              className="font-medium text-ink transition group-hover:text-crimson-700"
                            >
                              {p.name}
                            </Link>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <span className="font-semibold text-crimson-700">
                              {money(
                                perPerson(p.transfer.oneWay, VEHICLE_CAPACITY)
                              )}
                            </span>
                            <span className="block text-xs text-ink/45">
                              {money(p.transfer.oneWay)} {t.totalWord ?? "total"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <span className="font-semibold text-ink/80">
                              {money(
                                perPerson(p.transfer.roundTrip, VEHICLE_CAPACITY)
                              )}
                            </span>
                            <span className="block text-xs text-ink/45">
                              {money(p.transfer.roundTrip)} {t.totalWord ?? "total"}
                            </span>
                          </td>
                          <td className="px-5 py-3.5 text-right text-ink/50">
                            {money(p.transfer.oneWayExtra)} / {money(p.transfer.roundTripExtra)}
                          </td>
                          <td className="pr-4 text-right">
                            <Link
                              href={localePath(locale, `/transfer/${p.key}`)}
                              aria-label={`${t.book ?? "Book"} ${p.name}`}
                              className="inline-grid h-7 w-7 place-items-center rounded-full bg-crimson-50 text-crimson-700 transition group-hover:bg-crimson-600 group-hover:text-white"
                            >
                              <FaArrowRight className="text-[0.6rem]" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-6 text-sm leading-relaxed text-ink/55">
            {t.notListed ??
              "Villa, Airbnb or a resort that isn't listed? We go everywhere on the island — message us with the address and we'll quote it the same day."}
          </p>
        </div>
      </section>

      <CtaBand locale={locale} dict={dict} />
    </>
  );
}
