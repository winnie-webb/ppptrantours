"use client";

import { FaCar } from "react-icons/fa";
import { tourDriveMinutes, formatDrive } from "@/app/data/drive-times";
import { usePlace } from "./PlaceProvider";

/**
 * "35 min drive" from the guest's own pickup point (hotel or cruise port).
 *
 * Renders nothing until a pickup is known: a drive time from nowhere in
 * particular would be a guess presented as a fact.
 */
export default function DriveTime({ tour, dict, className = "" }) {
  const { placeKey, ready } = usePlace();
  if (!ready) return null;
  const label = formatDrive(tourDriveMinutes(tour, placeKey), dict?.drive);
  if (!label) return null;

  return (
    <span className={`flex items-center gap-1.5 ${className}`}>
      <FaCar className="text-[0.7rem]" aria-hidden />({label})
    </span>
  );
}
