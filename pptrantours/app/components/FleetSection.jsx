import Image from "next/image";
import { FaUsers, FaSnowflake } from "react-icons/fa";
import SectionHeading from "./SectionHeading";

/**
 * The three vehicle classes PPP runs, as the owner listed them (2026-11-18):
 * a new box-shaped Toyota Coaster bus, a new 10–15 seater Toyota Hiace, and a
 * modern Toyota Voxy.
 *
 * The photos are freely licensed pictures of each model (credited in
 * public/CREDITS.md) with the PPP logo added on the passenger-side door, as he
 * asked. Swap in his own photos of the actual vehicles when he has them.
 *
 * Shown on the About page and on /transfers, beside the transfer form.
 */
const FLEET = [
  {
    key: "voxy",
    image: "/fleet/voxy.jpg",
    name: "Toyota Voxy",
    tag: "Modern minivan",
    blurb: "Quiet, comfortable and modern — for couples, families and small groups.",
    seats: "Up to 6 guests",
  },
  {
    key: "hiace",
    image: "/fleet/hiace.jpg",
    name: "Toyota Hiace",
    tag: "New 10–15 seater bus",
    blurb: "Our workhorse for families and groups travelling together, with room for the luggage.",
    seats: "10–15 guests",
  },
  {
    key: "coaster",
    image: "/fleet/coaster.jpg",
    name: "Toyota Coaster",
    tag: "New box-shaped Coaster bus",
    blurb: "For weddings, cruise groups and big parties who want to travel together.",
    seats: "Up to 29 guests",
  },
];

export default function FleetSection({ dict, className = "bg-sand py-16 lg:py-24" }) {
  const t = dict?.fleet ?? {};
  return (
    <section id="vehicles" className={`scroll-mt-24 ${className}`}>
      <div className="shell">
        <SectionHeading
          align="center"
          title={t.title ?? "Our vehicles"}
          description={
            t.description ??
            "New and modern Toyotas, every one air-conditioned, inspected and insured for passenger service. Just book, and we send the right one for your group size."
          }
        />

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FLEET.map((v) => {
            const copy = t.vehicles?.[v.key] ?? {};
            const name = copy.name ?? v.name;
            return (
              <article key={v.key} className="card overflow-hidden">
                <div className="relative aspect-[4/3] bg-ink/5">
                  <Image
                    src={v.image}
                    alt={`${name} with the PPP Tran Tours logo on the passenger door`}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-crimson-700">
                    {copy.tag ?? v.tag}
                  </p>
                  <h3 className="mt-1 font-display text-xl font-semibold text-ink">{name}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/60">
                    {copy.blurb ?? v.blurb}
                  </p>
                  <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 border-t border-ink/[0.07] pt-4 text-xs text-ink/70">
                    <li className="flex items-center gap-1.5">
                      <FaUsers className="text-crimson-600" />
                      {copy.seats ?? v.seats}
                    </li>
                    <li className="flex items-center gap-1.5">
                      <FaSnowflake className="text-crimson-600" />
                      {t.ac ?? "A/C"}
                    </li>
                  </ul>
                </div>
              </article>
            );
          })}
        </div>

        <p className="mt-5 text-center text-xs text-ink/50">
          {t.photoNote ?? "Photos show the vehicle models we run."}{" "}
          {/* Required attribution: two of the three are CC BY-SA 4.0. */}
          Photos via Wikimedia Commons, PPP logo added: Voxy by Benespit and Hiace
          by Thitichai R (
          <a
            href="https://creativecommons.org/licenses/by-sa/4.0/"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            CC BY-SA 4.0
          </a>
          ), Coaster by Ypy31 (CC0).
        </p>
      </div>
    </section>
  );
}
