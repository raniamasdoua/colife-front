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
  Car,
  Building2,
  ChevronDown,
  ChevronRight,
  LogOut,
} from "lucide-react";
import {
  cancelCarpoolByDriver,
  createCarpoolAsSubscriber,
  deleteActivity,
  getActivityCarpools,
  getActivityParticipants,
  joinCarpool,
  leaveCarpool,
  subscribeToActivity,
  unsubscribeFromActivity,
  updateCarpool,
} from "../../services/activityService";
import { ApiRequestError } from "../../services/api";
import type {
  ActivityCarpoolsResponse,
  ActivityParticipant,
  ActivityResponse,
  CarpoolDetail,
  CarpoolPassengerSummary,
} from "../../types/activity";
import { isActivityNoLongerEditable } from "../../utils/activitySchedule";
import { shouldOfferCarpoolAfterSubscribe } from "../../utils/subscribeMessages";
import { MessageModal } from "../ui/MessageModal";
import { PostSubscribeCarpoolModal } from "./PostSubscribeCarpoolModal";
import { ActivityTimeSelect } from "../activity/ActivityTimeSelect";
import { formatDateLong, formatTime, toActivityInitials } from "../../utils/activityFormatters";

const inputClass =
  "w-full py-2 px-3 border border-gray-200 rounded-xl text-sm bg-white " +
  "focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent " +
  "disabled:opacity-50 disabled:bg-gray-50";

const labelClass = "block text-xs font-semibold text-gray-600 mb-1";

/* ── Props ─────────────────────────────────────────────────────────────── */

type Mode = "organizer" | "available";

type ActivityDetailModalProps = {
  activity: ActivityResponse | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: Mode;
  onEdit?: (activity: ActivityResponse) => void;
  onDeleted?: (activityId: number) => void;
  onSubscribed?: (updated: ActivityResponse) => void;
  onUnsubscribed?: (updated: ActivityResponse) => void;
  onUnsubscribeError?: (message: string) => void;
  isSubscribed?: boolean;
};

type DeletePhase = "idle" | "confirm";

/* ── Composant ──────────────────────────────────────────────────────────── */

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

  const [participants, setParticipants] = useState<ActivityParticipant[]>([]);
  const [participantsLoading, setParticipantsLoading] = useState(false);
  const [participantsError, setParticipantsError] = useState<string | null>(null);

  /* ── Carpool state ── */
  const [carpoolData, setCarpoolData] = useState<ActivityCarpoolsResponse | null>(null);
  const [carpoolLoading, setCarpoolLoading] = useState(false);
  const [carpoolError, setCarpoolError] = useState<string | null>(null);
  const [carpoolActionError, setCarpoolActionError] = useState<string | null>(null);
  const [carpoolActionLoading, setCarpoolActionLoading] = useState(false);
  /* Create carpool form */
  const [showCreateCarpool, setShowCreateCarpool] = useState(false);
  const [cpDepartureTime, setCpDepartureTime] = useState("");
  const [cpMaxPassengers, setCpMaxPassengers] = useState("");
  /* Edit / cancel own carpool (DRIVER) */
  const [carpoolEditing, setCarpoolEditing] = useState(false);
  const [carpoolEditDeparture, setCarpoolEditDeparture] = useState("");
  const [carpoolEditMax, setCarpoolEditMax] = useState("");
  const [carpoolEditLoading, setCarpoolEditLoading] = useState(false);
  const [carpoolEditError, setCarpoolEditError] = useState<string | null>(null);
  const [carpoolCancelLoading, setCarpoolCancelLoading] = useState(false);
  const [postSubscribeOpen, setPostSubscribeOpen] = useState(false);
  const [postSubscribeActivity, setPostSubscribeActivity] = useState<ActivityResponse | null>(null);

  const isOrganizer = mode === "organizer";
  const isUserSubscribed = isSubscribed || isOrganizer;

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
      setParticipants([]);
      setParticipantsError(null);
      setCarpoolData(null);
      setCarpoolError(null);
      setCarpoolActionError(null);
      setShowCreateCarpool(false);
      setCpDepartureTime("");
      setCpMaxPassengers("");
      setCarpoolEditing(false);
      setCarpoolEditDeparture("");
      setCarpoolEditMax("");
      setCarpoolEditError(null);
      setCarpoolCancelLoading(false);
    }
  }, [open]);

  useEffect(() => {
    if (open) setLocalActivity(activity);
  }, [open, activity]);

  /* Load participants */
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

  /* Load carpools for off-site activities */
  useEffect(() => {
    if (!open || !activity || activity.locationType !== "OFF_SITE") return;
    loadCarpools(activity.id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, activity]);

  function loadCarpools(activityId: number) {
    let cancelled = false;
    setCarpoolLoading(true);
    setCarpoolError(null);
    getActivityCarpools(activityId)
      .then((data) => {
        if (cancelled) return;
        setCarpoolData(data);
        const myCarpool =
          data.userRole === "DRIVER"
            ? data.carpools.find((c) => c.id === data.userCarpoolId)
            : null;
        if (myCarpool) {
          setCarpoolEditDeparture(myCarpool.departureTime.slice(0, 5));
          setCarpoolEditMax(String(myCarpool.maxPassengers));
        }
      })
      .catch((e) => {
        if (!cancelled)
          setCarpoolError(e instanceof ApiRequestError ? e.message : "Impossible de charger les covoiturages.");
      })
      .finally(() => { if (!cancelled) setCarpoolLoading(false); });
    return () => { cancelled = true; };
  }

  const handlePostSubscribeComplete = () => {
    const subscribed = postSubscribeActivity;
    setPostSubscribeOpen(false);
    setPostSubscribeActivity(null);
    if (subscribed) onSubscribed?.(subscribed);
  };

  if (!open || !activity || !localActivity) {
    return (
      <>
        <PostSubscribeCarpoolModal
          open={postSubscribeOpen}
          activity={postSubscribeActivity}
          onComplete={handlePostSubscribeComplete}
        />
        <MessageModal
          open={!!subscribeErrorModalMessage}
          title="Inscription impossible"
          message={subscribeErrorModalMessage ?? ""}
          onClose={() => setSubscribeErrorModalMessage(null)}
        />
      </>
    );
  }

  const canEditOrDelete = !isActivityNoLongerEditable(localActivity);
  const showOrganizerActions = isOrganizer && canEditOrDelete;

  const canSubscribe =
    !isOrganizer &&
    !isSubscribed &&
    !subscribeDone &&
    !subscribeSubmitting &&
    localActivity.participantCount < localActivity.capacity;

  const canUnsubscribe =
    isSubscribed && !isOrganizer && !isActivityNoLongerEditable(localActivity);

  const activityIsPast = isActivityNoLongerEditable(localActivity);

  /* ── Handlers ── */

  const handleConfirmDelete = async () => {
    setDeleteError(null);
    setDeleteSubmitting(true);
    try {
      await deleteActivity(localActivity.id);
      onDeleted?.(localActivity.id);
      onOpenChange(false);
    } catch (e) {
      setDeleteError(
        e instanceof ApiRequestError ? e.message : "Impossible de supprimer l'activité. Réessayez."
      );
    } finally {
      setDeleteSubmitting(false);
    }
  };

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
        e instanceof ApiRequestError ? e.message : "Impossible de vous désinscrire. Réessayez.";
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
      if (shouldOfferCarpoolAfterSubscribe(updated)) {
        setPostSubscribeActivity(updated);
        onOpenChange(false);
        setPostSubscribeOpen(true);
      } else {
        onSubscribed?.(updated);
      }
    } catch (e) {
      setSubscribeErrorModalMessage(
        e instanceof ApiRequestError ? e.message : "Impossible de s'inscrire. Réessayez."
      );
    } finally {
      setSubscribeSubmitting(false);
    }
  };

  const handleJoinCarpool = async (carpoolId: number) => {
    setCarpoolActionError(null);
    setCarpoolActionLoading(true);
    try {
      await joinCarpool(localActivity.id, carpoolId);
      loadCarpools(localActivity.id);
    } catch (e) {
      setCarpoolActionError(e instanceof ApiRequestError ? e.message : "Impossible de rejoindre ce covoiturage.");
    } finally {
      setCarpoolActionLoading(false);
    }
  };

  const handleLeaveCarpool = async (carpoolId: number) => {
    setCarpoolActionError(null);
    setCarpoolActionLoading(true);
    try {
      await leaveCarpool(localActivity.id, carpoolId);
      loadCarpools(localActivity.id);
    } catch (e) {
      setCarpoolActionError(e instanceof ApiRequestError ? e.message : "Impossible de quitter ce covoiturage.");
    } finally {
      setCarpoolActionLoading(false);
    }
  };

  const handleCreateCarpool = async () => {
    setCarpoolActionError(null);
    if (!cpDepartureTime) {
      setCarpoolActionError("L'heure de départ est obligatoire.");
      return;
    }
    const maxP = Number(cpMaxPassengers);
    if (!cpMaxPassengers || !Number.isFinite(maxP) || maxP < 1) {
      setCarpoolActionError("Le nombre de places passagers doit être supérieur ou égal à 1.");
      return;
    }
    setCarpoolActionLoading(true);
    try {
      await createCarpoolAsSubscriber(localActivity.id, {
        departureTime: cpDepartureTime + ":00",
        maxPassengers: maxP,
      });
      setShowCreateCarpool(false);
      setCpDepartureTime("");
      setCpMaxPassengers("");
      loadCarpools(localActivity.id);
    } catch (e) {
      setCarpoolActionError(e instanceof ApiRequestError ? e.message : "Impossible de proposer ce covoiturage.");
    } finally {
      setCarpoolActionLoading(false);
    }
  };

  const handleUpdateCarpool = async (carpoolId: number, passengerCount: number) => {
    setCarpoolEditError(null);
    if (!carpoolEditDeparture) {
      setCarpoolEditError("L'heure de départ est obligatoire.");
      return;
    }
    const maxP = Number(carpoolEditMax);
    if (!carpoolEditMax || !Number.isFinite(maxP) || maxP < 1) {
      setCarpoolEditError("Le nombre de places passagers doit être supérieur ou égal à 1.");
      return;
    }
    if (maxP < passengerCount) {
      setCarpoolEditError(
        `Le nombre de places ne peut pas être inférieur au nombre de passagers inscrits (${passengerCount}).`
      );
      return;
    }
    const depTime = carpoolEditDeparture + ":00";
    const actStart = localActivity.startTime;
    if (depTime >= actStart) {
      setCarpoolEditError("L'heure de départ doit être avant le début de l'activité.");
      return;
    }
    setCarpoolEditLoading(true);
    try {
      await updateCarpool(localActivity.id, carpoolId, {
        departureTime: depTime,
        maxPassengers: maxP,
      });
      setCarpoolEditing(false);
      loadCarpools(localActivity.id);
    } catch (e) {
      setCarpoolEditError(e instanceof ApiRequestError ? e.message : "Impossible de modifier ce covoiturage.");
    } finally {
      setCarpoolEditLoading(false);
    }
  };

  const handleCancelCarpool = async (carpoolId: number) => {
    setCarpoolActionError(null);
    setCarpoolCancelLoading(true);
    try {
      await cancelCarpoolByDriver(localActivity.id, carpoolId);
      setCarpoolEditing(false);
      loadCarpools(localActivity.id);
    } catch (e) {
      setCarpoolActionError(e instanceof ApiRequestError ? e.message : "Impossible d'annuler ce covoiturage.");
    } finally {
      setCarpoolCancelLoading(false);
    }
  };

  /* ── Carpool section rendering ── */

  const renderCarpoolSection = () => {
    if (localActivity.locationType !== "OFF_SITE") return null;

    return (
      <div className="rounded-xl border border-violet-200 bg-gradient-to-br from-violet-50 to-purple-50 p-3.5 space-y-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-purple-600">
            <Car className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-xs font-semibold text-violet-700 uppercase tracking-wide">
            Covoiturage
          </span>
        </div>

        {carpoolLoading && (
          <div className="flex items-center justify-center py-4 gap-2 text-slate-400 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement…
          </div>
        )}

        {carpoolError && (
          <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{carpoolError}</p>
        )}

        {carpoolActionError && (
          <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2 border border-red-100" role="alert">
            {carpoolActionError}
          </p>
        )}

        {!carpoolLoading && !carpoolError && carpoolData && (
          <>
            {/* User is DRIVER */}
            {carpoolData.userRole === "DRIVER" && (
              <div className="rounded-lg bg-white/80 ring-1 ring-violet-200 px-3 py-2.5 space-y-2.5">
                <p className="text-xs font-semibold text-violet-700">Votre proposition</p>
                {carpoolData.carpools
                  .filter((c) => c.id === carpoolData.userCarpoolId)
                  .map((c) => (
                    <div key={c.id} className="space-y-2">
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-[10px] text-violet-500 font-semibold uppercase tracking-wide">Départ</p>
                          <p className="text-sm font-bold text-slate-800">{formatTime(c.departureTime)}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-violet-500 font-semibold uppercase tracking-wide">Passagers</p>
                          <p className="text-sm font-bold text-slate-800">{c.passengerCount} / {c.maxPassengers}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-violet-500 font-semibold uppercase tracking-wide">Dispo</p>
                          <p className="text-sm font-bold text-slate-800">{c.availableSeats}</p>
                        </div>
                      </div>
                      <PassengerList passengers={c.passengers} emptyLabel="Aucun passager pour l'instant." />

                      {!activityIsPast && !carpoolEditing && (
                        <div className="flex gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setCarpoolEditing(true);
                              setCarpoolEditError(null);
                              setCarpoolEditDeparture(c.departureTime.slice(0, 5));
                              setCarpoolEditMax(String(c.maxPassengers));
                            }}
                            disabled={carpoolCancelLoading || carpoolActionLoading}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-violet-300 bg-white py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-50 transition disabled:opacity-50"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            Modifier
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCancelCarpool(c.id)}
                            disabled={carpoolCancelLoading || carpoolActionLoading}
                            className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition disabled:opacity-50"
                          >
                            {carpoolCancelLoading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                            Annuler
                          </button>
                        </div>
                      )}

                      {!activityIsPast && carpoolEditing && (
                        <div className="rounded-xl border border-violet-200 bg-white/70 p-3 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <p className={labelClass}>Heure de départ *</p>
                              <ActivityTimeSelect
                                idPrefix="detail-carpool-edit-dep"
                                value={carpoolEditDeparture}
                                onChange={setCarpoolEditDeparture}
                                disabled={carpoolEditLoading}
                              />
                            </div>
                            <div>
                              <label htmlFor="detail-carpool-edit-seats" className={labelClass}>Places passagers *</label>
                              <input
                                id="detail-carpool-edit-seats"
                                type="number"
                                min={c.passengerCount || 1}
                                inputMode="numeric"
                                className={inputClass}
                                value={carpoolEditMax}
                                onChange={(e) => setCarpoolEditMax(e.target.value)}
                                disabled={carpoolEditLoading}
                              />
                            </div>
                          </div>
                          {c.passengerCount > 0 && (
                            <p className="text-[11px] text-slate-500">
                              Minimum {c.passengerCount} place{c.passengerCount > 1 ? "s" : ""} (passagers déjà inscrits).
                            </p>
                          )}
                          <p className="text-[11px] text-slate-500">
                            L&apos;heure de départ doit être avant le début de l&apos;activité ({formatTime(localActivity.startTime)}).
                          </p>
                          {carpoolEditError && (
                            <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2 border border-red-100" role="alert">
                              {carpoolEditError}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setCarpoolEditing(false);
                                setCarpoolEditError(null);
                                setCarpoolEditDeparture(c.departureTime.slice(0, 5));
                                setCarpoolEditMax(String(c.maxPassengers));
                              }}
                              disabled={carpoolEditLoading}
                              className="flex-1 rounded-lg border border-gray-200 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                            >
                              Retour
                            </button>
                            <button
                              type="button"
                              onClick={() => handleUpdateCarpool(c.id, c.passengerCount)}
                              disabled={carpoolEditLoading}
                              className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 py-2 text-xs font-semibold text-white shadow-sm hover:brightness-105 disabled:opacity-60"
                            >
                              {carpoolEditLoading ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Pencil className="h-3.5 w-3.5" />
                              )}
                              Enregistrer
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}

            {/* User is PASSENGER */}
            {carpoolData.userRole === "PASSENGER" && (
              <div className="space-y-2">
                {carpoolData.carpools
                  .filter((c) => c.id === carpoolData.userCarpoolId)
                  .map((c) => (
                    <div key={c.id} className="rounded-lg bg-white/80 ring-1 ring-violet-200 px-3 py-2.5 space-y-2.5">
                      <p className="text-xs font-semibold text-violet-700">Votre covoiturage</p>
                      <div className="grid grid-cols-2 gap-2 text-center">
                        <div>
                          <p className="text-[10px] text-violet-500 font-semibold uppercase tracking-wide">Conducteur</p>
                          <p className="text-sm font-bold text-slate-800 truncate">{c.driverName}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-violet-500 font-semibold uppercase tracking-wide">Départ</p>
                          <p className="text-sm font-bold text-slate-800">{formatTime(c.departureTime)}</p>
                        </div>
                      </div>
                      <PassengerList
                        passengers={c.passengers}
                        emptyLabel="Aucun autre passager pour l'instant."
                      />
                      {!activityIsPast && (
                        <button
                          type="button"
                          disabled={carpoolActionLoading}
                          onClick={() => handleLeaveCarpool(c.id)}
                          className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100 transition disabled:opacity-50"
                        >
                          {carpoolActionLoading ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <LogOut className="h-3.5 w-3.5" />
                          )}
                          Quitter ce covoiturage
                        </button>
                      )}
                    </div>
                  ))}
              </div>
            )}

            {/* User has NONE role */}
            {carpoolData.userRole === "NONE" && (
              <div className="space-y-2.5">
                {/* List available carpools */}
                {carpoolData.carpools.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
                      Propositions disponibles
                    </p>
                    {carpoolData.carpools.map((c) => (
                      <CarpoolCard
                        key={c.id}
                        carpool={c}
                        canJoin={isUserSubscribed && !activityIsPast && c.availableSeats > 0}
                        joining={carpoolActionLoading}
                        onJoin={() => handleJoinCarpool(c.id)}
                      />
                    ))}
                  </div>
                )}

                {carpoolData.carpools.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-2">
                    Aucune proposition de covoiturage pour l&apos;instant.
                  </p>
                )}

                {/* Create new carpool — only if subscribed and not past */}
                {isUserSubscribed && !activityIsPast && (
                  <div>
                    {!showCreateCarpool ? (
                      <button
                        type="button"
                        onClick={() => setShowCreateCarpool(true)}
                        className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-violet-300 py-2.5 text-sm font-semibold text-violet-600 hover:border-violet-400 hover:bg-violet-50/50 transition"
                      >
                        <Car className="h-4 w-4" />
                        Proposer un covoiturage
                      </button>
                    ) : (
                      <div className="rounded-xl border border-violet-200 bg-white/70 p-3 space-y-3">
                        <p className="text-xs font-semibold text-violet-700">Votre proposition</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className={labelClass}>Heure de départ *</p>
                            <ActivityTimeSelect
                              idPrefix="detail-carpool-new-dep"
                              value={cpDepartureTime}
                              onChange={setCpDepartureTime}
                              disabled={carpoolActionLoading}
                            />
                          </div>
                          <div>
                            <label htmlFor="detail-carpool-new-seats" className={labelClass}>Places passagers *</label>
                            <input
                              id="detail-carpool-new-seats"
                              type="number"
                              min={1}
                              inputMode="numeric"
                              className={inputClass}
                              placeholder="Ex : 3"
                              value={cpMaxPassengers}
                              onChange={(e) => setCpMaxPassengers(e.target.value)}
                              disabled={carpoolActionLoading}
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          L&apos;heure de départ doit être avant le début de l&apos;activité ({formatTime(localActivity.startTime)}).
                        </p>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => { setShowCreateCarpool(false); setCarpoolActionError(null); }}
                            disabled={carpoolActionLoading}
                            className="flex-1 rounded-lg border border-gray-200 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Annuler
                          </button>
                          <button
                            type="button"
                            onClick={handleCreateCarpool}
                            disabled={carpoolActionLoading}
                            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-purple-600 py-2 text-xs font-semibold text-white shadow-sm hover:brightness-105 disabled:opacity-60"
                          >
                            {carpoolActionLoading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5" />
                            )}
                            Proposer
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {!isUserSubscribed && carpoolData.carpools.length > 0 && (
                  <p className="text-xs text-slate-400 text-center">
                    Inscrivez-vous à l&apos;activité pour rejoindre ou proposer un covoiturage.
                  </p>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  /* ── Render ── */

  return (
    <>
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

        <div className="relative z-10 w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white shadow-2xl flex flex-col">
          <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-500 shrink-0 rounded-t-3xl sm:rounded-t-2xl" />

          {/* En-tête */}
          <div className="p-5 flex items-start justify-between gap-3 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-sm">
                {isOrganizer ? (
                  <Star className="h-5 w-5" />
                ) : (
                  <span className="text-xs font-bold">{toActivityInitials(localActivity.organizerName)}</span>
                )}
              </div>
              <div className="min-w-0">
                <h2
                  id="activity-detail-title"
                  className="font-bold text-slate-900 text-base leading-snug line-clamp-2"
                >
                  {localActivity.title}
                </h2>
                <div className="mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span className="inline-block rounded-full bg-purple-100 px-2 py-0.5 text-[11px] font-semibold text-purple-700">
                    {localActivity.activityType.name}
                  </span>
                  {localActivity.locationType === "ON_SITE" ? (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                      <Building2 className="h-2.5 w-2.5" />
                      Sur site
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                      <MapPin className="h-2.5 w-2.5" />
                      Hors site
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="shrink-0 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
              aria-label="Fermer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Corps */}
          <div className="p-5 space-y-4 flex-1">
            {isOrganizer ? (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 ring-1 ring-blue-200">
                <Star className="h-3.5 w-3.5" />
                Vous êtes l'organisateur
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-[11px] font-bold text-white">
                  {toActivityInitials(localActivity.organizerName)}
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
              <InfoRow
                icon={
                  localActivity.locationType === "ON_SITE"
                    ? <Building2 className="h-4 w-4 text-pink-500" />
                    : <MapPin className="h-4 w-4 text-pink-500" />
                }
              >
                {localActivity.locationType === "ON_SITE" ? (
                  <span>{localActivity.location.room}</span>
                ) : (
                  <div>
                    <p>{localActivity.location.street}</p>
                    {localActivity.location.complement && (
                      <p className="text-slate-400 text-xs">{localActivity.location.complement}</p>
                    )}
                    <p>{localActivity.location.postalCode} {localActivity.location.city}</p>
                  </div>
                )}
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
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Description</span>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{localActivity.description}</p>
              </div>
            )}

            {/* Carpool section */}
            {renderCarpoolSection()}

            {/* Participants */}
            <div>
              <div className="flex items-center gap-2 mb-2.5">
                <Users className="h-4 w-4 text-slate-400" />
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Participants</span>
                {!participantsLoading && (
                  <span className="ml-auto inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                    {participants.length}
                  </span>
                )}
              </div>

              {participantsLoading ? (
                <div className="flex items-center justify-center py-5 gap-2 text-slate-400 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Chargement…
                </div>
              ) : participantsError ? (
                <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{participantsError}</p>
              ) : participants.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-4 bg-slate-50 rounded-xl">
                  Aucun participant inscrit
                </p>
              ) : (
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 overflow-hidden">
                  {participants.map((p) => {
                    const initials = `${p.firstName[0]}${p.lastName[0]}`.toUpperCase();
                    return (
                      <li key={p.id} className="flex items-center gap-3 px-3.5 py-2.5 bg-white hover:bg-slate-50 transition-colors">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-[11px] font-bold text-white">
                          {initials}
                        </span>
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {p.firstName} {p.lastName}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-100 flex flex-col gap-3 shrink-0">
            {isOrganizer ? (
              !showOrganizerActions ? (
                <p className="text-center text-xs text-slate-500 leading-relaxed px-1 py-1">
                  Cette activité est terminée ou a déjà commencée : la modification et la suppression ne sont plus disponibles.
                </p>
              ) : deletePhase === "idle" ? (
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => { setDeleteError(null); setDeletePhase("confirm"); }}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl border-2 border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-100 hover:border-red-300 transition"
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </button>
                  <button
                    type="button"
                    onClick={() => onEdit?.(activity)}
                    className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-200 hover:brightness-105 transition"
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
                  {localActivity.participantCount > 0 && (
                    <p className="text-xs font-medium text-amber-800 bg-amber-50 rounded-lg px-3 py-2 border border-amber-200">
                      {localActivity.participantCount} participant{localActivity.participantCount > 1 ? "s" : ""} inscrit{localActivity.participantCount > 1 ? "s" : ""} — ils seront désinscrits automatiquement.
                    </p>
                  )}
                  {deleteError && (
                    <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
                      {deleteError}
                    </div>
                  )}
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setDeletePhase("idle"); setDeleteError(null); }}
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
                        <><Loader2 className="h-4 w-4 animate-spin" />Suppression…</>
                      ) : (
                        <><Trash2 className="h-4 w-4" />Confirmer la suppression</>
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
                  className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-700 shadow-sm transition hover:bg-red-100 hover:border-red-300 disabled:opacity-60"
                  onClick={handleUnsubscribe}
                >
                  {unsubscribeSubmitting ? (
                    <><Loader2 className="h-4 w-4 shrink-0 animate-spin" />Désinscription…</>
                  ) : (
                    <><UserMinus className="h-4 w-4 shrink-0" />Se désinscrire</>
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
                  className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white shadow-md transition ${
                    subscribeDone
                      ? "bg-emerald-600 shadow-emerald-200"
                      : localActivity.participantCount >= localActivity.capacity
                        ? "cursor-not-allowed bg-slate-300 text-slate-500 shadow-none"
                        : "bg-gradient-to-r from-blue-500 to-purple-600 shadow-purple-200 hover:brightness-105"
                  }`}
                >
                  {subscribeSubmitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" />Inscription…</>
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

      <PostSubscribeCarpoolModal
        open={postSubscribeOpen}
        activity={postSubscribeActivity}
        onComplete={handlePostSubscribeComplete}
      />
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

/* ── Sub-components ──────────────────────────────────────────────────────── */

function InfoRow({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 px-3.5 py-2.5">
      <span className="mt-0.5 shrink-0">{icon}</span>
      <span className="text-sm text-slate-700 leading-snug">{children}</span>
    </div>
  );
}

function PassengerList({
  passengers,
  emptyLabel,
}: {
  passengers: CarpoolPassengerSummary[];
  emptyLabel?: string;
}) {
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
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>

      {expanded && (
        <div className="mt-1.5">
          {passengers.length === 0 ? (
            <p className="px-2.5 py-2 text-xs text-slate-400 italic">{emptyLabel ?? "Aucun passager."}</p>
          ) : (
            <ul className="divide-y divide-violet-50 rounded-lg border border-violet-100 overflow-hidden">
              {passengers.map((p) => {
                const initials = p.fullName
                  .split(" ")
                  .filter(Boolean)
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);
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

function CarpoolCard({
  carpool,
  canJoin,
  joining,
  onJoin,
}: {
  carpool: CarpoolDetail;
  canJoin: boolean;
  joining: boolean;
  onJoin: () => void;
}) {
  return (
    <div className="rounded-lg bg-white/80 ring-1 ring-violet-100 px-3 py-2.5 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-slate-800 truncate">{carpool.driverName}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            Départ {formatTime(carpool.departureTime)} &nbsp;·&nbsp;{" "}
            <span className={carpool.availableSeats === 0 ? "text-red-500 font-medium" : "text-emerald-600 font-medium"}>
              {carpool.availableSeats === 0 ? "Complet" : `${carpool.availableSeats} place${carpool.availableSeats > 1 ? "s" : ""} dispo`}
            </span>
          </p>
        </div>
        <button
          type="button"
          disabled={!canJoin || joining}
          onClick={onJoin}
          className={`shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            !canJoin
              ? "bg-slate-100 text-slate-400 cursor-not-allowed"
              : "bg-violet-500 text-white hover:bg-violet-600 shadow-sm"
          } disabled:opacity-60`}
        >
          {joining ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Car className="h-3.5 w-3.5" />}
          Rejoindre
        </button>
      </div>
      <PassengerList passengers={carpool.passengers} emptyLabel="Aucun passager pour l'instant." />
    </div>
  );
}
