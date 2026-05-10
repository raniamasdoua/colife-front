import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Calendar, Clock, User, Users } from "lucide-react";
import type { UpcomingActivityRow } from "../../services/adminService";

import { COLIFE_CARD, COLIFE_SECTION_LABEL } from "./adminTheme";

interface UpcomingActivitiesTableProps {
  activities: UpcomingActivityRow[];
}

export function UpcomingActivitiesTable({ activities }: UpcomingActivitiesTableProps) {
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
                  Date
                </th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Heure
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
                return (
                  <tr
                    key={activity.id}
                    className="hover:bg-purple-50/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-semibold text-slate-800">
                      {activity.title}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Calendar size={13} className="text-purple-300" />
                        {format(new Date(activity.date), "d MMM yyyy", { locale: fr })}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Clock size={13} className="text-purple-300" />
                        {activity.startTime}
                      </span>
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
          {activities.map((activity) => (
            <li key={activity.id} className="px-4 py-4 space-y-1.5">
              <p className="font-semibold text-slate-800 text-sm">{activity.title}</p>
              <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Calendar size={11} className="text-purple-300" />
                  {format(new Date(activity.date), "d MMM", { locale: fr })}
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={11} className="text-purple-300" />
                  {activity.startTime}
                </span>
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
          ))}
        </ul>
      </div>
    </section>
  );
}
