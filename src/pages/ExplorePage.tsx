import { useState, useEffect, useMemo } from "react";
import {
  Search,
  MapPin,
  Users,
  Clock,
  Calendar,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Compass,
  Loader2,
  Building2,
  Car,
  SlidersHorizontal,
  Flame,
} from "lucide-react";
import { ActivityDetailModal } from "../components/home/ActivityDetailModal";
import { PostSubscribeCarpoolModal } from "../components/home/PostSubscribeCarpoolModal";
import { MessageModal } from "../components/ui/MessageModal";
import { CollaboratorLayout } from "../components/layout/CollaboratorLayout";
import { getAvailableActivities, subscribeToActivity, getActivityTypes } from "../services/activityService";
import { ApiRequestError } from "../services/api";
import type { ActivityResponse } from "../types/activity";
import { getTypeConfig } from "../utils/activityDisplay";
import { shouldOfferCarpoolAfterSubscribe, SUBSCRIBE_SUCCESS_MESSAGE } from "../utils/subscribeMessages";

/* ── Constantes ─────────────────────────────────────────────────────────────── */

const PAGE_SIZE = 10;

type Period = "all" | "today" | "week" | "month";

/* ── Utilitaires ────────────────────────────────────────────────────────────── */

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatTime(t: string): string {
  return t.slice(0, 5);
}

function formatDateShort(dateStr: string): string {
  return parseDate(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
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


/* ── Squelette de chargement ────────────────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-100 overflow-hidden animate-pulse">
      <div className="p-4 space-y-3">
        <div className="h-5 bg-slate-200 rounded-full w-1/3" />
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
        <div className="h-3 bg-slate-200 rounded w-2/3" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
        <div className="h-8 bg-slate-200 rounded-xl mt-2" />
      </div>
    </div>
  );
}

/* ── Composant carte activité ───────────────────────────────────────────────── */

function ActivityCard({
  activity,
  onOpenDetail,
  onSubscribe,
  isSubscribing,
}: {
  activity: ActivityResponse;
  onOpenDetail: () => void;
  onSubscribe: (e: React.MouseEvent) => void;
  isSubscribing: boolean;
}) {
  const { badge } = getTypeConfig(activity.activityType.name);
  const fill = Math.min(100, Math.round((activity.participantCount / activity.capacity) * 100));
  const isHot = fill >= 80;

  return (
    <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-100 overflow-hidden flex flex-col transition hover:shadow-xl hover:ring-purple-200 hover:-translate-y-0.5 group">
      <div className="flex flex-col flex-1 p-4 gap-3">
        <button
          type="button"
          onClick={onOpenDetail}
          className="flex flex-col gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 rounded-lg"
        >
          {/* Badges */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badge}`}>
              {activity.activityType.name}
            </span>
            {isHot && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
                <Flame className="h-3 w-3" aria-hidden />
                Hot
              </span>
            )}
            {activity.locationType === "ON_SITE" ? (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 ring-1 ring-emerald-100">
                <Building2 className="h-2.5 w-2.5" aria-hidden />
                Sur site
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700 ring-1 ring-blue-100">
                <MapPin className="h-2.5 w-2.5" aria-hidden />
                Hors site
              </span>
            )}
            {activity.carpool && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-semibold text-violet-700 ring-1 ring-violet-100">
                <Car className="h-2.5 w-2.5" aria-hidden />
                Covoiturage
              </span>
            )}
          </div>

          {/* Titre */}
          <h3 className="font-bold text-base text-slate-900 leading-tight line-clamp-2 group-hover:text-purple-700 transition-colors">
            {activity.title}
          </h3>

          {/* Infos */}
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 shrink-0 text-purple-400" aria-hidden />
              <span>{formatDateShort(activity.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 shrink-0 text-purple-400" aria-hidden />
              <span>{formatTime(activity.startTime)} – {formatTime(activity.endTime)}</span>
            </div>
            <div className="flex items-center gap-2">
              {activity.locationType === "ON_SITE" ? (
                <Building2 className="h-3.5 w-3.5 shrink-0 text-emerald-500" aria-hidden />
              ) : (
                <MapPin className="h-3.5 w-3.5 shrink-0 text-purple-400" aria-hidden />
              )}
              <span className="line-clamp-1">
                {activity.locationType === "ON_SITE"
                  ? (activity.location.room ?? "Sur site")
                  : [activity.location.city, activity.location.street].filter(Boolean).join(", ") || "—"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 shrink-0 text-purple-400" aria-hidden />
              <span className={isHot ? "font-semibold text-orange-600" : ""}>
                {activity.participantCount}/{activity.capacity} place{activity.capacity > 1 ? "s" : ""}
              </span>
            </div>
          </div>

          {/* Organisateur */}
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-[10px] font-bold text-white" aria-hidden>
              {getInitials(activity.organizerName)}
            </span>
            <span className="truncate">{activity.organizerName}</span>
          </div>
        </button>

        <button
          type="button"
          disabled={isSubscribing}
          onClick={(e) => {
            e.stopPropagation();
            onSubscribe(e);
          }}
          className="mt-auto w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold shadow-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-purple-200/50 hover:brightness-105 disabled:opacity-60"
        >
          {isSubscribing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Inscription…
            </>
          ) : (
            "S'inscrire"
          )}
        </button>
      </div>
    </div>
  );
}

/* ── Page principale ────────────────────────────────────────────────────────── */

const PERIOD_LABELS: Record<Period, string> = {
  all: "Toutes",
  today: "Aujourd'hui",
  week: "Cette semaine",
  month: "Ce mois",
};

export function ExplorePage() {
  const [activities, setActivities] = useState<ActivityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedPeriod, setSelectedPeriod] = useState<Period>("all");
  const [locationFilter, setLocationFilter] = useState<"all" | "on_site" | "off_site">("all");
  const [carpoolFilter, setCarpoolFilter] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState<ActivityResponse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const [subscribingId, setSubscribingId] = useState<number | null>(null);
  const [subscribeErrorMessage, setSubscribeErrorMessage] = useState<string | null>(null);
  const [subscribeSuccessMessage, setSubscribeSuccessMessage] = useState<string | null>(null);
  const [postSubscribeOpen, setPostSubscribeOpen] = useState(false);
  const [postSubscribeActivity, setPostSubscribeActivity] = useState<ActivityResponse | null>(null);
  const [allTypes, setAllTypes] = useState<string[]>([]);

  /* Chargement */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);
    getAvailableActivities()
      .then((data) => {
        if (!cancelled) {
          setActivities(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* Chargement des types pour le filtre */
  useEffect(() => {
    let cancelled = false;
    getActivityTypes().then((types) => {
      if (!cancelled) setAllTypes(types.map((t) => t.name).sort((a, b) => a.localeCompare(b, "fr")));
    });
    return () => { cancelled = true; };
  }, []);

  /* Activités avec places restantes (les complètes ne sont pas affichées) */
  const openActivities = useMemo(
    () => activities.filter((a) => a.participantCount < a.capacity),
    [activities]
  );

  const uniqueTypes = allTypes;

  /* Filtrage */
  const filtered = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return openActivities.filter((a) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTitle = a.title.toLowerCase().includes(q);
        const matchType = a.activityType.name.toLowerCase().includes(q);
        const matchCity = (a.location.city ?? "").toLowerCase().includes(q);
        const matchRoom = (a.location.room ?? "").toLowerCase().includes(q);
        const matchOrganizer = a.organizerName.toLowerCase().includes(q);
        if (!matchTitle && !matchType && !matchCity && !matchRoom && !matchOrganizer) return false;
      }

      if (selectedType !== "all" && a.activityType.name !== selectedType) return false;

      if (locationFilter === "on_site" && a.locationType !== "ON_SITE") return false;
      if (locationFilter === "off_site" && a.locationType !== "OFF_SITE") return false;

      if (carpoolFilter && !a.carpool) return false;

      if (selectedPeriod !== "all") {
        const d = parseDate(a.date);
        const weekEnd = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
        const monthEnd = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
        if (selectedPeriod === "today" && !isSameDay(d, today)) return false;
        if (selectedPeriod === "week" && (d < today || d > weekEnd)) return false;
        if (selectedPeriod === "month" && (d < today || d > monthEnd)) return false;
      }

      return true;
    });
  }, [openActivities, searchQuery, selectedType, selectedPeriod, locationFilter, carpoolFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const activeFilterCount = [
    searchQuery ? 1 : 0,
    selectedType !== "all" ? 1 : 0,
    selectedPeriod !== "all" ? 1 : 0,
    locationFilter !== "all" ? 1 : 0,
    carpoolFilter ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const hasActiveSubFilters =
    selectedType !== "all" ||
    selectedPeriod !== "all" ||
    locationFilter !== "all" ||
    carpoolFilter;

  function changeFilter(updates: Partial<{ search: string; type: string; period: Period }>) {
    if (updates.search !== undefined) setSearchQuery(updates.search);
    if (updates.type !== undefined) setSelectedType(updates.type);
    if (updates.period !== undefined) setSelectedPeriod(updates.period);
    setCurrentPage(0);
  }

  function toggleLocationFilter(loc: "on_site" | "off_site") {
    setLocationFilter((prev) => (prev === loc ? "all" : loc));
    setCurrentPage(0);
  }

  function toggleCarpoolFilter() {
    setCarpoolFilter((v) => !v);
    setCurrentPage(0);
  }

  function resetSubFilters() {
    setSelectedType("all");
    setSelectedPeriod("all");
    setLocationFilter("all");
    setCarpoolFilter(false);
    setCurrentPage(0);
  }

  function clearFilters() {
    setSearchQuery("");
    resetSubFilters();
  }

  function openModal(activity: ActivityResponse) {
    setSelectedActivity(activity);
    setModalOpen(true);
  }

  function finishSubscribeFlow(updated: ActivityResponse) {
    setActivities((prev) => prev.filter((a) => a.id !== updated.id));
    setSelectedActivity((prev) => (prev?.id === updated.id ? null : prev));
    setModalOpen(false);
    if (shouldOfferCarpoolAfterSubscribe(updated)) {
      setPostSubscribeActivity(updated);
      setPostSubscribeOpen(true);
    } else {
      setSubscribeSuccessMessage(SUBSCRIBE_SUCCESS_MESSAGE);
    }
  }

  const handleSubscribeFromCard = async (activity: ActivityResponse) => {
    setSubscribeErrorMessage(null);
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

  const handlePostSubscribeComplete = () => {
    setPostSubscribeOpen(false);
    setPostSubscribeActivity(null);
    setSubscribeSuccessMessage(SUBSCRIBE_SUCCESS_MESSAGE);
  };

  return (
    <CollaboratorLayout>
      <div className="space-y-4 pb-6">
        {/* ── Hero card ── */}
        <section>
          <div className="rounded-2xl bg-white shadow-md shadow-slate-200/50 ring-1 ring-slate-200/80 overflow-hidden">
            <div className="h-1.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" aria-hidden />
            <div className="p-4 sm:p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white shadow-md">
                  <Compass className="h-5 w-5" />
                </div>
                <div>
                  <h1 className="text-lg sm:text-xl font-bold text-slate-900">
                    Explorer les activités
                  </h1>
                  <p className="text-sm text-slate-500">
                    {loading
                      ? "Chargement…"
                      : error
                      ? "Impossible de charger les activités"
                      : `${openActivities.length} activité${openActivities.length > 1 ? "s" : ""} disponible${openActivities.length > 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Recherche & filtres ── */}
        <section>
          <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-100 p-4 space-y-3">
            {/* Barre de recherche */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="search"
                  placeholder="Titre, type, ville, organisateur…"
                  value={searchQuery}
                  onChange={(e) => changeFilter({ search: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-purple-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-200 transition"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => changeFilter({ search: "" })}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    aria-label="Effacer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                aria-label={activeFilterCount > 0 ? `Filtres (${activeFilterCount} actif${activeFilterCount > 1 ? "s" : ""})` : "Filtres"}
                aria-expanded={showFilters}
                aria-controls="search-filters-panel"
                className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                  showFilters || activeFilterCount > 0
                    ? "border-purple-400 bg-purple-50 text-purple-700"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Filter className="h-4 w-4" aria-hidden />
                <span className="hidden sm:inline" aria-hidden>Filtres</span>
                {activeFilterCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white" aria-hidden>
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Panneau de filtres */}
            {showFilters && (
              <div id="search-filters-panel" className="space-y-3 pt-1 border-t border-slate-100">
                <div className="flex items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-purple-500" />
                    <span className="text-xs font-bold text-slate-700 tracking-wide">Affiner la recherche</span>
                    {hasActiveSubFilters && (
                      <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                        {[selectedType !== "all", selectedPeriod !== "all", locationFilter !== "all", carpoolFilter].filter(Boolean).length} actif{[selectedType !== "all", selectedPeriod !== "all", locationFilter !== "all", carpoolFilter].filter(Boolean).length > 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {hasActiveSubFilters && (
                    <button
                      type="button"
                      onClick={resetSubFilters}
                      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 transition"
                    >
                      <X className="h-3 w-3" />
                      Tout effacer
                    </button>
                  )}
                </div>

                {/* Lieu + covoiturage */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-14 shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Lieu
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => toggleLocationFilter("on_site")}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
                        locationFilter === "on_site"
                          ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200"
                          : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                      }`}
                    >
                      <Building2 className="h-3 w-3" />
                      Sur site
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleLocationFilter("off_site")}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
                        locationFilter === "off_site"
                          ? "bg-blue-500 text-white shadow-sm shadow-blue-200"
                          : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                      }`}
                    >
                      <MapPin className="h-3 w-3" />
                      Hors site
                    </button>
                    <div className="h-5 w-px bg-slate-200 mx-1" />
                    <button
                      type="button"
                      onClick={toggleCarpoolFilter}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
                        carpoolFilter
                          ? "bg-violet-500 text-white shadow-sm shadow-violet-200"
                          : "bg-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-700"
                      }`}
                    >
                      <Car className="h-3 w-3" />
                      Covoiturage
                    </button>
                  </div>
                </div>

                {/* Filtre par type */}
                {uniqueTypes.length > 0 && (
                  <div className="flex items-start gap-2">
                    <span className="w-14 shrink-0 pt-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Type
                    </span>
                    <div className="scrollbar-colife flex flex-1 gap-1.5 overflow-x-auto pb-1.5">
                      <button
                        type="button"
                        onClick={() => changeFilter({ type: "all" })}
                        className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
                          selectedType === "all"
                            ? "bg-purple-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        Tous
                      </button>
                      {uniqueTypes.map((type) => (
                        <button
                          key={type}
                          type="button"
                          onClick={() => changeFilter({ type: selectedType === type ? "all" : type })}
                          className={`shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
                            selectedType === type
                              ? "bg-purple-600 text-white shadow-sm"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Filtre par période */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-14 shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Période
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {(["all", "today", "week", "month"] as Period[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => changeFilter({ period: p })}
                        className={`rounded-lg px-3 py-1.5 text-[11px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
                          selectedPeriod === p
                            ? "bg-blue-600 text-white shadow-sm"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                        }`}
                      >
                        {PERIOD_LABELS[p]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ── Contenu principal ── */}
        <section>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-100 p-10 text-center">
              <Compass className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p className="font-semibold text-slate-700">Impossible de charger les activités</p>
              <p className="mt-1 text-sm text-slate-500">Vérifiez votre connexion et réessayez.</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-100 p-10 text-center">
              <Search className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p className="font-semibold text-slate-700">Aucune activité trouvée</p>
              <p className="mt-1 text-sm text-slate-500">
                {activeFilterCount > 0
                  ? "Essayez de modifier vos critères de recherche."
                  : "Il n'y a aucune activité disponible pour le moment."}
              </p>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-md hover:brightness-105 transition"
                >
                  <X className="h-4 w-4" />
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Compteur */}
              <p className="mb-3 text-sm text-slate-500">
                <span className="font-semibold text-slate-800">{filtered.length}</span>{" "}
                activité{filtered.length > 1 ? "s" : ""} disponible{filtered.length > 1 ? "s" : ""}
                {activeFilterCount > 0 && " (filtrées)"}
              </p>

              {/* Grille */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {paginated.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    activity={activity}
                    onOpenDetail={() => openModal(activity)}
                    onSubscribe={() => handleSubscribeFromCard(activity)}
                    isSubscribing={subscribingId === activity.id}
                  />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between gap-4">
                  <button
                    type="button"
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Précédent
                  </button>
                  <span className="text-sm font-medium text-slate-600">
                    {currentPage + 1} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages - 1}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Suivant
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>

      {/* Même modal détail que l'accueil / activités disponibles */}
      <ActivityDetailModal
        activity={selectedActivity}
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode="available"
        onSubscribed={(updated) => {
          setSubscribeErrorMessage(null);
          setSubscribeSuccessMessage(SUBSCRIBE_SUCCESS_MESSAGE);
          setActivities((prev) => prev.filter((a) => a.id !== updated.id));
          setSelectedActivity(null);
          setModalOpen(false);
        }}
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
    </CollaboratorLayout>
  );
}
