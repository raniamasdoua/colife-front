import { useEffect, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Clock,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Pencil,
  Trash2,
  Users,
  X,
  CalendarCheck,
  CalendarX,
  Trash,
  Car,
  Building2,
} from "lucide-react";
import { getActivityCarpools, getActivityParticipants } from "../../services/activityService";
import { ApiRequestError } from "../../services/api";
import type {
  ActivityCarpoolsResponse,
  ActivityParticipant,
  ActivityResponse,
  CarpoolPassengerSummary,
} from "../../types/activity";
import { getTypeConfig } from "../../utils/activityDisplay";
import { isActivityNoLongerEditable } from "../../utils/activitySchedule";
import { ActivityMetaBadges } from "./ActivityMetaBadges";

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function formatDateLong(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(hms: string): string {
  return hms.slice(0, 5);
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

function isPast(activity: ActivityResponse): boolean {
  return isActivityNoLongerEditable(activity, new Date());
}

/* ── Sous-composants ──────────────────────────────────────────────────────── */

function AdminPassengerList({ passengers }: { passengers: CarpoolPassengerSummary[] }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100 transition"
      >
        <span className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5" />
          Passagers ({passengers.length})
        </span>
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <div className="mt-1.5">
          {passengers.length === 0 ? (
            <p className="px-2.5 py-2 text-xs text-slate-400 italic">Aucun passager.</p>
          ) : (
            <ul className="divide-y divide-violet-50 rounded-lg border border-violet-100 overflow-hidden">
              {passengers.map((p) => {
                const initials = p.fullName.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2);
                return (
                  <li key={p.userId} className="flex items-center gap-2.5 bg-white px-3 py-2 hover:bg-violet-50/40 transition-colors">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-400 to-purple-600 text-[10px] font-bold text-white">
                      {initials}
                    </span>
                    <span className="text-sm font-medium text-slate-800 truncate">{p.fullName}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

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

function StatusBadge({ activity }: { activity: ActivityResponse }) {
  if (activity.deleted) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-600">
        <Trash className="h-3 w-3" />
        Supprimée
      </span>
    );
  }
  const past = isPast(activity);
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

/* ── Props ────────────────────────────────────────────────────────────────── */

export interface AdminActivityDetailModalProps {
  activity: ActivityResponse | null;
  open: boolean;
  onClose: () => void;
  /** Si fourni, affiche le bouton Modifier */
  onEdit?: (a: ActivityResponse) => void;
  /** Si fourni, affiche le bouton Supprimer */
  onDelete?: (a: ActivityResponse) => void;
}

/* ── Composant principal ──────────────────────────────────────────────────── */

export function AdminActivityDetailModal({
  activity,
  open,
  onClose,
  onEdit,
  onDelete,
}: AdminActivityDetailModalProps) {
  const [participants, setParticipants] = useState<ActivityParticipant[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participantsError, setParticipantsError] = useState<string | null>(null);

  const [carpoolData, setCarpoolData] = useState<ActivityCarpoolsResponse | null>(null);
  const [carpoolLoading, setCarpoolLoading] = useState(false);
  const [carpoolError, setCarpoolError] = useState<string | null>(null);

  /* Chargement des participants à l'ouverture */
  useEffect(() => {
    if (!open || !activity) return;
    let cancelled = false;
    setParticipants([]);
    setParticipantsError(null);
    setParticipantsLoading(true);
    getActivityParticipants(activity.id)
      .then((list) => { if (!cancelled) setParticipants(list); })
      .catch((e) => {
        if (!cancelled)
          setParticipantsError(
            e instanceof ApiRequestError ? e.message : "Impossible de charger les participants."
          );
      })
      .finally(() => { if (!cancelled) setParticipantsLoading(false); });
    return () => { cancelled = true; };
  }, [open, activity]);

  /* Chargement des covoiturages (activités hors site uniquement) */
  useEffect(() => {
    if (!open || !activity || activity.locationType !== "OFF_SITE") return;
    let cancelled = false;
    setCarpoolData(null);
    setCarpoolError(null);
    setCarpoolLoading(true);
    getActivityCarpools(activity.id)
      .then((data) => { if (!cancelled) setCarpoolData(data); })
      .catch((e) => {
        if (!cancelled) {
          setCarpoolError(
            e instanceof ApiRequestError ? e.message : "Impossible de charger les covoiturages."
          );
        }
      })
      .finally(() => { if (!cancelled) setCarpoolLoading(false); });
    return () => { cancelled = true; };
  }, [open, activity]);

  /* Fermeture clavier */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open || !activity) return null;

  const past = isPast(activity);
  const canAct = !activity.deleted && !past;
  const showActions = canAct && (onEdit || onDelete);
  const typeConfig = getTypeConfig(activity.activityType.name);

  return (
    <div
      className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4"
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
        {/* Barre colorée type */}
        <div
          className={`h-1.5 bg-gradient-to-r ${typeConfig.gradient} shrink-0 rounded-t-3xl sm:rounded-t-2xl`}
        />

        {/* En-tête */}
        <div className="p-5 flex items-start justify-between gap-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${typeConfig.gradient} text-white shadow-sm text-xs font-bold`}
            >
              {getInitials(activity.organizerName)}
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-slate-900 text-base leading-snug line-clamp-2">
                {activity.title}
              </h2>
              <div className="mt-1 flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-[11px] font-semibold ${typeConfig.badge}`}
                >
                  {activity.activityType.name}
                </span>
                <ActivityMetaBadges activity={activity} />
                <StatusBadge activity={activity} />
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Corps */}
        <div className="p-5 space-y-4 flex-1">
          {/* Organisateur */}
          <div className="flex items-center gap-2.5">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${typeConfig.gradient} text-[11px] font-bold text-white`}
            >
              {getInitials(activity.organizerName)}
            </span>
            <div className="flex flex-col">
              <span className="text-[11px] text-slate-400">Organisé par</span>
              <span className="text-sm font-semibold text-slate-800">
                {activity.organizerName}
              </span>
            </div>
          </div>

          {/* Infos */}
          <div className="rounded-xl bg-slate-50 divide-y divide-slate-100">
            <InfoRow icon={<CalendarDays className="h-4 w-4 text-purple-500" />}>
              <span className="capitalize">{formatDateLong(activity.date)}</span>
            </InfoRow>
            <InfoRow icon={<Clock className="h-4 w-4 text-blue-500" />}>
              {formatTime(activity.startTime)} – {formatTime(activity.endTime)}
            </InfoRow>
            <InfoRow
              icon={
                activity.locationType === "ON_SITE"
                  ? <Building2 className="h-4 w-4 text-pink-500" />
                  : <MapPin className="h-4 w-4 text-pink-500" />
              }
            >
              {activity.locationType === "ON_SITE" ? (
                <div className="flex items-center gap-2">
                  <span>{activity.location.room}</span>
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                    Sur site
                  </span>
                </div>
              ) : (
                <div>
                  <p>{activity.location.street}</p>
                  {activity.location.complement && (
                    <p className="text-slate-400 text-xs">{activity.location.complement}</p>
                  )}
                  <p>
                    {activity.location.postalCode} {activity.location.city}
                  </p>
                </div>
              )}
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

          {/* Covoiturage — hors site uniquement */}
          {activity.locationType === "OFF_SITE" && (
            <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-3.5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
                  <Car className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="text-xs font-semibold text-violet-700 uppercase tracking-wide">
                  Covoiturages
                </span>
              </div>

              {carpoolLoading && (
                <div className="flex items-center gap-2 text-xs text-violet-600 py-1">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Chargement…
                </div>
              )}

              {carpoolError && (
                <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2 border border-red-100">
                  {carpoolError}
                </p>
              )}

              {!carpoolLoading && !carpoolError && (!carpoolData || carpoolData.carpools.length === 0) && (
                <p className="text-xs text-slate-400 italic">Aucune proposition de covoiturage.</p>
              )}

              {!carpoolLoading && !carpoolError && carpoolData && carpoolData.carpools.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[11px] text-violet-600 font-medium">
                    {carpoolData.carpools.length} proposition{carpoolData.carpools.length > 1 ? "s" : ""} active{carpoolData.carpools.length > 1 ? "s" : ""}
                  </p>
                  {carpoolData.carpools.map((c) => (
                    <div key={c.id} className="rounded-lg bg-white/80 ring-1 ring-violet-100 px-3 py-2.5 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-800">{c.driverName}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            Départ {formatTime(c.departureTime)} · {c.passengerCount}/{c.maxPassengers} passagers
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {c.status === "CANCELLED" && (
                            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                              Annulé
                            </span>
                          )}
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            c.availableSeats === 0
                              ? "bg-red-100 text-red-600"
                              : "bg-emerald-100 text-emerald-700"
                          }`}>
                            {c.availableSeats === 0 ? "Complet" : `${c.availableSeats} dispo`}
                          </span>
                        </div>
                      </div>
                      <AdminPassengerList passengers={c.passengers} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Participants */}
          <div>
            <div className="flex items-center gap-2 mb-2.5">
              <Users className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                Membres inscrits
              </span>
              {!participantsLoading && (
                <span className="ml-auto inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                  {participants.length}
                </span>
              )}
            </div>

            {participantsLoading ? (
              <div className="flex items-center justify-center py-6 gap-2 text-slate-400 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                Chargement…
              </div>
            ) : participantsError ? (
              <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">
                {participantsError}
              </p>
            ) : participants.length === 0 ? (
              <p className="text-center text-sm text-slate-400 py-4 bg-slate-50 rounded-xl">
                Aucun participant inscrit
              </p>
            ) : (
              <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden">
                {participants.map((p) => {
                  const initials = `${p.firstName[0]}${p.lastName[0]}`.toUpperCase();
                  return (
                    <li
                      key={p.id}
                      className="flex items-center gap-3 px-3.5 py-2.5 bg-white hover:bg-slate-50 transition-colors"
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${typeConfig.gradient} text-[11px] font-bold text-white`}
                      >
                        {initials}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {p.firstName} {p.lastName}
                        </p>
                        <p className="text-xs text-slate-400 flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3 shrink-0" />
                          {p.email}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* Bannière activité supprimée */}
          {activity.deleted && (
            <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
              Cette activité a été supprimée. Elle n'est plus visible des collaborateurs.
            </div>
          )}
        </div>

        {/* Footer actions (optionnelles) */}
        {showActions && (
          <div className="p-4 border-t border-slate-100 flex gap-3 shrink-0">
            {onDelete && (
              <button
                type="button"
                onClick={() => { onClose(); onDelete(activity); }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 transition"
              >
                <Trash2 className="h-4 w-4" />
                Supprimer
              </button>
            )}
            {onEdit && (
              <button
                type="button"
                onClick={() => { onClose(); onEdit(activity); }}
                className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 py-2.5 text-sm font-semibold text-white shadow-md hover:brightness-105 transition"
              >
                <Pencil className="h-4 w-4" />
                Modifier
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
