import {
  X,
  Star,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  Pencil,
  Trash2,
  FileText,
} from "lucide-react";
import type { ActivityResponse } from "../../types/activity";

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function formatDateLong(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(t: string): string {
  return t.slice(0, 5);
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

/* ── Props ─────────────────────────────────────────────────────────────── */

type Mode = "organizer" | "available";

type ActivityDetailModalProps = {
  activity: ActivityResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: Mode;
};

/* ── Composant ──────────────────────────────────────────────────────────── */

export function ActivityDetailModal({
  activity,
  open,
  onOpenChange,
  mode = "available",
}: ActivityDetailModalProps) {
  if (!open || !activity) return null;

  const isOrganizer = mode === "organizer";

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="activity-detail-title"
    >
      {/* Fond */}
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        aria-label="Fermer"
        onClick={() => onOpenChange(false)}
      />

      {/* Panel */}
      <div className="relative z-10 w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl flex flex-col">
        {/* Barre dégradée */}
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 shrink-0 rounded-t-3xl sm:rounded-t-2xl" />

        {/* En-tête */}
        <div className="p-5 flex items-start justify-between gap-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-sm">
              {isOrganizer ? (
                <Star className="h-5 w-5" />
              ) : (
                <span className="text-xs font-bold">{getInitials(activity.organizerName)}</span>
              )}
            </div>
            <div className="min-w-0">
              <h2
                id="activity-detail-title"
                className="font-bold text-slate-900 text-base leading-snug line-clamp-2"
              >
                {activity.title}
              </h2>
              <span className="inline-block mt-0.5 rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
                {activity.activityType.name}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition focus:outline-none"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Corps */}
        <div className="p-5 space-y-4 flex-1">
          {/* Badge organisateur ou organisateur externe */}
          {isOrganizer ? (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
              <Star className="h-3.5 w-3.5" />
              Vous êtes l'organisateur
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-[11px] font-bold text-white">
                {getInitials(activity.organizerName)}
              </span>
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-400">Organisé par</span>
                <span className="text-sm font-semibold text-slate-800">{activity.organizerName}</span>
              </div>
            </div>
          )}

          {/* Infos principales */}
          <div className="rounded-xl bg-slate-50 divide-y divide-slate-100">
            <InfoRow icon={<CalendarDays className="h-4 w-4 text-purple-500" />}>
              <span className="capitalize">{formatDateLong(activity.date)}</span>
            </InfoRow>
            <InfoRow icon={<Clock className="h-4 w-4 text-blue-500" />}>
              {formatTime(activity.startTime)} – {formatTime(activity.endTime)}
            </InfoRow>
            <InfoRow icon={<MapPin className="h-4 w-4 text-pink-500" />}>
              <div>
                <p>{activity.location.street}</p>
                {activity.location.complement && (
                  <p className="text-slate-400 text-xs">{activity.location.complement}</p>
                )}
                <p>
                  {activity.location.postalCode} {activity.location.city}
                </p>
              </div>
            </InfoRow>
            <InfoRow icon={<Users className="h-4 w-4 text-emerald-500" />}>
              <span>
                <span className="font-semibold">{activity.participantCount}</span>
                {" / "}
                <span className="font-semibold">{activity.capacity}</span> participant
                {activity.capacity > 1 ? "s" : ""}
              </span>
            </InfoRow>
          </div>

          {/* Description */}
          {activity.description && (
            <div className="rounded-xl bg-slate-50 p-3.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Description
                </span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{activity.description}</p>
            </div>
          )}
        </div>

        {/* Footer — boutons visuels uniquement */}
        <div className="p-4 border-t border-slate-100 flex gap-3 shrink-0">
          {isOrganizer ? (
            <>
              <button
                type="button"
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 hover:border-red-300 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </button>
              <button
                type="button"
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-200 hover:brightness-105 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
              >
                <Pencil className="h-4 w-4" />
                Modifier
              </button>
            </>
          ) : (
            <button
              type="button"
              disabled={activity.participantCount >= activity.capacity}
              className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white shadow-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                activity.participantCount >= activity.capacity
                  ? "cursor-not-allowed bg-slate-300 text-slate-500 shadow-none"
                  : "bg-gradient-to-r from-blue-500 to-purple-600 shadow-purple-200 hover:brightness-105"
              }`}
            >
              {activity.participantCount >= activity.capacity ? "Complet" : "S'inscrire"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Ligne d'info réutilisable ──────────────────────────────────────────── */

function InfoRow({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 px-3.5 py-2.5">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="text-sm text-slate-700 leading-snug">{children}</span>
    </div>
  );
}
