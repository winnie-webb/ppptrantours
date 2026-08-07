import Link from "next/link";
import {
  FaPlane,
  FaUmbrellaBeach,
  FaShip,
  FaLayerGroup,
  FaUtensils,
  FaGolfBall,
  FaGlassCheers,
  FaShoppingBag,
  FaStar,
} from "react-icons/fa";
import { CATEGORIES, filterProductByCategory } from "../products/product";
import SectionHeading from "./SectionHeading";

const ICONS = {
  mpt: FaStar,
  at: FaPlane,
  ctp: FaLayerGroup,
  abc: FaUmbrellaBeach,
  cse: FaShip,
  edt: FaUtensils,
  egt: FaGolfBall,
  ncb: FaGlassCheers,
  st: FaShoppingBag,
};

export default function CategoryChips() {
  return (
    <section className="shell py-16 lg:py-24">
      <SectionHeading
        eyebrow="Browse by type"
        title="What kind of day are you after?"
        description="Nine categories, over a hundred routes — from a five-dollar hotel hop to a full South Coast expedition."
        href="/tours"
        linkLabel="See everything"
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {CATEGORIES.map((c) => {
          const Icon = ICONS[c.type] ?? FaStar;
          const count = filterProductByCategory(c.type).length;
          return (
            <Link
              key={c.type}
              href={`/category/${c.type}`}
              className="group flex flex-col gap-3 rounded-2xl border border-ink/[0.07] bg-white p-5 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-crimson-200 hover:shadow-lift"
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-crimson-50 text-crimson-600 transition-colors group-hover:bg-crimson-600 group-hover:text-white">
                <Icon className="text-lg" />
              </span>
              <span>
                <span className="block text-sm font-semibold leading-snug text-ink">
                  {c.title}
                </span>
                <span className="mt-1 block text-xs text-ink/45">
                  {count} option{count === 1 ? "" : "s"}
                </span>
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
