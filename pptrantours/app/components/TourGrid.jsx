"use client";

import { useMemo, useState } from "react";
import { FaSearch, FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";
import TourCard from "./TourCard";
import { CATEGORIES } from "../products/product";
import { lowestTransport } from "../products/pricing";
import { usePlace } from "./PlaceProvider";

const PER_PAGE = 12;

/**
 * Filterable, sortable, paginated grid.
 *
 * Sorting by price sorts by *the guest's* price once they have named a resort,
 * and by the cheapest published rate before that. Sorting a list by a number
 * nobody in it will actually pay would be worse than not sorting it.
 */
export default function TourGrid({
  tours,
  locale = "en",
  dict,
  showCategoryFilter = true,
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("price-asc");
  const [page, setPage] = useState(1);
  const { zone } = usePlace();
  const t = dict?.grid ?? {};

  const priceOf = useMemo(
    () => (tour) => {
      const mine = zone ? tour.zones?.[zone]?.price : null;
      return mine ?? lowestTransport(tour) ?? Infinity;
    },
    [zone]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const cat = CATEGORIES.find((c) => c.type === category);

    const list = tours.filter((tour) => {
      if (cat && !cat.match(tour)) return false;
      if (
        q &&
        !`${tour.title} ${tour.subtitle ?? ""} ${tour.desc}`
          .toLowerCase()
          .includes(q)
      ) {
        return false;
      }
      return true;
    });

    return [...list].sort((a, b) => {
      if (sort === "price-desc") return priceOf(b) - priceOf(a);
      if (sort === "az") return a.title.localeCompare(b.title);
      return priceOf(a) - priceOf(b);
    });
  }, [tours, query, category, sort, priceOf]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const visible = filtered.slice((current - 1) * PER_PAGE, current * PER_PAGE);

  const update = (fn) => (value) => {
    fn(value);
    setPage(1);
  };

  const goTo = (n) => {
    setPage(Math.min(Math.max(n, 1), totalPages));
    document
      .getElementById("tour-grid")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const availableCategories = useMemo(
    () => CATEGORIES.filter((c) => tours.some(c.match)),
    [tours]
  );

  const sorts = [
    { key: "price-asc", label: t.priceAsc ?? "Price: low to high" },
    { key: "price-desc", label: t.priceDesc ?? "Price: high to low" },
    { key: "az", label: t.az ?? "Name: A–Z" },
  ];

  return (
    <div id="tour-grid" className="scroll-mt-28">
      <div className="mb-8 flex flex-col gap-4 rounded-2xl border border-ink/[0.07] bg-white p-4 shadow-card lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <FaSearch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm text-ink/35" />
          <input
            type="search"
            value={query}
            onChange={(e) => update(setQuery)(e.target.value)}
            placeholder={t.filter ?? "Filter by name or keyword…"}
            className="field pl-11"
          />
        </div>

        {showCategoryFilter && (
          <select
            value={category}
            onChange={(e) => update(setCategory)(e.target.value)}
            aria-label={t.filterCategory ?? "Filter by category"}
            className="field lg:w-64"
          >
            <option value="all">{t.allCategories ?? "All categories"}</option>
            {availableCategories.map((c) => (
              <option key={c.type} value={c.type}>
                {dict?.categories?.[c.type]?.title ?? c.title}
              </option>
            ))}
          </select>
        )}

        <select
          value={sort}
          onChange={(e) => update(setSort)(e.target.value)}
          aria-label={t.sort ?? "Sort results"}
          className="field lg:w-56"
        >
          {sorts.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <p className="mb-6 text-sm text-ink/55">
        {t.showing ?? "Showing"}{" "}
        <span className="font-semibold text-ink">
          {filtered.length === 0 ? 0 : (current - 1) * PER_PAGE + 1}–
          {Math.min(current * PER_PAGE, filtered.length)}
        </span>{" "}
        {t.of ?? "of"}{" "}
        <span className="font-semibold text-ink">{filtered.length}</span>
      </p>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/15 py-20 text-center">
          <p className="font-display text-xl font-semibold text-ink">
            {t.emptyTitle ?? "Nothing matches those filters."}
          </p>
          <p className="mt-2 text-sm text-ink/55">
            {t.emptyBody ??
              "Try a broader search — or ask us directly, we build custom days all the time."}
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setCategory("all");
              setPage(1);
            }}
            className="btn-ghost mt-6"
          >
            <FaTimes className="text-xs" />
            {t.clear ?? "Clear filters"}
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((tour, i) => (
            <TourCard
              key={tour.id}
              tour={tour}
              locale={locale}
              dict={dict}
              priority={i < 3}
            />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <nav
          aria-label="Pagination"
          className="mt-12 flex items-center justify-center gap-1.5"
        >
          <button
            type="button"
            onClick={() => goTo(current - 1)}
            disabled={current === 1}
            aria-label={t.prev ?? "Previous page"}
            className="grid h-10 w-10 place-items-center rounded-full border border-ink/10 text-ink/70 transition hover:border-ink/25 hover:bg-ink hover:text-white disabled:pointer-events-none disabled:opacity-30"
          >
            <FaChevronLeft className="text-xs" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((n) => n === 1 || n === totalPages || Math.abs(n - current) <= 1)
            .map((n, i, arr) => (
              <span key={n} className="flex items-center gap-1.5">
                {i > 0 && arr[i - 1] !== n - 1 && (
                  <span className="px-1 text-ink/30">…</span>
                )}
                <button
                  type="button"
                  onClick={() => goTo(n)}
                  aria-current={n === current ? "page" : undefined}
                  className={`h-10 min-w-[2.5rem] rounded-full px-3 text-sm font-semibold transition ${
                    n === current
                      ? "bg-crimson-600 text-white shadow-glow"
                      : "border border-ink/10 text-ink/70 hover:border-ink/25 hover:bg-ink/5"
                  }`}
                >
                  {n}
                </button>
              </span>
            ))}

          <button
            type="button"
            onClick={() => goTo(current + 1)}
            disabled={current === totalPages}
            aria-label={t.next ?? "Next page"}
            className="grid h-10 w-10 place-items-center rounded-full border border-ink/10 text-ink/70 transition hover:border-ink/25 hover:bg-ink hover:text-white disabled:pointer-events-none disabled:opacity-30"
          >
            <FaChevronRight className="text-xs" />
          </button>
        </nav>
      )}
    </div>
  );
}
