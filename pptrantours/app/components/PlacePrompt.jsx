"use client";

import { FaMapMarkerAlt, FaArrowRight, FaCheckCircle } from "react-icons/fa";
import { usePlace } from "./PlaceProvider";

/**
 * The band that asks the one question the whole site is built around.
 *
 * Once answered it does not disappear — it flips to confirming the answer and
 * offering to change it. A control that vanishes after use leaves a guest who
 * picked the wrong resort with no obvious way back.
 */
export default function PlacePrompt({ dict }) {
  const { place, ready, openPicker } = usePlace();
  const t = dict?.placePrompt ?? {};

  const chosen = ready && place;

  return (
    <section className="border-b border-ink/[0.07] bg-crimson-50/50">
      <div className="shell flex flex-col items-start gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3.5">
          <span
            className={`mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
              chosen
                ? "bg-crimson-600 text-white"
                : "bg-white text-crimson-600 shadow-card"
            }`}
          >
            {chosen ? <FaCheckCircle /> : <FaMapMarkerAlt />}
          </span>
          <div>
            <p className="text-sm font-semibold text-ink">
              {chosen
                ? `${t.showingFor ?? "Showing prices for"} ${place.name}`
                : t.title ?? "Where are you staying?"}
            </p>
            <p className="mt-0.5 text-sm leading-relaxed text-ink/60">
              {chosen
                ? t.chosenBody ??
                  "Every price on the site is now the real transport price from your resort."
                : t.body ??
                  "Tell us your hotel, resort or cruise pier and every price on the site becomes yours — no zones, no guessing."}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openPicker}
          className={`group inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
            chosen
              ? "border border-ink/15 text-ink/70 hover:bg-white"
              : "bg-crimson-600 text-white shadow-glow hover:bg-crimson-700"
          }`}
        >
          {chosen ? t.change ?? "Change resort" : t.choose ?? "Choose your resort"}
          <FaArrowRight className="text-xs transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>
    </section>
  );
}
