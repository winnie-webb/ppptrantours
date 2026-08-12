import Image from "next/image";
import { FaUsers, FaSuitcase, FaSnowflake } from "react-icons/fa";
import SectionHeading from "./SectionHeading";

/**
 * Spec-only tiles, deliberately without photos. The previous images were
 * another operator's vehicles; the one genuine PPP vehicle photo we have
 * leads the section instead. Add per-vehicle `image` keys back once Mr. Pugh
 * supplies his own shots of each class.
 */
const FLEET = [
  {
    name: "Executive sedan",
    blurb: "Saloon car for couples and solo travellers who want the quiet ride.",
    seats: "1–3 guests",
    bags: "3 bags",
  },
  {
    name: "Private minivan",
    blurb: "Our workhorse. Room to spread out on the long runs to Kingston or Port Antonio.",
    seats: "4–6 guests",
    bags: "6 bags",
  },
  {
    name: "Touring van",
    blurb: "For families and groups travelling together, with luggage space to match.",
    seats: "7–14 guests",
    bags: "14 bags",
  },
];

export default function FleetSection() {
  return (
    <section className="bg-sand py-16 lg:py-24">
      <div className="shell">
        <SectionHeading
          align="center"
          eyebrow="Our fleet"
          title="Sized to your group, not the other way round."
          description="Every vehicle is air-conditioned, inspected and insured for passenger service. Larger coaches are available for weddings and groups of up to thirty."
        />

        <figure className="mb-8 overflow-hidden rounded-2xl bg-ink">
          <div className="relative aspect-[16/9] sm:aspect-[21/9]">
            <Image
              src="/ppp/donovan-airport-van.jpg"
              alt="Donovan Pugh meeting guests beside a PPP Tran Tours van at Sangster International Airport"
              fill
              sizes="(max-width: 1024px) 100vw, 1024px"
              className="object-cover object-center"
            />
          </div>
          <figcaption className="px-5 py-3 text-xs text-white/60">
            Mr. Pugh meeting arrivals at Sangster International, Montego Bay.
          </figcaption>
        </figure>

        <div className="grid gap-5 sm:grid-cols-3">
          {FLEET.map((v) => (
            <article key={v.name} className="card overflow-hidden">
              <div className="p-6">
                <h3 className="font-display text-xl font-semibold text-ink">{v.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink/60">{v.blurb}</p>
                <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-ink/[0.07] pt-4 text-xs text-ink/55">
                  <li className="flex items-center gap-1.5">
                    <FaUsers className="text-crimson-600" />
                    {v.seats}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <FaSuitcase className="text-crimson-600" />
                    {v.bags}
                  </li>
                  <li className="flex items-center gap-1.5">
                    <FaSnowflake className="text-crimson-600" />
                    A/C
                  </li>
                </ul>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
