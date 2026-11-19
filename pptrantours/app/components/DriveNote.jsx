"use client";

import { FaCar } from "react-icons/fa";
import {
  airportDriveMinutes,
  tourDriveMinutes,
  formatDrive,
} from "@/app/data/drive-times";
import { usePlace } from "./PlaceProvider";

/**
 * The drive time, on the booking form itself, for the hotel the guest has
 * just picked — it changes the moment they change hotel (owner, 2026-11-18:
 * show it where they book, "that way the user sees the time in real time").
 *
 * `tour` set: from the guest's pickup point to that tour.
 * `tour` unset: from Sangster International (MBJ) to `place`, or to the
 * guest's chosen hotel when no place is fixed by the page.
 */
export default function DriveNote({ tour, place: fixedPlace, dict, className = "" }) {
  const { place: chosen, ready } = usePlace();
  if (!ready && !fixedPlace) return null;
  const place = fixedPlace ?? chosen;
  if (!place) return null;

  const t = dict?.drive ?? {};
  const minutes = tour
    ? tourDriveMinutes(tour, place.key)
    : airportDriveMinutes(place);
  const label = formatDrive(minutes, t);
  if (!label) return null;

  const from = tour
    ? `${t.from ?? "from"} ${place.name}`
    : t.fromAirport ?? "from Sangster International (MBJ)";

  return (
    <p
      aria-live="polite"
      className={`flex items-center gap-2 rounded-xl bg-crimson-50 px-3.5 py-2.5 text-sm text-ink/80 ${className}`}
    >
      <FaCar className="shrink-0 text-crimson-600" aria-hidden />
      <span>
        <span key={label} className="inline-block animate-fade-up font-semibold text-ink">
          {label}
        </span>{" "}
        {from}
      </span>
    </p>
  );
}
