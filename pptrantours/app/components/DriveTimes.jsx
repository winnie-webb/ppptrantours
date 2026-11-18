import { FaCar } from "react-icons/fa";
import { DRIVE_TABLE, formatDrive } from "@/app/data/drive-times";

/**
 * The at-a-glance drive-time lists: airport to hotels, hotels to attractions,
 * and each cruise port to attractions. `only` limits it to some of the groups.
 */
export default function DriveTimes({ dict, only, className = "" }) {
  const t = dict?.driveTimes ?? {};
  const groups = only
    ? DRIVE_TABLE.filter((g) => only.includes(g.key))
    : DRIVE_TABLE;

  return (
    <div className={`grid gap-5 sm:grid-cols-2 ${groups.length > 2 ? "lg:grid-cols-4" : ""} ${className}`}>
      {groups.map((group) => (
        <div key={group.key} className="card p-6">
          <h3 className="flex items-center gap-2 font-display text-lg font-semibold text-ink">
            <FaCar className="shrink-0 text-sm text-crimson-600" aria-hidden />
            {t.groups?.[group.key] ?? group.title}
          </h3>
          <ul className="mt-4 divide-y divide-ink/[0.06] text-sm">
            {group.rows.map(([label, minutes]) => (
              <li key={label} className="flex items-baseline justify-between gap-3 py-2">
                <span className="text-ink/75">{label}</span>
                <span className="shrink-0 whitespace-nowrap text-ink/60">
                  ({formatDrive(minutes, dict?.drive)})
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
