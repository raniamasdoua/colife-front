import { X, Calendar, MapPin, Users } from "lucide-react";
import type { ActivityItem } from "./homeData";

type ActivityDetailModalProps = {
  activity: ActivityItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ActivityDetailModal({
  activity,
  open,
  onOpenChange,
}: ActivityDetailModalProps) {
  if (!open || !activity) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="activity-detail-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        aria-label="Fermer"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
          <img
            src={activity.image}
            alt={activity.title}
            className="h-full w-full object-cover"
          />
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white hover:bg-black/55 transition"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
          <span className="absolute bottom-3 left-3 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-slate-800 shadow">
            {activity.type}
          </span>
        </div>
        <div className="p-4 sm:p-5 space-y-3">
          <h2 id="activity-detail-title" className="text-xl font-bold text-slate-900">
            {activity.title}
          </h2>
          {activity.description ? (
            <p className="text-sm text-slate-600 leading-relaxed">{activity.description}</p>
          ) : null}
          <div className="flex flex-col gap-2 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 shrink-0 text-purple-600" />
              <span>
                {activity.date} · {activity.time}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-purple-600" />
              <span>{activity.location}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 shrink-0 text-purple-600" />
              <span>
                {activity.participants.current}/{activity.participants.max} participants
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-1">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-100 to-pink-100 text-xs font-bold text-purple-800">
              {activity.organizer.avatar}
            </span>
            <span className="text-sm font-medium text-slate-800">{activity.organizer.name}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
