import { useEffect, useState } from "react";
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
  Loader2,
} from "lucide-react";
import { deleteActivity } from "../../services/activityService";
import { ApiRequestError } from "../../services/api";
import type { ActivityResponse } from "../../types/activity";
import { isActivityNoLongerEditable } from "../../utils/activitySchedule";

/* ── Helpers ────────────────────────────────────────────────────────────────── */

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

/* ── Props ──────────────────────────────────────────────────────────────────── */

type Props = {
  activity: ActivityResponse | null;
  open: boolean;
  onClose: () => void;
  onEdit?: (activity: ActivityResponse) => void;
  onDeleted?: (activityId: number) => void;
};

type DeletePhase = "idle" | "confirm";

/* ── Composant ──────────────────────────────────────────────────────────────── */

export function ActivityDetailModal({ activity, open, onClose, onEdit, onDeleted }: Props) {
  const [deletePhase, setDeletePhase] = useState<DeletePhase>("idle");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setDeletePhase("idle");
      setDeleteSubmitting(false);
      setDeleteError(null);
    }
  }, [open]);

  if (!open || !activity) return null;

  const canEditOrDelete = !isActivityNoLongerEditable(activity);

  const handleConfirmDelete = async () => {
    setDeleteError(null);
    setDeleteSubmitting(true);
    try {
      await deleteActivity(activity.id);
      onDeleted?.(activity.id);
      onClose();
    } catch (e) {
      setDeleteError(
        e instanceof ApiRequestError
          ? e.message
          : "Impossible de supprimer l'activité. Réessayez."
      );
    } finally {
      setDeleteSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      {/* Fond */}
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        aria-label="Fermer"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl flex flex-col">
        {/* Barre dégradée */}
        <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 shrink-0 rounded-t-3xl sm:rounded-t-2xl" />

        {/* En-tête */}
        <div className="p-5 flex items-start justify-between gap-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-sm">
              <Star className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
                {activity.title}
              </h2>
              <span className="inline-block mt-0.5 rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
                {activity.activityType.name}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition focus:outline-none"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Corps */}
        <div className="p-5 space-y-4 flex-1">
          {/* Badge organisateur */}
          <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
            <Star className="h-3.5 w-3.5" />
            Vous êtes l'organisateur
          </div>

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
                <span className="font-semibold">{activity.capacity}</span> place
                {activity.capacity > 1 ? "s" : ""} au total
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
              <p className="text-sm text-slate-700 leading-relaxed">
                {activity.description}
              </p>
            </div>
          )}
        </div>

        {/* Actions — masquées si l'activité est passée ou déjà commencée */}
        <div className="p-4 border-t border-slate-100 flex flex-col gap-3 shrink-0">
          {!canEditOrDelete ? (
            <p className="text-center text-xs text-slate-500 leading-relaxed px-1 py-1">
              Cette activité est terminée ou a déjà commencée : la modification et la suppression ne sont plus
              disponibles.
            </p>
          ) : deletePhase === "idle" ? (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteError(null);
                  setDeletePhase("confirm");
                }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 hover:border-red-300 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </button>
              <button
                type="button"
                onClick={() => onEdit?.(activity)}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-200 hover:brightness-105 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
              >
                <Pencil className="h-4 w-4" />
                Modifier
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 leading-relaxed">
                Supprimer cette activité ? Les inscriptions seront annulées. Cette action est irréversible côté affichage.
              </p>
              {activity.participantCount > 0 && (
                <p className="text-xs font-medium text-amber-800 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
                  {activity.participantCount} participant
                  {activity.participantCount > 1 ? "s" : ""} inscrit
                  {activity.participantCount > 1 ? "s" : ""} — désinscription automatique.
                </p>
              )}
              {deleteError ? (
                <div
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                  role="alert"
                >
                  {deleteError}
                </div>
              ) : null}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setDeletePhase("idle");
                    setDeleteError(null);
                  }}
                  disabled={deleteSubmitting}
                  className="flex-1 rounded-xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Retour
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={deleteSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-red-300 bg-red-600 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  {deleteSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Suppression…
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      Confirmer la suppression
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Ligne d'info réutilisable ──────────────────────────────────────────────── */

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
