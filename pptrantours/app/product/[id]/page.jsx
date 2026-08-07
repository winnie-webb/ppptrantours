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
import {
  products,
  filterProductById,
  getRelatedProducts,
  getCategoryTitle,
  getCategoryShort,
  formatPrice,
} from "@/app/products/product";
import { site } from "@/app/data/site";
import BookingForm from "./BookingForm";
import TourCard from "@/app/components/TourCard";
import SectionHeading from "@/app/components/SectionHeading";

export function generateStaticParams() {
  return products.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }) {
  const { id } = await params;
  const tour = filterProductById(id);
  if (!tour) return { title: "Tour not found" };
  return {
    title: tour.title,
    description: tour.desc.slice(0, 155),
    openGraph: { title: tour.title, description: tour.desc.slice(0, 155) },
  };
}

const INCLUDED = [
  { Icon: FaCar, text: "Private air-conditioned vehicle" },
  { Icon: FaUserTie, text: "Licensed, insured local driver" },
  { Icon: FaMapMarkerAlt, text: "Hotel, villa or pier pickup" },
  { Icon: FaClock, text: "No fixed departure — you set the pace" },
];

export default async function ProductPage({ params }) {
  const { id } = await params;
  const tour = filterProductById(id);
  if (!tour) notFound();

  const related = getRelatedProducts(tour, 3);
  const cheapest = tour.pickups[0];
  const dearest = tour.pickups[tour.pickups.length - 1];

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
                <Link href="/" className="transition hover:text-white">
                  Home
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <FaChevronRight className="text-[0.5rem] opacity-50" />
                <Link href="/tours" className="transition hover:text-white">
                  Tours
                </Link>
              </li>
              <li className="flex items-center gap-2">
                <FaChevronRight className="text-[0.5rem] opacity-50" />
                <Link
                  href={`/category/${tour.category}`}
                  className="transition hover:text-white"
                >
                  {getCategoryTitle(tour.category)}
                </Link>
              </li>
            </ol>
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-crimson-600/20 px-3 py-1 text-[0.68rem] font-semibold uppercase tracking-wider text-crimson-300">
              {getCategoryShort(tour.category)}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-white/60">
              <span className="flex text-gold-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <FaStar key={i} className="text-[0.6rem]" />
                ))}
              </span>
              {site.rating.score} · {site.rating.count} reviews
            </span>
            <span className="flex items-center gap-1.5 text-xs text-white/60">
              <FaClock className="text-[0.65rem]" />
              {tour.duration}
            </span>
          </div>

          <h1 className="mt-4 max-w-4xl font-display text-3xl font-semibold leading-[1.1] text-white sm:text-4xl lg:text-[3.25rem]">
            {tour.title}
          </h1>
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
                About this {tour.category === "at" ? "transfer" : "tour"}
              </h2>
              <p className="mt-4 text-[1.05rem] leading-relaxed text-ink/70">
                {tour.desc}
              </p>
            </div>

            {/* Highlights */}
            <div className="mt-10">
              <h2 className="font-display text-2xl font-semibold text-ink">
                Highlights
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
                What&apos;s included
              </h2>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {INCLUDED.map(({ Icon, text }) => (
                  <li key={text} className="flex items-center gap-3 text-sm text-ink/75">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-crimson-50 text-crimson-600">
                      <Icon className="text-sm" />
                    </span>
                    {text}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm leading-relaxed text-ink/50">
                Attraction entry fees, meals and gratuities are not included —
                they&apos;re paid at the gate so you only pay us for the transport
                and guiding.
              </p>
            </div>

            {/* Pricing table */}
            <div className="mt-10">
              <h2 className="font-display text-2xl font-semibold text-ink">
                Price by {tour.category === "at" ? "destination" : "pickup area"}
              </h2>
              <p className="mt-2 text-sm text-ink/55">
                Per person, in US dollars. Rates run from{" "}
                <span className="font-semibold text-ink">
                  {formatPrice(cheapest.price)}
                </span>{" "}
                to{" "}
                <span className="font-semibold text-ink">
                  {formatPrice(dearest.price)}
                </span>
                .
              </p>

              <div className="mt-5 overflow-hidden rounded-2xl border border-ink/[0.07] shadow-card">
                <table className="w-full text-sm">
                  <thead className="bg-sand text-left">
                    <tr>
                      <th className="px-5 py-3.5 font-semibold text-ink/70">
                        {tour.category === "at" ? "Destination" : "Pickup area"}
                      </th>
                      <th className="px-5 py-3.5 text-right font-semibold text-ink/70">
                        Per person
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ink/[0.07] bg-white">
                    {tour.pickups.map((p) => (
                      <tr key={p.key} className="transition hover:bg-crimson-50/50">
                        <td className="px-5 py-3.5 text-ink/75">{p.label}</td>
                        <td className="px-5 py-3.5 text-right font-semibold text-crimson-700">
                          {formatPrice(p.price)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sticky booking rail */}
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <BookingForm tour={tour} />
          </aside>
        </div>
      </section>

      {related.length > 0 && (
        <section className="bg-sand py-16 lg:py-20">
          <div className="shell">
            <SectionHeading
              eyebrow="You might also like"
              title={`More ${getCategoryShort(tour.category).toLowerCase()}`}
              href={`/category/${tour.category}`}
            />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((t) => (
                <TourCard key={t.id} tour={t} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
