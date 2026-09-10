"use client";

import { FaMapMarkerAlt, FaChevronDown } from "react-icons/fa";
import { usePlace } from "./PlaceProvider";

/**
 * The header's "staying at" control.
 *
 * Renders the prompt shape on the server and until localStorage has been read,
 * so the markup the server sent and the first client paint agree. Swapping in
 * the stored resort afterwards is a one-frame change nobody notices; getting it
 * wrong is a hydration mismatch that blanks the header.
 */
export default function PlaceChip({
  dict,
  light = false,
  compact = false,
  className = "",
}) {
  const { place, ready, openPicker } = usePlace();
  const t = dict?.place ?? {};

  const label = ready && place ? place.name : t.prompt ?? "Where are you staying?";

  return (
    <button
      type="button"
      onClick={openPicker}
      title={t.change ?? "Change your resort"}
      className={`flex items-center gap-2 whitespace-nowrap rounded-full font-medium transition ${
        compact
          ? "max-w-[16rem] px-2.5 py-1 text-xs text-white/70 hover:bg-white/10 hover:text-white"
          : light
            ? "max-w-[15rem] px-3.5 py-2 text-sm text-white/90 hover:bg-white/10 hover:text-white"
            : "max-w-[15rem] px-3.5 py-2 text-sm text-ink/75 hover:bg-ink/5 hover:text-ink"
      } ${className}`}
    >
      <FaMapMarkerAlt
        className={`shrink-0 ${compact ? "text-[0.7rem]" : "text-xs"} ${
          ready && place ? "text-crimson-500" : "opacity-50"
        }`}
      />
      <span className="truncate">{label}</span>
      <FaChevronDown className="shrink-0 text-[0.55rem] opacity-50" />
    </button>
  );
}
