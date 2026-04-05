import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  CalendarDays,
  Compass,
  MapPin,
  Star,
  Users,
  Trophy,
  Heart,
  Flame,
} from "lucide-react";
import { getMe } from "../services/userService";
import { getMyActivities, getAvailableActivities } from "../services/activityService";
import { HomeWelcomeSection } from "../components/home/HomeWelcomeSection";
import { ActivityDetailModal } from "../components/home/ActivityDetailModal";
import { EditActivityModal } from "../components/EditActivityModal";
import { PAGE_CONTAINER_CLASS } from "../layout/page";
import type { ActivityResponse } from "../types/activity";
import { getTypeConfig } from "../utils/activityDisplay";

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

/** Retourne la prochaine activité (la plus proche dans le futur) */
function getNextActivity(activities: ActivityResponse[]): ActivityResponse | null {
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
  return upcoming[0] ?? null;
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
      <div className="flex gap-2.5 p-3">
        <div className="h-20 w-20 shrink-0 rounded-xl bg-slate-200" />
        <div className="flex-1 space-y-2 pt-1">
          <div className="h-4 rounded bg-slate-200 w-3/4" />
          <div className="h-3 rounded bg-slate-200 w-1/2" />
          <div className="h-3 rounded bg-slate-200 w-2/3" />
          <div className="h-7 rounded-full bg-slate-200 mt-2" />
        </div>
      </div>
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────────────────────── */

export function HomePage() {
  const [firstName, setFirstName] = useState<string>("…");
  const [organizedActivities, setOrganizedActivities] = useState<ActivityResponse[]>([]);
  const [availableActivities, setAvailableActivities] = useState<ActivityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<ActivityResponse | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailMode, setDetailMode] = useState<"organizer" | "available">("available");

  const [editActivity, setEditActivity] = useState<ActivityResponse | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [me, organized, available] = await Promise.all([
          getMe(),
          getMyActivities(),
          getAvailableActivities(),
        ]);
        if (!cancelled) {
          setFirstName(me.firstName?.trim() || "toi");
          setOrganizedActivities(organized);
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

  const nextActivity = getNextActivity(organizedActivities);

  const categories = [
    { name: "Sport", icon: Trophy, color: "from-blue-500 to-cyan-500" },
    { name: "Bien-être", icon: Heart, color: "from-pink-500 to-rose-500" },
    { name: "Social", icon: Users, color: "from-purple-500 to-indigo-500" },
    { name: "Explorer", icon: Compass, color: "from-orange-500 to-red-500" },
  ];

  return (
    <div className="relative min-h-full pb-6 overflow-x-hidden">
      {/* Fond décoratif */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute top-16 left-4 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl animate-pulse" />
        <div className="absolute bottom-32 right-4 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-400/10 blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
      </div>

      <div className="relative z-10">
        <HomeWelcomeSection
          firstName={firstName}
          organizedCount={organizedActivities.length}
          registeredCount={0}
          availableCount={availableActivities.length}
        />

        {/* Catégories */}
        <div className="max-w-4xl mx-auto px-4 mt-6 mb-6 sm:mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {categories.map((c) => {
              const Icon = c.icon;
              return (
                <button key={c.name} type="button" className="rounded-2xl bg-white p-3 sm:p-4 text-left shadow-md shadow-slate-200/40 ring-1 ring-slate-100 transition hover:shadow-lg hover:ring-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500">
                  <div className={`mb-2 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br ${c.color} text-white shadow-sm`}>
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-1">{c.name}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className={`${PAGE_CONTAINER_CLASS} space-y-8 sm:space-y-10 pb-4`}>

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
                <p className="ml-11 sm:ml-12 text-xs sm:text-sm text-slate-500">Votre prochaine activité organisée</p>
              </div>
              <Link to="/planning" className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1.5 text-xs sm:text-sm font-semibold text-blue-600 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
                <span className="hidden sm:inline">Voir tout</span>
                <ArrowRight className="h-4 w-4" />
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
                  className={`w-full text-left overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-purple-600 to-pink-600 text-white shadow-xl transition hover:brightness-[1.03] hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50`}
                >
                  <div className="p-4 sm:p-5">
                    {/* Badges */}
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-sm px-2.5 py-0.5 text-xs font-semibold text-white">
                        <Star className="h-3 w-3 fill-white" />
                        Organisateur
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge}`}>
                        {nextActivity.activityType.name}
                      </span>
                    </div>

                    {/* Titre */}
                    <h3 className="mb-3 text-lg sm:text-xl font-bold leading-tight">
                      {nextActivity.title}
                    </h3>

                    {/* Infos */}
                    <div className="mb-4 space-y-1.5 text-sm text-white/90">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 shrink-0" />
                        <span>{formatDateShort(nextActivity.date)} · {formatTime(nextActivity.startTime)} – {formatTime(nextActivity.endTime)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span className="line-clamp-1">
                          {nextActivity.location.city}
                          {nextActivity.location.street ? `, ${nextActivity.location.street}` : ""}
                        </span>
                      </div>
                    </div>

                    {/* Barre de progression participants */}
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-1.5 font-semibold">
                          <Users className="h-4 w-4" />
                          {nextActivity.participantCount}/{nextActivity.capacity} participants
                        </span>
                        {isFull && (
                          <span className="rounded-full bg-red-500/90 px-2 py-0.5 text-xs font-bold">Complet</span>
                        )}
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-white/25">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${isFull ? "bg-red-400" : "bg-white"}`}
                          style={{ width: `${fill}%` }}
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
              <Link to="/planning" className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1.5 text-xs sm:text-sm font-semibold text-purple-600 hover:bg-purple-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500">
                <span className="hidden sm:inline">Voir tout</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="rounded-2xl bg-white p-8 text-center shadow-md ring-1 ring-slate-100">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100">
                <Flame className="h-7 w-7 text-purple-500" />
              </div>
              <p className="font-semibold text-slate-700">Aucune inscription pour l'instant</p>
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
              <Link to="/explore" className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1.5 text-xs sm:text-sm font-semibold text-orange-600 hover:bg-orange-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500">
                <span className="hidden sm:inline">Voir tout</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-2 gap-2.5">
                {Array.from({ length: 4 }).map((_, i) => (
                  <SkeletonAvailable key={i} />
                ))}
              </div>
            ) : availableActivities.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center shadow-md ring-1 ring-slate-100">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-100 to-red-100">
                  <Compass className="h-7 w-7 text-orange-500" />
                </div>
                <p className="font-semibold text-slate-700">Aucune activité disponible</p>
                <p className="mt-1 text-xs text-slate-500">Vos collègues n'ont pas encore publié d'activités.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {availableActivities.slice(0, 4).map((activity) => {
                  const { badge } = getTypeConfig(activity.activityType.name);
                  const fill = Math.min(100, Math.round((activity.participantCount / activity.capacity) * 100));
                  const isFull = activity.participantCount >= activity.capacity;
                  const isHot = fill >= 80 && !isFull;

                  return (
                    <div key={activity.id} className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-md ring-1 ring-slate-100 transition hover:shadow-lg hover:-translate-y-0.5">
                      <div className="flex flex-col flex-1 p-3 gap-2">
                        <button
                          type="button"
                          onClick={() => openDetail(activity)}
                          className="text-left focus:outline-none"
                        >
                          {/* Badge type + Hot */}
                          <div className="mb-2 flex flex-wrap items-center gap-1">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${badge}`}>
                              {activity.activityType.name}
                            </span>
                            {isHot && (
                              <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
                                <Flame className="h-2.5 w-2.5" />
                                Hot
                              </span>
                            )}
                          </div>

                          {/* Titre */}
                          <h3 className="line-clamp-2 text-xs font-bold text-slate-900 leading-snug mb-2">
                            {activity.title}
                          </h3>

                          {/* Infos */}
                          <div className="space-y-1 text-[10px] text-slate-500">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 shrink-0" />
                              <span className="line-clamp-1">{formatDateShort(activity.date)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span className="line-clamp-1">{activity.location.city}</span>
                            </div>
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-1 min-w-0">
                                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-[8px] font-bold text-white">
                                  {getInitials(activity.organizerName)}
                                </span>
                                <span className="line-clamp-1">{activity.organizerName}</span>
                              </div>
                              <span className={`shrink-0 font-semibold ${isFull ? "text-red-600" : isHot ? "text-orange-600" : "text-slate-600"}`}>
                                {activity.participantCount}/{activity.capacity}
                              </span>
                            </div>
                          </div>
                        </button>

                        {/* Bouton S'inscrire — visuel uniquement */}
                        <button
                          type="button"
                          disabled={isFull}
                          className={`mt-auto w-full rounded-xl py-1.5 text-[10px] font-semibold text-white transition focus:outline-none ${
                            isFull
                              ? "cursor-not-allowed bg-slate-300 text-slate-500"
                              : "bg-gradient-to-r from-blue-500 to-purple-600 hover:brightness-105"
                          }`}
                        >
                          {isFull ? "Complet" : "S'inscrire"}
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
      />

      <EditActivityModal
        activity={editActivity}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={handleEditSuccess}
      />
    </div>
  );
}
