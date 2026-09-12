import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Building2,
  Calendar,
  CalendarDays,
  Car,
  Compass,
  Loader2,
  MapPin,
  Star,
  Users,
  Flame,
} from "lucide-react";
import { getMe } from "../services/userService";
import {
  getMyActivities,
  getAvailableActivities,
  getRegisteredActivities,
  subscribeToActivity,
} from "../services/activityService";
import { ApiRequestError } from "../services/api";
import { HomeWelcomeSection } from "../components/home/HomeWelcomeSection";
import { ActivityDetailModal } from "../components/home/ActivityDetailModal";
import { PostSubscribeCarpoolModal } from "../components/home/PostSubscribeCarpoolModal";
import { EditActivityModal } from "../components/EditActivityModal";
import { MessageModal } from "../components/ui/MessageModal";
import type { ActivityResponse } from "../types/activity";
import { getTypeConfig } from "../utils/activityDisplay";
import { shouldOfferCarpoolAfterSubscribe, SUBSCRIBE_SUCCESS_MESSAGE } from "../utils/subscribeMessages";

/* ── Utilitaires ────────────────────────────────────────────────────────────── */

function formatTime(t: string): string {
  return t.slice(0, 5);
}

function formatDateShort(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function getInitials(name: string): string {
  return name.split(" ").filter(Boolean).map((n) => n[0]).join("").toUpperCase().slice(0, 2);
}

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Prochaines activités à venir (jour courant ou futur), triées par date / heure */
function getNextActivities(activities: ActivityResponse[], limit: number): ActivityResponse[] {
  const now = new Date();
  const upcoming = activities
    .filter((a) => {
      const d = parseDate(a.date);
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      return d >= today;
    })
    .sort((a, b) => {
      const da = parseDate(a.date).getTime();
      const db = parseDate(b.date).getTime();
      if (da !== db) return da - db;
      return a.startTime.localeCompare(b.startTime);
    });
  return upcoming.slice(0, limit);
}

/** La dernière activité créée par l'utilisateur */
function getLastCreatedActivity(activities: ActivityResponse[]): ActivityResponse | null {
  if (activities.length === 0) return null;
  return [...activities].sort((a, b) => b.id - a.id)[0];
}

/* ── Squelettes ─────────────────────────────────────────────────────────────── */

function SkeletonHero() {
  return (
    <div className="w-full animate-pulse overflow-hidden rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 h-44" />
  );
}

function SkeletonAvailable() {
  return (
    <div className="animate-pulse overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-100">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex gap-2">
          <div className="h-5 rounded-full bg-slate-200 w-20" />
          <div className="h-5 rounded-full bg-slate-200 w-14" />
        </div>
        <div className="h-5 rounded bg-slate-200 w-full" />
        <div className="h-4 rounded bg-slate-200 w-4/5" />
        <div className="space-y-2 pt-1">
          <div className="h-3.5 rounded bg-slate-200 w-full" />
          <div className="h-3.5 rounded bg-slate-200 w-5/6" />
        </div>
        <div className="h-10 rounded-xl bg-slate-200 mt-1" />
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────────── */

export function HomePage() {
  const [firstName, setFirstName] = useState<string>("…");
  const [organizedActivities, setOrganizedActivities] = useState<ActivityResponse[]>([]);
  const [registeredActivities, setRegisteredActivities] = useState<ActivityResponse[]>([]);
  const [availableActivities, setAvailableActivities] = useState<ActivityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<ActivityResponse | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailMode, setDetailMode] = useState<"organizer" | "available">("available");

  const [editActivity, setEditActivity] = useState<ActivityResponse | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  /** Inscription directe depuis les cartes « Disponibles » */
  const [subscribingId, setSubscribingId] = useState<number | null>(null);
  const [subscribeErrorMessage, setSubscribeErrorMessage] = useState<string | null>(null);
  const [subscribeSuccessMessage, setSubscribeSuccessMessage] = useState<string | null>(null);
  const [unsubscribeErrorMessage, setUnsubscribeErrorMessage] = useState<string | null>(null);
  const [unsubscribeSuccessMessage, setUnsubscribeSuccessMessage] = useState<string | null>(null);
  const [postSubscribeOpen, setPostSubscribeOpen] = useState(false);
  const [postSubscribeActivity, setPostSubscribeActivity] = useState<ActivityResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [me, organized, registered, available] = await Promise.all([
          getMe(),
          getMyActivities(),
          getRegisteredActivities(),
          getAvailableActivities(),
        ]);
        if (!cancelled) {
          setFirstName(me.firstName?.trim() || "toi");
          setOrganizedActivities(organized);
          setRegisteredActivities(registered);
          setAvailableActivities(available);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setFirstName("toi");
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      const newActivity = (e as CustomEvent<ActivityResponse>).detail;
      setOrganizedActivities((prev) =>
        [newActivity, ...prev].sort((a, b) => {
          const da = parseDate(a.date).getTime();
          const db = parseDate(b.date).getTime();
          if (da !== db) return da - db;
          return a.startTime.localeCompare(b.startTime);
        })
      );
    };
    window.addEventListener("colife:activity-created", handler);
    return () => window.removeEventListener("colife:activity-created", handler);
  }, []);

  const openDetail = (a: ActivityResponse, mode: "organizer" | "available" = "available") => {
    setDetail(a);
    setDetailMode(mode);
    setDetailOpen(true);
  };

  const handleEdit = (a: ActivityResponse) => {
    setDetailOpen(false);
    setEditActivity(a);
    setEditOpen(true);
  };

  const handleEditSuccess = (updated: ActivityResponse) => {
    setOrganizedActivities((prev) =>
      prev.map((a) => (a.id === updated.id ? updated : a))
    );
  };

  const handleDeleted = useCallback((id: number) => {
    setOrganizedActivities((prev) => prev.filter((a) => a.id !== id));
    setDetail(null);
    setDetailOpen(false);
    setEditActivity((e) => (e?.id === id ? null : e));
  }, []);

  const handleUnsubscribed = useCallback((updated: ActivityResponse) => {
    setSubscribeErrorMessage(null);
    setSubscribeSuccessMessage(null);
    setUnsubscribeErrorMessage(null);
    setUnsubscribeSuccessMessage(
      "Votre désinscription a bien été enregistrée. L'activité réapparaîtra parmi les disponibles si des places sont libres."
    );
    setRegisteredActivities((prev) => prev.filter((a) => a.id !== updated.id));
    setDetail((prev) => (prev?.id === updated.id ? null : prev));
    setDetailOpen(false);
  }, []);

  const applySubscribedState = useCallback((updated: ActivityResponse) => {
    setAvailableActivities((prev) => prev.filter((a) => a.id !== updated.id));
    setDetail((prev) => (prev?.id === updated.id ? null : prev));
    setDetailOpen(false);
    setRegisteredActivities((prev) => {
      if (prev.some((a) => a.id === updated.id)) {
        return prev.map((a) => (a.id === updated.id ? updated : a));
      }
      return [...prev, updated].sort((a, b) => {
        const da = parseDate(a.date).getTime();
        const db = parseDate(b.date).getTime();
        if (da !== db) return da - db;
        return a.startTime.localeCompare(b.startTime);
      });
    });
  }, []);

  const finishSubscribeFlow = useCallback((updated: ActivityResponse) => {
    setUnsubscribeErrorMessage(null);
    setUnsubscribeSuccessMessage(null);
    setSubscribeErrorMessage(null);
    applySubscribedState(updated);
    if (shouldOfferCarpoolAfterSubscribe(updated)) {
      setPostSubscribeActivity(updated);
      setPostSubscribeOpen(true);
    } else {
      setSubscribeSuccessMessage(SUBSCRIBE_SUCCESS_MESSAGE);
    }
  }, [applySubscribedState]);

  const handleSubscribed = useCallback((updated: ActivityResponse) => {
    setUnsubscribeErrorMessage(null);
    setUnsubscribeSuccessMessage(null);
    setSubscribeErrorMessage(null);
    applySubscribedState(updated);
    setSubscribeSuccessMessage(SUBSCRIBE_SUCCESS_MESSAGE);
  }, [applySubscribedState]);

  const handlePostSubscribeComplete = useCallback(() => {
    setPostSubscribeOpen(false);
    setPostSubscribeActivity(null);
    setSubscribeSuccessMessage(SUBSCRIBE_SUCCESS_MESSAGE);
  }, []);

  const handleSubscribeFromCard = async (activity: ActivityResponse) => {
    setSubscribeErrorMessage(null);
    setUnsubscribeErrorMessage(null);
    setUnsubscribeSuccessMessage(null);
    setSubscribingId(activity.id);
    try {
      const updated = await subscribeToActivity(activity.id);
      finishSubscribeFlow(updated);
    } catch (e) {
      const message =
        e instanceof ApiRequestError
          ? e.message
          : "Impossible de s'inscrire. Réessayez.";
      setSubscribeErrorMessage(message);
    } finally {
      setSubscribingId(null);
    }
  };

  useEffect(() => {
    if (editActivity === null && editOpen) {
      setEditOpen(false);
    }
  }, [editActivity, editOpen]);

  const nextActivity = getLastCreatedActivity(organizedActivities);
  const upcomingRegistered = getNextActivities(registeredActivities, 2);
  const openAvailableActivities = useMemo(
    () => availableActivities.filter((a) => a.participantCount < a.capacity),
    [availableActivities]
  );


  return (
    <>
      <div className="space-y-6 pb-4">
        <HomeWelcomeSection
          firstName={firstName}
          organizedCount={organizedActivities.length}
          registeredCount={registeredActivities.length}
          availableCount={openAvailableActivities.length}
        />

<div className="space-y-8 sm:space-y-10">

          {/* ── Mes événements — 1 seule carte (la plus proche) ── */}
          <section>
            <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
                    <Star className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <h2 className="text-lg sm:text-2xl font-bold text-slate-900">Mes événements</h2>
                </div>
                <p className="ml-11 sm:ml-12 text-xs sm:text-sm text-slate-500">Votre dernière activité créée</p>
              </div>
              <Link to="/planning" aria-label="Voir tous mes événements" className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1.5 text-xs sm:text-sm font-semibold text-blue-600 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                <span className="hidden sm:inline" aria-hidden>Voir tout</span>
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>

            {loading ? (
              <SkeletonHero />
            ) : !nextActivity ? (
              <div className="rounded-2xl bg-white p-8 text-center shadow-md ring-1 ring-slate-100">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100">
                  <CalendarDays className="h-7 w-7 text-blue-500" />
                </div>
                <p className="font-semibold text-slate-700">Aucune activité à venir</p>
                <p className="mt-1 text-xs text-slate-500">Créez une activité via le bouton + en haut de l'écran.</p>
              </div>
            ) : (() => {
              const { badge } = getTypeConfig(nextActivity.activityType.name);
              const fill = Math.min(100, Math.round((nextActivity.participantCount / nextActivity.capacity) * 100));
              const isFull = nextActivity.participantCount >= nextActivity.capacity;
              return (
                <button
                  type="button"
                  onClick={() => openDetail(nextActivity, "organizer")}
                  className="w-full text-left overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-100 transition hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2"
                >
                  <div className="h-1.5 bg-gradient-to-r from-blue-500 via-purple-600 to-pink-600" aria-hidden />
                  <div className="p-4 sm:p-5">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-100">
                        <Star className="h-3 w-3 fill-blue-500 text-blue-500" aria-hidden />
                        Organisateur
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge}`}>
                        {nextActivity.activityType.name}
                      </span>
                      {nextActivity.locationType === "ON_SITE" ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100">
                          <Building2 className="h-3 w-3" aria-hidden />
                          Sur site
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-0.5 text-xs font-semibold text-sky-700 ring-1 ring-sky-100">
                          <MapPin className="h-3 w-3" aria-hidden />
                          Hors site
                        </span>
                      )}
                      {nextActivity.carpool && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2.5 py-0.5 text-xs font-semibold text-violet-700 ring-1 ring-violet-100">
                          <Car className="h-3 w-3" aria-hidden />
                          Covoiturage
                        </span>
                      )}
                    </div>

                    <h3 className="mb-3 text-lg sm:text-xl font-bold leading-tight text-slate-900">
                      {nextActivity.title}
                    </h3>

                    <div className="mb-4 space-y-1.5 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 shrink-0 text-purple-500" aria-hidden />
                        <span>{formatDateShort(nextActivity.date)} · {formatTime(nextActivity.startTime)} – {formatTime(nextActivity.endTime)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {nextActivity.locationType === "ON_SITE"
                          ? <Building2 className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden />
                          : <MapPin className="h-4 w-4 shrink-0 text-purple-500" aria-hidden />}
                        <span className="line-clamp-1">
                          {nextActivity.locationType === "ON_SITE"
                            ? (nextActivity.location.room ?? "Sur site")
                            : [nextActivity.location.city, nextActivity.location.street].filter(Boolean).join(", ") || "—"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                          <Users className="h-4 w-4" aria-hidden />
                          {nextActivity.participantCount}/{nextActivity.capacity} participants
                        </span>
                        {isFull && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700">Complet</span>
                        )}
                      </div>
                      <div
                        role="progressbar"
                        aria-valuenow={fill}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`${nextActivity.participantCount} sur ${nextActivity.capacity} participants`}
                        className="h-2 overflow-hidden rounded-full bg-slate-100"
                      >
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isFull ? "bg-red-400" : "bg-gradient-to-r from-blue-500 to-purple-600"}`}
                          style={{ width: `${fill}%` }}
                          aria-hidden
                        />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })()}
          </section>

          {/* ── À venir (inscriptions — toujours visible) ── */}
          <section>
            <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-sm">
                    <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <h2 className="text-lg sm:text-2xl font-bold text-slate-900">À venir</h2>
                </div>
                <p className="ml-11 sm:ml-12 text-xs sm:text-sm text-slate-500">Vos prochaines inscriptions</p>
              </div>
              <Link to="/planning" aria-label="Voir toutes mes inscriptions à venir" className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1.5 text-xs sm:text-sm font-semibold text-purple-600 hover:bg-purple-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500">
                <span className="hidden sm:inline" aria-hidden>Voir tout</span>
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 sm:gap-4">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="h-40 animate-pulse rounded-2xl bg-white shadow-md ring-1 ring-slate-100"
                  />
                ))}
              </div>
            ) : upcomingRegistered.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center shadow-md ring-1 ring-slate-100">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100">
                  <Flame className="h-7 w-7 text-purple-500" />
                </div>
                <p className="font-semibold text-slate-700">Aucune inscription pour l&apos;instant</p>
                <p className="mt-1 text-xs text-slate-500">
                  Explorez les activités disponibles et inscrivez-vous.
                </p>
                <Link
                  to="/explore"
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:brightness-105 transition"
                >
                  <Compass className="h-4 w-4" />
                  Explorer les activités
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 sm:gap-4">
                {upcomingRegistered.map((activity) => {
                  const { badge } = getTypeConfig(activity.activityType.name);
                  const fill = Math.min(
                    100,
                    Math.round((activity.participantCount / activity.capacity) * 100)
                  );
                  const isFull = activity.participantCount >= activity.capacity;
                  return (
                    <button
                      key={activity.id}
                      type="button"
                      onClick={() => openDetail(activity, "available")}
                      className="flex flex-col overflow-hidden rounded-2xl bg-white text-left shadow-md ring-1 ring-slate-100 transition hover:shadow-lg hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
                    >
                      <div className="h-1 bg-gradient-to-r from-purple-500 to-pink-600" aria-hidden />
                      <div className="flex flex-col flex-1 p-4 gap-3">
                        <div className="mb-1 flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 text-[11px] font-semibold text-purple-700 ring-1 ring-purple-100">
                            <Flame className="h-3 w-3" />
                            Inscrit
                          </span>
                          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge}`}>
                            {activity.activityType.name}
                          </span>
                          {activity.locationType === "ON_SITE" ? (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                              <Building2 className="h-2.5 w-2.5" />
                              Sur site
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 ring-1 ring-blue-100">
                              <MapPin className="h-2.5 w-2.5" />
                              Hors site
                            </span>
                          )}
                          {activity.carpool && (
                            <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700 ring-1 ring-violet-100">
                              <Car className="h-2.5 w-2.5" />
                              Covoiturage
                            </span>
                          )}
                        </div>
                        <h3 className="line-clamp-2 text-base font-bold text-slate-900 leading-snug">
                          {activity.title}
                        </h3>
                        <div className="space-y-1.5 text-xs text-slate-600">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 shrink-0 text-purple-400" />
                            <span>
                              {formatDateShort(activity.date)} · {formatTime(activity.startTime)} –{" "}
                              {formatTime(activity.endTime)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {activity.locationType === "ON_SITE"
                              ? <Building2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                              : <MapPin className="h-3.5 w-3.5 shrink-0 text-purple-400" />}
                            <span className="line-clamp-1">
                              {activity.locationType === "ON_SITE"
                                ? (activity.location.room ?? "Sur site")
                                : (activity.location.city ?? "—")}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 pt-0.5">
                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-[10px] font-bold text-white">
                              {getInitials(activity.organizerName)}
                            </span>
                            <span className="line-clamp-1 font-medium text-slate-700">
                              {activity.organizerName}
                            </span>
                          </div>
                        </div>
                        <div className="mt-auto space-y-1.5 pt-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-700">
                              {activity.participantCount}/{activity.capacity} participants
                            </span>
                            {isFull && (
                              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                                Complet
                              </span>
                            )}
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${isFull ? "bg-red-400" : "bg-gradient-to-r from-purple-500 to-pink-500"}`}
                              style={{ width: `${fill}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── Disponibles ── */}
          <section>
            <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-sm">
                    <Compass className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <h2 className="text-lg sm:text-2xl font-bold text-slate-900">Disponibles</h2>
                </div>
                <p className="ml-11 sm:ml-12 text-xs sm:text-sm text-slate-500">
                  Activités organisées par vos collègues
                </p>
              </div>
              <Link to="/explore" aria-label="Voir toutes les activités disponibles" className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1.5 text-xs sm:text-sm font-semibold text-orange-600 hover:bg-orange-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500">
                <span className="hidden sm:inline" aria-hidden>Voir tout</span>
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 sm:gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonAvailable key={i} />
                ))}
              </div>
            ) : openAvailableActivities.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center shadow-md ring-1 ring-slate-100">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-red-100">
                  <Compass className="h-7 w-7 text-orange-500" />
                </div>
                <p className="font-semibold text-slate-700">Aucune activité disponible</p>
                <p className="mt-1 text-xs text-slate-500">Vos collègues n'ont pas encore publié d'activités.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 min-[420px]:grid-cols-2 gap-3 sm:gap-4">
                {openAvailableActivities.slice(0, 4).map((activity) => {
                  const { badge } = getTypeConfig(activity.activityType.name);
                  const fill = Math.min(100, Math.round((activity.participantCount / activity.capacity) * 100));
                  const isHot = fill >= 80;

                  return (
                    <div key={activity.id} className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-100 transition hover:shadow-lg hover:-translate-y-0.5">
                      <div className="flex flex-col flex-1 p-4 gap-3">
                        <button
                          type="button"
                          onClick={() => openDetail(activity, "available")}
                          className="text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 rounded-lg"
                        >
                          {/* Badge type + Hot + lieu + covoiturage */}
                          <div className="mb-2 flex flex-wrap items-center gap-1.5">
                            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge}`}>
                              {activity.activityType.name}
                            </span>
                            {isHot && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-500 px-2 py-0.5 text-xs font-bold text-white">
                                <Flame className="h-3 w-3" />
                                Hot
                              </span>
                            )}
                            {activity.locationType === "ON_SITE" ? (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                                <Building2 className="h-2.5 w-2.5" />
                                Sur site
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 ring-1 ring-blue-100">
                                <MapPin className="h-2.5 w-2.5" />
                                Hors site
                              </span>
                            )}
                            {activity.carpool && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700 ring-1 ring-violet-100">
                                <Car className="h-2.5 w-2.5" />
                                Covoiturage
                              </span>
                            )}
                          </div>

                          {/* Titre */}
                          <h3 className="line-clamp-2 text-base font-bold text-slate-900 leading-snug mb-2">
                            {activity.title}
                          </h3>

                          {/* Infos */}
                          <div className="space-y-1.5 text-xs text-slate-600">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-3.5 w-3.5 shrink-0 text-purple-400" />
                              <span className="line-clamp-1">{formatDateShort(activity.date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {activity.locationType === "ON_SITE"
                                ? <Building2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                : <MapPin className="h-3.5 w-3.5 shrink-0 text-purple-400" />}
                              <span className="line-clamp-1">
                                {activity.locationType === "ON_SITE"
                                  ? (activity.location.room ?? "Sur site")
                                  : (activity.location.city ?? "—")}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2 pt-0.5">
                              <div className="flex items-center gap-2 min-w-0">
                                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-[10px] font-bold text-white">
                                  {getInitials(activity.organizerName)}
                                </span>
                                <span className="line-clamp-1 font-medium text-slate-700">{activity.organizerName}</span>
                              </div>
                              <span className={`shrink-0 text-sm font-semibold tabular-nums ${isHot ? "text-orange-600" : "text-slate-700"}`}>
                                {activity.participantCount}/{activity.capacity}
                              </span>
                            </div>
                          </div>
                        </button>

                        <button
                          type="button"
                          disabled={subscribingId === activity.id}
                          onClick={() => handleSubscribeFromCard(activity)}
                          className="mt-auto flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:brightness-105 disabled:opacity-60"
                        >
                          {subscribingId === activity.id ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Inscription…
                            </>
                          ) : (
                            "S'inscrire"
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>

      <ActivityDetailModal
        activity={detail}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        mode={detailMode}
        onEdit={handleEdit}
        onDeleted={handleDeleted}
        onSubscribed={handleSubscribed}
        onUnsubscribed={handleUnsubscribed}
        onUnsubscribeError={setUnsubscribeErrorMessage}
        isSubscribed={
          detailMode === "available" &&
          !!detail &&
          registeredActivities.some((a) => a.id === detail.id)
        }
      />

      <EditActivityModal
        activity={editActivity}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={handleEditSuccess}
      />

      <PostSubscribeCarpoolModal
        open={postSubscribeOpen}
        activity={postSubscribeActivity}
        onComplete={handlePostSubscribeComplete}
      />

      <MessageModal
        open={!!subscribeSuccessMessage}
        title="Inscription réussie"
        message={subscribeSuccessMessage ?? ""}
        variant="success"
        confirmLabel="OK"
        onClose={() => setSubscribeSuccessMessage(null)}
      />
      <MessageModal
        open={!!subscribeErrorMessage}
        title="Inscription impossible"
        message={subscribeErrorMessage ?? ""}
        onClose={() => setSubscribeErrorMessage(null)}
      />
      <MessageModal
        open={!!unsubscribeSuccessMessage}
        title="Désinscription réussie"
        message={unsubscribeSuccessMessage ?? ""}
        variant="success"
        confirmLabel="OK"
        onClose={() => setUnsubscribeSuccessMessage(null)}
      />
      <MessageModal
        open={!!unsubscribeErrorMessage}
        title="Désinscription impossible"
        message={unsubscribeErrorMessage ?? ""}
        onClose={() => setUnsubscribeErrorMessage(null)}
      />
    </>
  );
}
