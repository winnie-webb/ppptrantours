"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import { FaSearch, FaChevronLeft, FaChevronRight, FaTimes } from "react-icons/fa";
import Link from "next/link";
import TourCard from "./TourCard";
import HotelSearch from "./HotelSearch";
import { localePath } from "../i18n/config";
import { CATEGORIES } from "../products/product";
import { lowestTransport } from "../products/pricing";
import { usePlace } from "./PlaceProvider";

const PER_PAGE = 12;

/*
 * The current query string, read without `useSearchParams()`.
 *
 * That hook would force this statically generated catalogue behind a Suspense
 * boundary or into client rendering for all ten locales, taking the tour grid
 * out of the prerendered HTML of the page most worth indexing. Nothing here
 * ever changes the snapshot after load — the chips use `replaceState`, which
 * creates no history entry and fires no event — so there is nothing to
 * subscribe to.
 */
const subscribeToNothing = () => () => {};
const readSearch = () => window.location.search;
const noSearch = () => "";

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
  /*
   * "select" the dropdown (a category page's sibling grids), "chips" the
   * filter row that replaced the catalogue's parish index, "none" on a
   * category page, which is already filtered by its route.
   */
  categoryFilter = "select",
}) {
  const [query, setQuery] = useState("");

  /*
   * The chosen category, seeded from `?parish=` so a filtered view can be
   * linked and shared.
   *
   * Derived rather than stored, the same way BookingForm reads its handoff:
   * `null` means the guest has not touched a chip, so the URL wins until they
   * do. Seeding `useState` from the URL instead would be a hydration mismatch
   * — this page is prerendered unfiltered for all ten locales — and applying
   * it from an effect would be a setState on mount.
   */
  const search = useSyncExternalStore(
    subscribeToNothing,
    readSearch,
    noSearch
  );
  const [categoryChoice, setCategory] = useState(null);
  const urlCategory = useMemo(() => {
    const wanted = new URLSearchParams(search).get("parish");
    return CATEGORIES.some((c) => c.type === wanted) ? wanted : null;
  }, [search]);
  const category = categoryChoice ?? urlCategory ?? "all";
  const [sort, setSort] = useState("price-asc");
  const [page, setPage] = useState(1);
  const { place, zone } = usePlace();
  const t = dict?.grid ?? {};

  const priceOf = useMemo(
    () => (tour) => {
      const mine = zone ? tour.zones?.[zone]?.rate : null;
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

  /*
   * `replaceState`, not `pushState`: a filtered view stays linkable, but the
   * back button still means "leave this page" rather than stepping back
   * through every chip the guest tried.
   */
  const chooseCategory = (type) => {
    update(setCategory)(type);
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (type === "all") url.searchParams.delete("parish");
    else url.searchParams.set("parish", type);
    window.history.replaceState(null, "", url);
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

  /*
   * Facet counts: how many tours each chip would show, given the keyword but
   * ignoring the chip currently active. Counted over the `tours` this grid was
   * handed, never over the whole catalogue — a chip promising six and
   * delivering four is worse than no number at all.
   */
  const counts = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matching = q
      ? tours.filter((tour) =>
          `${tour.title} ${tour.subtitle ?? ""} ${tour.desc}`
            .toLowerCase()
            .includes(q)
        )
      : tours;

    const out = { all: matching.length };
    for (const c of availableCategories) {
      out[c.type] = matching.filter(c.match).length;
    }
    return out;
  }, [tours, query, availableCategories]);

  const sorts = [
    { key: "price-asc", label: t.priceAsc ?? "Price: low to high" },
    { key: "price-desc", label: t.priceDesc ?? "Price: high to low" },
    { key: "az", label: t.az ?? "Name: A–Z" },
  ];

  return (
    <div id="tour-grid" className="scroll-mt-28">
      {/*
        The chips replaced a "By parish" index of five tiles that linked away
        to /category/*, so narrowing the list cost a page load and a trip back.
        They narrow this grid in place. The category pages still exist and are
        still indexed — a chip now offers one instead of standing in the way.
      */}
      {categoryFilter === "chips" && (
        <div className="mb-5 -mx-1 flex snap-x gap-2 overflow-x-auto px-1 pb-2 sm:flex-wrap sm:overflow-visible">
          {[{ type: "all", label: t.all ?? "All" }]
            .concat(
              availableCategories.map((c) => ({
                type: c.type,
                label: dict?.categories?.[c.type]?.short ?? c.short ?? c.title,
              }))
            )
            .map(({ type, label }) => {
              const active = category === type;
              const n = counts[type] ?? 0;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => chooseCategory(type)}
                  aria-pressed={active}
                  disabled={n === 0 && !active}
                  className={`shrink-0 snap-start whitespace-nowrap rounded-full border px-4 py-2 text-sm font-semibold transition disabled:opacity-35 ${
                    active
                      ? "border-crimson-600 bg-crimson-600 text-white shadow-sm"
                      : "border-ink/12 bg-white text-ink/70 hover:border-crimson-200 hover:text-crimson-700"
                  }`}
                >
                  {label}
                  <span
                    className={`ml-1.5 text-xs font-medium ${
                      active ? "text-white/70" : "text-ink/70"
                    }`}
                  >
                    {n}
                  </span>
                </button>
              );
            })}
        </div>
      )}

      {/*
        Replaces the PlacePrompt banner that used to sit above this grid on
        every catalogue page. A compact "Prices for {hotel}" beats a full-width
        band now that the price on every card already reflects the guest's
        resort — this is a reminder and a way to change it, not the ask.
      */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-ink/[0.07] bg-white px-4 py-3 shadow-card">
        <span className="text-sm text-ink/70">
          {place
            ? `${t.pricesFor ?? "Prices for"} ${place.name}`
            : t.chooseHotelPrompt ?? "Choose your hotel to see your price"}
        </span>
        <HotelSearch variant="compact" dict={dict} id="tour-grid-hotel" />
      </div>

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

        {categoryFilter === "select" && (
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

      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <p className="text-sm text-ink/70">
          {t.showing ?? "Showing"}{" "}
          <span className="font-semibold text-ink">
            {filtered.length === 0 ? 0 : (current - 1) * PER_PAGE + 1}–
            {Math.min(current * PER_PAGE, filtered.length)}
          </span>{" "}
          {t.of ?? "of"}{" "}
          <span className="font-semibold text-ink">{filtered.length}</span>
        </p>

        {/*
          Deleting the parish index took five in-content links to the category
          landing pages off the catalogue. This puts one back, on the parish
          the guest is actually looking at — an offer rather than a step.
        */}
        {categoryFilter === "chips" && category !== "all" && (
          <Link
            href={localePath(locale, `/category/${category}`)}
            className="text-sm font-semibold text-crimson-700 hover:underline"
          >
            {dict?.categories?.[category]?.title ?? category}
            <FaChevronRight className="ml-1.5 inline text-[0.6rem]" />
          </Link>
        )}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/15 py-20 text-center">
          <p className="font-display text-xl font-semibold text-ink">
            {t.emptyTitle ?? "Nothing matches those filters."}
          </p>
          <p className="mt-2 text-sm text-ink/70">
            {t.emptyBody ??
              "Try a broader search — or ask us directly, we build custom days all the time."}
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery("");
              chooseCategory("all");
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
