import Link from "next/link";
import {
  FaPlane,
  FaUmbrellaBeach,
  FaLayerGroup,
  FaMountain,
  FaWater,
  FaSun,
  FaLeaf,
  FaStar,
} from "react-icons/fa";
import { CATEGORIES, filterProductByCategory } from "../products/product";
import { localePath } from "@/app/i18n/config";
import SectionHeading from "./SectionHeading";

const ICONS = {
  popular: FaStar,
  transfers: FaPlane,
  combos: FaLayerGroup,
  "montego-bay": FaUmbrellaBeach,
  "ocho-rios": FaMountain,
  falmouth: FaWater,
  negril: FaSun,
  "south-coast": FaLeaf,
};

export default function CategoryChips({ locale = "en", dict }) {
  const t = dict?.browse ?? {};
  const cats = dict?.categories ?? {};

  return (
    <section className="shell py-16 lg:py-24">
      <SectionHeading
        eyebrow={t.eyebrow ?? "Things to do in Jamaica"}
        title={t.title ?? "Where do you want to spend the day?"}
        description={
          t.description ??
          "Browse by parish, or by the kind of day you're after. Every price is the transport, worked out for your group."
        }
        href={localePath(locale, "/tours")}
        linkLabel={t.seeEverything ?? "See everything"}
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {CATEGORIES.map((c) => {
          const Icon = ICONS[c.type] ?? FaStar;
          const count = filterProductByCategory(c.type).length;
          const href =
            c.type === "transfers"
              ? localePath(locale, "/transfers")
              : localePath(locale, `/category/${c.type}`);

          return (
            <Link
              key={c.type}
              href={href}
              className="group flex flex-col gap-3 rounded-2xl border border-ink/[0.07] bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-crimson-200 hover:shadow-lift"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-crimson-50 text-crimson-600 transition-colors group-hover:bg-crimson-600 group-hover:text-white">
                <Icon className="text-lg" />
              </span>
              <span>
                <span className="block text-sm font-semibold leading-snug text-ink">
                  {cats[c.type]?.title ?? c.title}
                </span>
                <span className="mt-1 block text-xs text-ink/70">
                  {c.parish ? `${c.parish} · ` : ""}
                  {count}{" "}
                  {count === 1 ? t.option ?? "option" : t.options ?? "options"}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
