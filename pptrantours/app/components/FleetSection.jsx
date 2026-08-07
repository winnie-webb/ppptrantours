import Image from "next/image";
import { FaUsers, FaSuitcase, FaSnowflake } from "react-icons/fa";
import SectionHeading from "./SectionHeading";

const FLEET = [
  {
    image: "/fleet/sedan.webp",
    name: "Executive sedan",
    blurb: "Mercedes-Benz saloon for couples and solo travellers who want the quiet ride.",
    seats: "1–3 guests",
    bags: "3 bags",
  },
  {
    image: "/fleet/minivan.webp",
    name: "Private minivan",
    blurb: "Our workhorse. Room to spread out on the long runs to Kingston or Port Antonio.",
    seats: "4–6 guests",
    bags: "6 bags",
  },
  {
    image: "/fleet/van.webp",
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

        <div className="grid gap-5 sm:grid-cols-3">
          {FLEET.map((v) => (
            <article key={v.name} className="card overflow-hidden">
              <div className="relative aspect-[4/3] bg-ink">
                <Image
                  src={v.image}
                  alt={v.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover"
                />
              </div>
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
