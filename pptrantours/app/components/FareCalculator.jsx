"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { FaArrowRight, FaWhatsapp, FaPlane, FaMinus, FaPlus } from "react-icons/fa";
import { PLACES, placesByArea } from "@/app/data/places";
import {
  priceTransfer,
  money,
  MIN_BILLED_PAX,
} from "@/app/products/pricing";
import { localePath } from "@/app/i18n/config";
import { site } from "@/app/data/site";

/**
 * Airport fare calculator.
 *
 * Answers the only question an arriving guest has — "what will it cost to get
 * me from the airport to my hotel" — in one screen, before any form. Picking a
 * resort here is also how they reach that resort's own page, so the calculator
 * doubles as navigation into the 46 transfer pages.
 */
export default function FareCalculator({ locale = "en", dict }) {
  const t = dict?.fare ?? {};
  const [placeKey, setPlaceKey] = useState("");
  const [tripType, setTripType] = useState("round-trip");
  const [pax, setPax] = useState(2);

  // The two cruise piers have no published fare, so offering them would put a
  // resort in the box that nothing can price. One filter, shared with the
  // picker on /transfers.
  const grouped = useMemo(() => placesByArea((p) => p.transfer), []);

  const place = PLACES.find((p) => p.key === placeKey) ?? null;
  const quote = placeKey ? priceTransfer(placeKey, tripType, pax) : null;

  /*
   * The direction and the party size travel with the link.
   *
   * Without them the booking form opened on its own defaults — round trip, two
   * adults — and a guest who had just said "one way, five of us" said it
   * again. Only non-defaults are emitted, so the ordinary case still links to
   * the bare canonical URL and crawlers are not handed 46 query variants of
   * every transfer page.
   */
  const handoff = useMemo(() => {
    const params = new URLSearchParams();
    if (tripType === "one-way") params.set("trip", "one-way");
    if (pax !== 2) params.set("pax", String(pax));
    const qs = params.toString();
    return qs ? `?${qs}` : "";
  }, [tripType, pax]);

  return (
    <div className="overflow-hidden rounded-3xl border border-ink/[0.07] bg-white shadow-lift">
      <div className="grid gap-0 lg:grid-cols-[1.3fr_1fr]">
        {/* Inputs */}
        <div className="space-y-5 p-6 sm:p-8">
          <div className="flex items-center gap-2.5 text-sm font-semibold text-ink/60">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-crimson-50 text-crimson-600">
              <FaPlane className="text-xs" />
            </span>
            {t.from ?? "From Sangster International (MBJ)"}
          </div>

          <div>
            <label htmlFor="fare-place" className="label">
              {t.destination ?? "Which resort are we taking you to?"}
            </label>
            <select
              id="fare-place"
              value={placeKey}
              onChange={(e) => setPlaceKey(e.target.value)}
              className="field"
            >
              <option value="">{t.choose ?? "Choose your hotel or resort…"}</option>
              {grouped.map((group) => (
                <optgroup
                  key={group.key}
                  label={dict?.areas?.[group.key] ?? group.label}
                >
                  {group.places.map((p) => (
                    <option key={p.key} value={p.key}>
                      {p.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="label">{t.tripType ?? "Trip type"}</span>
              <div className="grid grid-cols-2 gap-1.5 rounded-xl border border-ink/15 p-1.5">
                {[
                  { key: "round-trip", label: t.roundTrip ?? "Return" },
                  { key: "one-way", label: t.oneWay ?? "One way" },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setTripType(opt.key)}
                    aria-pressed={tripType === opt.key}
                    className={`rounded-lg px-2 py-2 text-sm font-semibold transition ${
                      tripType === opt.key
                        ? "bg-crimson-600 text-white shadow-sm"
                        : "text-ink/60 hover:bg-ink/5"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="label">{t.passengers ?? "Passengers"}</span>
              <div className="flex items-center gap-2 rounded-xl border border-ink/15 p-1.5">
                <button
                  type="button"
                  aria-label={t.fewer ?? "Fewer passengers"}
                  onClick={() => setPax((v) => Math.max(1, v - 1))}
                  disabled={pax <= 1}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink/5 text-ink/70 transition hover:bg-ink/10 disabled:opacity-30"
                >
                  <FaMinus className="text-[0.6rem]" />
                </button>
                <span className="flex-1 text-center text-sm font-semibold text-ink">
                  {pax}
                </span>
                <button
                  type="button"
                  aria-label={t.more ?? "More passengers"}
                  onClick={() => setPax((v) => v + 1)}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-ink/5 text-ink/70 transition hover:bg-ink/10"
                >
                  <FaPlus className="text-[0.6rem]" />
                </button>
              </div>
            </div>
          </div>

          <p className="text-xs leading-relaxed text-ink/70">
            {t.noteTotal ??
              `For bookings of 1 to ${MIN_BILLED_PAX} people the total is based on the ${MIN_BILLED_PAX}-person rate, so 1, 2, 3 or ${MIN_BILLED_PAX} people all pay the same. In US dollars, and the meet-and-greet inside arrivals is included.`}
          </p>
        </div>

        {/* Result */}
        <div className="flex flex-col justify-center bg-ink p-6 text-white sm:p-8">
          {!quote ? (
            <p className="text-sm leading-relaxed text-white/70">
              {t.prompt ??
                "Choose your resort and the exact fare appears here — no forms, no waiting for an email."}
            </p>
          ) : (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider text-white/70">
                {tripType === "round-trip"
                  ? t.roundTripLabel ?? "Round-trip private transfer"
                  : t.oneWayLabel ?? "One-way private transfer"}
              </p>
              {/*
                The total, and only the total.

                This printed the per-head rate at 5xl, the total underneath it,
                and then a "4 × $30" row spelling out the arithmetic — three
                figures for one fare. A guest pays one number; the per-person
                rate belongs on the cards, where it is a shop window rather
                than a quote.
              */}
              <p className="mt-1.5 font-display text-5xl font-semibold text-gold-400">
                {money(quote.total)}
              </p>
              <p className="mt-1 text-sm font-semibold text-white/75">
                {t.totalFor?.replace("{n}", String(pax)) ??
                  `total for ${pax}`}
              </p>
              <p className="mt-2 text-sm text-white/60">{place.name}</p>

              <div className="mt-5 flex flex-col gap-2.5">
                {/*
                  The direction and the party size travel with the link.

                  Without them the booking form opened on its own defaults —
                  round trip, two adults — and a guest who had just said
                  "one way, five of us" had to say it again. BookingForm reads
                  these after mount.
                */}
                <Link
                  href={`${localePath(locale, `/transfer/${place.key}`)}${handoff}`}
                  className="btn-primary w-full"
                >
                  {t.book ?? "Book this transfer"}
                  <FaArrowRight className="text-xs" />
                </Link>
                <a
                  href={site.contact.whatsappHref}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-white/20 px-5 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10"
                >
                  <FaWhatsapp />
                  {t.ask ?? "Ask a question"}
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
