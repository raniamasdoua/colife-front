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
  UserMinus,
} from "lucide-react";
import {
  deleteActivity,
  subscribeToActivity,
  unsubscribeFromActivity,
} from "../../services/activityService";
import { ApiRequestError } from "../../services/api";
import type { ActivityResponse } from "../../types/activity";
import { isActivityNoLongerEditable } from "../../utils/activitySchedule";
import { MessageModal } from "../ui/MessageModal";

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
  onEdit?: (activity: ActivityResponse) => void;
  /** Appelé après suppression réussie (retrait des listes côté parent). */
  onDeleted?: (activityId: number) => void;
  /** Appelé après inscription réussie (mise à jour des listes côté parent). */
  onSubscribed?: (updated: ActivityResponse) => void;
  /** Appelé après désinscription réussie. */
  onUnsubscribed?: (updated: ActivityResponse) => void;
  /**
   * Si défini, les erreurs API de désinscription sont remontées (ex. modale sur la page).
   * Sinon, affichage dans une modale interne au détail.
   */
  onUnsubscribeError?: (message: string) => void;
  /**
   * Activité ouverte en tant que participant déjà inscrit (ex. depuis « À venir » ou le planning).
   */
  isSubscribed?: boolean;
};

/* ── Composant ──────────────────────────────────────────────────────────── */

type DeletePhase = "idle" | "confirm";

export function ActivityDetailModal({
  activity,
  open,
  onOpenChange,
  mode = "available",
  onEdit,
  onDeleted,
  onSubscribed,
  onUnsubscribed,
  onUnsubscribeError,
  isSubscribed = false,
}: ActivityDetailModalProps) {
  const [deletePhase, setDeletePhase] = useState<DeletePhase>("idle");
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [subscribeSubmitting, setSubscribeSubmitting] = useState(false);
  const [subscribeErrorModalMessage, setSubscribeErrorModalMessage] = useState<string | null>(null);
  const [unsubscribeSubmitting, setUnsubscribeSubmitting] = useState(false);
  const [unsubscribeErrorModalMessage, setUnsubscribeErrorModalMessage] = useState<string | null>(null);
  const [subscribeDone, setSubscribeDone] = useState(false);
  const [localActivity, setLocalActivity] = useState<ActivityResponse | null>(null);

  useEffect(() => {
    if (!open) {
      setDeletePhase("idle");
      setDeleteSubmitting(false);
      setDeleteError(null);
      setSubscribeSubmitting(false);
      setSubscribeErrorModalMessage(null);
      setUnsubscribeSubmitting(false);
      setUnsubscribeErrorModalMessage(null);
      setSubscribeDone(false);
      setLocalActivity(null);
    }
  }, [open]);

  useEffect(() => {
    if (open) {
      setLocalActivity(activity);
    }
  }, [open, activity]);

  if (!open || !activity || !localActivity) return null;

  const isOrganizer = mode === "organizer";
  const canEditOrDelete = !isActivityNoLongerEditable(localActivity);
  const showOrganizerActions = isOrganizer && canEditOrDelete;

  const handleConfirmDelete = async () => {
    setDeleteError(null);
    setDeleteSubmitting(true);
    try {
      await deleteActivity(localActivity.id);
      onDeleted?.(localActivity.id);
      onOpenChange(false);
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

  const canSubscribe =
    !isOrganizer &&
    !isSubscribed &&
    !subscribeDone &&
    !subscribeSubmitting &&
    localActivity.participantCount < localActivity.capacity;

  const canUnsubscribe =
    isSubscribed && !isOrganizer && !isActivityNoLongerEditable(localActivity);

  const handleUnsubscribe = async () => {
    setUnsubscribeErrorModalMessage(null);
    setUnsubscribeSubmitting(true);
    try {
      const updated = await unsubscribeFromActivity(localActivity.id);
      setLocalActivity(updated);
      onUnsubscribed?.(updated);
      onOpenChange(false);
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : "Impossible de vous désinscrire. Réessayez.";
      if (onUnsubscribeError) {
        onUnsubscribeError(msg);
      } else {
        setUnsubscribeErrorModalMessage(msg);
      }
    } finally {
      setUnsubscribeSubmitting(false);
    }
  };

  const handleSubscribe = async () => {
    setSubscribeErrorModalMessage(null);
    setSubscribeSubmitting(true);
    try {
      const updated = await subscribeToActivity(localActivity.id);
      setLocalActivity(updated);
      setSubscribeDone(true);
      onSubscribed?.(updated);
    } catch (e) {
      setSubscribeErrorModalMessage(
        e instanceof ApiRequestError
          ? e.message
          : "Impossible de s'inscrire. Réessayez."
      );
    } finally {
      setSubscribeSubmitting(false);
    }
  };

  return (
    <>
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
                <span className="text-xs font-bold">{getInitials(localActivity.organizerName)}</span>
              )}
            </div>
            <div className="min-w-0">
              <h2
                id="activity-detail-title"
                className="font-bold text-slate-900 text-base leading-snug line-clamp-2"
              >
                {localActivity.title}
              </h2>
              <span className="inline-block mt-0.5 rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
                {localActivity.activityType.name}
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
                {getInitials(localActivity.organizerName)}
              </span>
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-400">Organisé par</span>
                <span className="text-sm font-semibold text-slate-800">{localActivity.organizerName}</span>
              </div>
            </div>
          )}

          {/* Infos principales */}
          <div className="rounded-xl bg-slate-50 divide-y divide-slate-100">
            <InfoRow icon={<CalendarDays className="h-4 w-4 text-purple-500" />}>
              <span className="capitalize">{formatDateLong(localActivity.date)}</span>
            </InfoRow>
            <InfoRow icon={<Clock className="h-4 w-4 text-blue-500" />}>
              {formatTime(localActivity.startTime)} – {formatTime(localActivity.endTime)}
            </InfoRow>
            <InfoRow icon={<MapPin className="h-4 w-4 text-pink-500" />}>
              <div>
                <p>{localActivity.location.street}</p>
                {localActivity.location.complement && (
                  <p className="text-slate-400 text-xs">{localActivity.location.complement}</p>
                )}
                <p>
                  {localActivity.location.postalCode} {localActivity.location.city}
                </p>
              </div>
            </InfoRow>
            <InfoRow icon={<Users className="h-4 w-4 text-emerald-500" />}>
              <span>
                <span className="font-semibold">{localActivity.participantCount}</span>
                {" / "}
                <span className="font-semibold">{localActivity.capacity}</span> participant
                {localActivity.capacity > 1 ? "s" : ""}
              </span>
            </InfoRow>
          </div>

          {/* Description */}
          {localActivity.description && (
            <div className="rounded-xl bg-slate-50 p-3.5">
              <div className="flex items-center gap-1.5 mb-1.5">
                <FileText className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  Description
                </span>
              </div>
              <p className="text-sm text-slate-700 leading-relaxed">{localActivity.description}</p>
            </div>
          )}
        </div>

        {/* Footer — organisateur : modifier / supprimer (masqués si passée / déjà commencée) */}
        <div className="p-4 border-t border-slate-100 flex flex-col gap-3 shrink-0">
          {isOrganizer ? (
            !showOrganizerActions ? (
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
                  Supprimer cette activité ? Les inscriptions seront annulées. Cette action est irréversible
                  côté affichage (l&apos;activité ne sera plus visible).
                </p>
                {localActivity.participantCount > 0 && (
                  <p className="text-xs font-medium text-amber-800 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
                    {localActivity.participantCount} participant
                    {localActivity.participantCount > 1 ? "s" : ""} inscrit
                    {localActivity.participantCount > 1 ? "s" : ""} — ils seront désinscrits automatiquement.
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
            )
          ) : isSubscribed ? (
            canUnsubscribe ? (
              <button
                type="button"
                disabled={unsubscribeSubmitting}
                className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-100 hover:border-red-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 disabled:opacity-60"
                onClick={handleUnsubscribe}
              >
                {unsubscribeSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
                    Désinscription…
                  </>
                ) : (
                  <>
                    <UserMinus className="h-4 w-4 shrink-0" />
                    Se désinscrire
                  </>
                )}
              </button>
            ) : (
              <p className="text-center text-xs text-slate-500 leading-relaxed px-1 py-1">
                Cette activité a déjà commencé ou est passée : la désinscription n&apos;est plus possible.
              </p>
            )
          ) : (
            <div className="space-y-2">
              <button
                type="button"
                onClick={handleSubscribe}
                disabled={!canSubscribe}
                className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white shadow-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                  subscribeDone
                    ? "bg-emerald-600 shadow-emerald-200"
                    : localActivity.participantCount >= localActivity.capacity
                      ? "cursor-not-allowed bg-slate-300 text-slate-500 shadow-none"
                      : "bg-gradient-to-r from-blue-500 to-purple-600 shadow-purple-200 hover:brightness-105"
                }`}
              >
                {subscribeSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Inscription…
                  </>
                ) : subscribeDone ? (
                  "Inscrit"
                ) : localActivity.participantCount >= localActivity.capacity ? (
                  "Complet"
                ) : (
                  "S'inscrire"
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
    <MessageModal
      open={!!subscribeErrorModalMessage}
      title="Inscription impossible"
      message={subscribeErrorModalMessage ?? ""}
      onClose={() => setSubscribeErrorModalMessage(null)}
    />
    <MessageModal
      open={!!unsubscribeErrorModalMessage && !onUnsubscribeError}
      title="Désinscription impossible"
      message={unsubscribeErrorModalMessage ?? ""}
      onClose={() => setUnsubscribeErrorModalMessage(null)}
    />
    </>
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
