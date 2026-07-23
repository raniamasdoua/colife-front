import { CalendarCheck, CalendarX, Trash } from "lucide-react";
import type { ActivityResponse } from "../../types/activity";
import { isActivityNoLongerEditable } from "../../utils/activitySchedule";

export function isPastActivity(activity: ActivityResponse): boolean {
  return isActivityNoLongerEditable(activity, new Date());
}

export function ActivityStatusBadge({ activity }: { readonly activity: ActivityResponse }) {
  if (activity.deleted) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-600">
        <Trash className="h-3 w-3" />
        Supprimée
      </span>
    );
  }
  const past = isPastActivity(activity);
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
        past ? "bg-slate-100 text-slate-500" : "bg-emerald-100 text-emerald-700"
      }`}
    >
      {past ? (
        <>
          <CalendarX className="h-3 w-3" />
          Passée
        </>
      ) : (
        <>
          <CalendarCheck className="h-3 w-3" />
          À venir
        </>
      )}
    </span>
  );
}
