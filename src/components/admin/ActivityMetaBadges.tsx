import { Building2, Car, MapPin } from "lucide-react";
import type { ActivityResponse } from "../../types/activity";

type ActivityMetaBadgesProps = {
  activity: ActivityResponse;
  size?: "xs" | "sm";
};

export function ActivityMetaBadges({ activity, size = "xs" }: ActivityMetaBadgesProps) {
  const text = size === "sm" ? "text-[11px]" : "text-[10px]";
  const icon = size === "sm" ? "h-3 w-3" : "h-2.5 w-2.5";
  const pad = size === "sm" ? "px-2 py-0.5" : "px-1.5 py-0.5";

  return (
    <>
      {activity.locationType === "ON_SITE" ? (
        <span
          className={`inline-flex items-center gap-0.5 rounded-full bg-emerald-50 ${pad} ${text} font-semibold text-emerald-700 ring-1 ring-emerald-100`}
        >
          <Building2 className={icon} />
          Sur site
        </span>
      ) : (
        <span
          className={`inline-flex items-center gap-0.5 rounded-full bg-blue-50 ${pad} ${text} font-semibold text-blue-700 ring-1 ring-blue-100`}
        >
          <MapPin className={icon} />
          Hors site
        </span>
      )}
      {activity.carpool && activity.locationType === "OFF_SITE" && (
        <span
          className={`inline-flex items-center gap-0.5 rounded-full bg-violet-50 ${pad} ${text} font-semibold text-violet-700 ring-1 ring-violet-100`}
        >
          <Car className={icon} />
          Covoiturage
        </span>
      )}
    </>
  );
}
