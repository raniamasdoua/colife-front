import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  Clock,
  Flame,
  MapPin,
  Star,
  TrendingUp,
  Trophy,
  Heart,
  Users,
  Zap,
} from "lucide-react";
import { getMe } from "../services/userService";
import { getMyActivities } from "../services/activityService";
import { HomeWelcomeSection } from "../components/home/HomeWelcomeSection";
import { ActivityDetailModal } from "../components/home/ActivityDetailModal";
import {
  getTypeBadgeClasses,
  myOrganizedActivities,
  myRegisteredActivities,
  trendingActivities,
  type ActivityItem,
} from "../components/home/homeData";
import { PAGE_CONTAINER_CLASS } from "../layout/page";

export function HomePage() {
  const [firstName, setFirstName] = useState<string>("…");
  const [organizedCount, setOrganizedCount] = useState<number>(0);
  const [detail, setDetail] = useState<ActivityItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, setPending] = useState<ActivityItem | null>(null);
  const [registeredIds, setRegisteredIds] = useState<number[]>([]);
  const [participantsMap, setParticipantsMap] = useState<
    Record<number, { current: number; max: number }>
  >({});
  const [flash, setFlash] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [me, activities] = await Promise.all([getMe(), getMyActivities()]);
        if (!cancelled) {
          setFirstName(me.firstName?.trim() || "toi");
          setOrganizedCount(activities.length);
        }
      } catch {
        if (!cancelled) setFirstName("toi");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const showFlash = useCallback((msg: string) => {
    setFlash(msg);
    window.setTimeout(() => setFlash(null), 3200);
  }, []);

  const openDetail = (a: ActivityItem) => {
    setDetail(a);
    setDetailOpen(true);
  };

  const getParticipants = (a: ActivityItem) =>
    participantsMap[a.id] ?? a.participants;

  const openRegister = (a: ActivityItem) => {
    const p = getParticipants(a);
    if (p.current >= p.max) {
      showFlash("Cette activité est complète.");
      return;
    }
    setPending(a);
    setConfirmOpen(true);
  };

  const confirmRegister = () => {
    if (!pending) return;
    const p = getParticipants(pending);
    setRegisteredIds((ids) => [...new Set([...ids, pending.id])]);
    setParticipantsMap((m) => ({
      ...m,
      [pending.id]: { current: p.current + 1, max: p.max },
    }));
    setConfirmOpen(false);
    setPending(null);
    showFlash(`Inscription confirmée : « ${pending.title} »`);
  };

  const categories = [
    { name: "Sport", icon: Trophy, color: "from-blue-500 to-cyan-500", count: 12 },
    { name: "Bien-être", icon: Heart, color: "from-pink-500 to-rose-500", count: 8 },
    { name: "Social", icon: Users, color: "from-purple-500 to-indigo-500", count: 15 },
    { name: "Compétition", icon: Zap, color: "from-orange-500 to-red-500", count: 6 },
  ];

  return (
    <div className="relative min-h-full pb-6 overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute top-16 left-4 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl animate-pulse" />
        <div
          className="absolute bottom-32 right-4 h-96 w-96 rounded-full bg-purple-400/20 blur-3xl animate-pulse"
          style={{ animationDelay: "1s" }}
        />
        <div
          className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-pink-400/10 blur-3xl animate-pulse"
          style={{ animationDelay: "2s" }}
        />
      </div>

      <div className="relative z-10">
        <HomeWelcomeSection
          firstName={firstName}
          organizedCount={organizedCount}
          registeredCount={myRegisteredActivities.length}
          availableCount={trendingActivities.length}
        />

        {flash ? (
          <div className="mx-4 mt-3 max-w-4xl sm:mx-auto rounded-xl bg-emerald-50 px-4 py-2.5 text-sm text-emerald-900 ring-1 ring-emerald-200/80">
            {flash}
          </div>
        ) : null}

        {/* Catégories — espacement net sous la carte d’accueil (plus de chevauchement type maquette) */}
        <div className="max-w-4xl mx-auto px-4 mt-6 mb-6 sm:mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
            {categories.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.name}
                  type="button"
                  className="rounded-2xl bg-white p-3 sm:p-4 text-left shadow-md shadow-slate-200/40 ring-1 ring-slate-100 transition hover:shadow-lg hover:ring-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                >
                  <div
                    className={`mb-2 flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br ${c.color} text-white shadow-sm`}
                  >
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
                  </div>
                  <div className="text-xs sm:text-sm font-semibold text-slate-900 line-clamp-1">
                    {c.name}
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-500">{c.count} activités</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className={`${PAGE_CONTAINER_CLASS} space-y-8 sm:space-y-10 pb-4`}>
          {myOrganizedActivities.length > 0 ? (
            <section>
              <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
                      <Star className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <h2 className="text-lg sm:text-2xl font-bold text-slate-900">Mes événements</h2>
                  </div>
                  <p className="ml-11 sm:ml-12 text-xs sm:text-sm text-slate-500">
                    Gérez vos activités organisées
                  </p>
                </div>
                <Link
                  to="/planning"
                  className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1.5 text-xs sm:text-sm font-semibold text-blue-600 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                >
                  <span className="hidden sm:inline">Voir tout</span>
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </Link>
              </div>
              <div className="space-y-3 sm:space-y-4">
                {myOrganizedActivities.map((activity) => (
                  <button
                    key={activity.id}
                    type="button"
                    onClick={() => openDetail(activity)}
                    className="w-full overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-500 to-purple-600 text-left text-white shadow-lg transition hover:shadow-xl hover:brightness-[1.02] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50"
                  >
                    <div className="flex gap-3 p-3 sm:gap-4 sm:p-4">
                      <div className="relative h-24 w-24 sm:h-32 sm:w-32 shrink-0 overflow-hidden rounded-xl sm:rounded-2xl shadow-lg">
                        <img
                          src={activity.image}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                        <span className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-blue-700">
                          <Star className="h-3 w-3" />
                          Organisateur
                        </span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <h3 className="line-clamp-1 text-base font-bold sm:text-lg">{activity.title}</h3>
                          <span className="shrink-0 rounded-full border border-white/30 bg-white/20 px-2 py-0.5 text-[10px] sm:text-xs font-medium backdrop-blur">
                            {activity.type}
                          </span>
                        </div>
                        <div className="space-y-1.5 text-xs sm:text-sm text-white/90">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 shrink-0" />
                            <span className="line-clamp-1">
                              {activity.date} · {activity.time}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 shrink-0" />
                            <span className="line-clamp-1">{activity.location}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 shrink-0" />
                            <span className="font-semibold">
                              {activity.participants.current}/{activity.participants.max}
                            </span>
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/25">
                              <div
                                className="h-full rounded-full bg-white"
                                style={{
                                  width: `${(activity.participants.current / activity.participants.max) * 100}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          {myRegisteredActivities.length > 0 ? (
            <section>
              <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
                <div>
                  <div className="mb-1 flex items-center gap-2">
                    <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-sm">
                      <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                    </div>
                    <h2 className="text-lg sm:text-2xl font-bold text-slate-900">À venir</h2>
                  </div>
                  <p className="ml-11 sm:ml-12 text-xs sm:text-sm text-slate-500">
                    Vos prochaines activités
                  </p>
                </div>
                <Link
                  to="/planning"
                  className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1.5 text-xs sm:text-sm font-semibold text-purple-600 hover:bg-purple-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                >
                  <span className="hidden sm:inline">Voir tout</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {myRegisteredActivities.slice(0, 2).map((activity) => (
                  <button
                    key={activity.id}
                    type="button"
                    onClick={() => openDetail(activity)}
                    className="overflow-hidden rounded-2xl sm:rounded-3xl bg-white text-left shadow-md ring-1 ring-slate-100 transition hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                  >
                    <div className="relative h-28 sm:h-32 overflow-hidden">
                      <img
                        src={activity.image}
                        alt=""
                        className="h-full w-full object-cover transition duration-300 hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                      <span
                        className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[10px] sm:text-xs font-semibold ${getTypeBadgeClasses(activity.type)}`}
                      >
                        {activity.type}
                      </span>
                      <div className="absolute bottom-2 left-2 right-2">
                        <h3 className="mb-1 line-clamp-1 text-sm font-bold text-white">{activity.title}</h3>
                        <div className="flex items-center gap-1 text-xs text-white/90">
                          <Clock className="h-3 w-3" />
                          <span>{activity.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2 p-3">
                      <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-600">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-purple-500" />
                        <span className="line-clamp-1">{activity.location}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-[10px] font-bold text-purple-800">
                            {activity.organizer.avatar}
                          </span>
                          <span className="truncate text-xs text-slate-600">{activity.organizer.name}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-1 text-xs text-slate-600">
                          <Users className="h-3.5 w-3.5" />
                          <span>
                            {activity.participants.current}/{activity.participants.max}
                          </span>
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <div className="mb-3 flex items-center justify-between gap-2 sm:mb-4">
              <div>
                <div className="mb-1 flex items-center gap-2">
                  <div className="flex h-9 w-9 sm:h-10 sm:w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-sm">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                  </div>
                  <h2 className="text-lg sm:text-2xl font-bold text-slate-900">Tendances</h2>
                </div>
                <p className="ml-11 sm:ml-12 text-xs sm:text-sm text-slate-500">
                  Les activités du moment
                </p>
              </div>
              <span className="text-xs sm:text-sm font-semibold text-orange-600/90">Explorer bientôt</span>
            </div>
            <div className="space-y-2.5 sm:space-y-3">
              {trendingActivities.map((activity) => {
                const isRegistered = registeredIds.includes(activity.id);
                const p = getParticipants(activity);
                const isFull = p.current >= p.max;
                const fill = (p.current / p.max) * 100;

                return (
                  <div
                    key={activity.id}
                    className="overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-md ring-1 ring-slate-100 transition hover:shadow-lg"
                  >
                    <div className="flex gap-2.5 p-2.5 sm:gap-3 sm:p-3">
                      <button
                        type="button"
                        onClick={() => openDetail(activity)}
                        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-28 sm:rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
                      >
                        <img
                          src={activity.image}
                          alt=""
                          className="h-full w-full object-cover transition hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        {fill >= 80 && !isFull ? (
                          <span className="absolute left-1.5 top-1.5 inline-flex items-center gap-0.5 rounded-full bg-orange-500 px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-white">
                            <Flame className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                            Hot
                          </span>
                        ) : null}
                        {isFull ? (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                            <span className="text-[10px] sm:text-xs font-bold text-white">COMPLET</span>
                          </div>
                        ) : null}
                      </button>
                      <div className="min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => openDetail(activity)}
                          className="w-full text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 rounded-lg"
                        >
                          <div className="mb-2 flex items-start justify-between gap-2">
                            <h3 className="line-clamp-1 text-sm font-bold text-slate-900 sm:text-base">
                              {activity.title}
                            </h3>
                            <span
                              className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] sm:text-xs font-semibold ${getTypeBadgeClasses(activity.type)}`}
                            >
                              {activity.type}
                            </span>
                          </div>
                          <div className="mb-2 space-y-1 text-[10px] sm:text-xs text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 shrink-0" />
                              <span className="line-clamp-1">
                                {activity.date} · {activity.time}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <MapPin className="h-3.5 w-3.5 shrink-0" />
                              <span className="line-clamp-1">{activity.location}</span>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="flex items-center gap-1">
                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-100 text-[9px] font-bold text-orange-800">
                                  {activity.organizer.avatar}
                                </span>
                                <span className="line-clamp-1 text-[10px] sm:text-xs text-slate-600">
                                  {activity.organizer.name}
                                </span>
                              </div>
                              <span
                                className={`font-medium ${
                                  isFull
                                    ? "text-red-600"
                                    : fill >= 80
                                      ? "text-orange-600"
                                      : "text-slate-600"
                                }`}
                              >
                                {p.current}/{p.max}
                              </span>
                            </div>
                          </div>
                        </button>
                        <button
                          type="button"
                          disabled={isRegistered || isFull}
                          onClick={() => openRegister(activity)}
                          className={`w-full rounded-full py-2 text-[11px] sm:text-xs font-semibold text-white shadow-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${
                            isRegistered
                              ? "bg-gradient-to-r from-green-500 to-emerald-600 focus-visible:ring-green-500"
                              : isFull
                                ? "cursor-not-allowed bg-slate-300 text-slate-600 shadow-none"
                                : "bg-gradient-to-r from-blue-500 to-purple-600 shadow-blue-500/25 hover:brightness-105 focus-visible:ring-purple-500"
                          }`}
                        >
                          {isRegistered ? "✓ Inscrit" : isFull ? "Complet" : "Rejoindre"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>

      <ActivityDetailModal activity={detail} open={detailOpen} onOpenChange={setDetailOpen} />

      {confirmOpen && pending ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            aria-label="Annuler"
            onClick={() => setConfirmOpen(false)}
          />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl ring-1 ring-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Confirmer l&apos;inscription</h3>
            <p className="mt-2 text-sm text-slate-600">
              Voulez-vous rejoindre l&apos;activité « {pending.title} » ?
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="rounded-full px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmRegister}
                className="rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:brightness-105 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
              >
                Rejoindre
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
