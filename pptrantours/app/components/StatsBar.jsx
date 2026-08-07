import { stats } from "../data/site";

export default function StatsBar() {
  return (
    <section className="border-y border-ink/[0.07] bg-sand">
      <div className="shell grid grid-cols-2 divide-ink/[0.07] py-10 sm:divide-x lg:grid-cols-4 lg:py-12">
        {stats.map((s) => (
          <div key={s.label} className="px-2 py-4 text-center sm:px-6">
            <p className="font-display text-4xl font-semibold text-crimson-700 lg:text-5xl">
              {s.value}
            </p>
            <p className="mt-2 text-sm font-semibold text-ink">{s.label}</p>
            <p className="mt-0.5 text-xs text-ink/50">{s.sub}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
