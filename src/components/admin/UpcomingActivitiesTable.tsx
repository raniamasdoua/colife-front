import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, User, Users } from "lucide-react";
import type { ActivityResponse } from "../../types/activity";
import { getTypeConfig } from "../../utils/activityDisplay";
import {
  formatActivityLocationMeta,
  formatActivityLocationShort,
} from "../../utils/activityLocationDisplay";
import { ActivityMetaBadges } from "./ActivityMetaBadges";
import { COLIFE_CARD, COLIFE_SECTION_LABEL } from "./adminTheme";

function formatTime(hms: string): string {
  return hms.slice(0, 5);
}

interface UpcomingActivitiesTableProps {
  activities: ActivityResponse[];
  onRowClick?: (activity: ActivityResponse) => void;
}

export function UpcomingActivitiesTable({
  activities,
  onRowClick,
}: UpcomingActivitiesTableProps) {
  return (
    <section>
      <h2 className={`${COLIFE_SECTION_LABEL} mb-3`}>Prochaines activités</h2>
      <div className={COLIFE_CARD}>
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-purple-50/40">
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Activité
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Date / Heure
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Lieu
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Organisateur
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Inscrits
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {activities.map((activity) => {
                const isFull = activity.participantCount >= activity.capacity;
                const typeConfig = getTypeConfig(activity.activityType.name);
                const locationMeta = formatActivityLocationMeta(activity);
                return (
                  <tr
                    key={activity.id}
                    onClick={() => onRowClick?.(activity)}
                    className={`hover:bg-purple-50/40 transition-colors ${
                      onRowClick ? "cursor-pointer" : ""
                    }`}
                  >
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-800">{activity.title}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${typeConfig.badge}`}>
                          {activity.activityType.name}
                        </span>
                        <ActivityMetaBadges activity={activity} />
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Calendar size={13} className="text-purple-300 shrink-0" />
                        <span className="font-medium">
                          {format(new Date(activity.date), "d MMM yyyy", { locale: fr })}
                        </span>
                      </div>
                      <div className="mt-0.5 pl-[19px] text-xs text-slate-400">
                        {formatTime(activity.startTime)} – {formatTime(activity.endTime)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-500 max-w-[180px]">
                      <span className="text-sm truncate block">{formatActivityLocationShort(activity)}</span>
                      {locationMeta && (
                        <span className="text-xs text-slate-400">{locationMeta}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <User size={13} className="text-purple-300" />
                        {activity.organizerName}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={`inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full ${
                          isFull
                            ? "bg-pink-100 text-pink-600"
                            : "bg-emerald-100 text-emerald-600"
                        }`}
                      >
                        {activity.participantCount}/{activity.capacity}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Mobile list */}
        <ul className="md:hidden divide-y divide-slate-50">
          {activities.map((activity) => {
            const typeConfig = getTypeConfig(activity.activityType.name);
            return (
              <li
                key={activity.id}
                onClick={() => onRowClick?.(activity)}
                className={`px-4 py-4 space-y-2 ${
                  onRowClick ? "cursor-pointer active:bg-purple-50/40" : ""
                }`}
              >
                <p className="font-semibold text-slate-800 text-sm">{activity.title}</p>
                <div className="flex flex-wrap gap-1.5">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${typeConfig.badge}`}>
                    {activity.activityType.name}
                  </span>
                  <ActivityMetaBadges activity={activity} />
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <Calendar size={11} className="text-purple-300" />
                    {format(new Date(activity.date), "d MMM", { locale: fr })}
                    {" · "}
                    {formatTime(activity.startTime)} – {formatTime(activity.endTime)}
                  </span>
                  <span>{formatActivityLocationShort(activity)}</span>
                  <span className="flex items-center gap-1">
                    <User size={11} className="text-purple-300" />
                    {activity.organizerName}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users size={11} className="text-purple-300" />
                    {activity.participantCount}/{activity.capacity}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
