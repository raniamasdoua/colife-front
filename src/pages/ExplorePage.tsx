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
  UserCircle2,
} from "lucide-react";
import { PAGE_CONTAINER_CLASS } from "../layout/page";
import { getAvailableActivities } from "../services/activityService";
import type { ActivityResponse } from "../types/activity";

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

function getFillPercent(capacity: number, participantCount?: number): number {
  if (!participantCount) return 0;
  return Math.min(100, Math.round((participantCount / capacity) * 100));
}

/* ── Mapping type → couleur ─────────────────────────────────────────────────── */

const TYPE_GRADIENTS: Record<string, string> = {
  Piscine: "from-blue-400 to-cyan-500",
  Natation: "from-blue-400 to-cyan-500",
  Padel: "from-green-400 to-emerald-500",
  Tennis: "from-yellow-400 to-orange-400",
  Yoga: "from-violet-400 to-purple-500",
  Football: "from-green-500 to-teal-600",
  "Course à pied": "from-red-400 to-orange-500",
  Running: "from-red-400 to-orange-500",
  Randonnée: "from-lime-500 to-green-600",
  Cuisine: "from-pink-400 to-rose-500",
  Escalade: "from-indigo-400 to-blue-600",
  Méditation: "from-purple-400 to-violet-500",
  Badminton: "from-amber-400 to-yellow-500",
  "Jeux de société": "from-orange-400 to-amber-500",
  Social: "from-rose-400 to-pink-500",
  Pilates: "from-fuchsia-400 to-pink-500",
};

function getTypeGradient(typeName: string): string {
  return TYPE_GRADIENTS[typeName] ?? "from-blue-500 to-purple-600";
}

const TYPE_BADGE: Record<string, string> = {
  Piscine: "bg-blue-100 text-blue-800",
  Natation: "bg-blue-100 text-blue-800",
  Padel: "bg-green-100 text-green-800",
  Tennis: "bg-yellow-100 text-yellow-800",
  Yoga: "bg-purple-100 text-purple-800",
  Football: "bg-emerald-100 text-emerald-800",
  "Course à pied": "bg-red-100 text-red-800",
  Running: "bg-red-100 text-red-800",
  Randonnée: "bg-lime-100 text-lime-800",
  Cuisine: "bg-pink-100 text-pink-800",
  Escalade: "bg-indigo-100 text-indigo-800",
  Méditation: "bg-violet-100 text-violet-800",
  Badminton: "bg-amber-100 text-amber-800",
  "Jeux de société": "bg-orange-100 text-orange-800",
  Social: "bg-rose-100 text-rose-800",
  Pilates: "bg-fuchsia-100 text-fuchsia-800",
};

function getTypeBadgeClass(typeName: string): string {
  return TYPE_BADGE[typeName] ?? "bg-slate-100 text-slate-700";
}

/* ── Squelette de chargement ────────────────────────────────────────────────── */

function SkeletonCard() {
  return (
    <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-100 overflow-hidden animate-pulse">
      <div className="h-28 bg-slate-200" />
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
        <div className="h-3 bg-slate-200 rounded w-2/3" />
        <div className="h-8 bg-slate-200 rounded-xl mt-2" />
      </div>
    </div>
  );
}

/* ── Composant carte activité ───────────────────────────────────────────────── */

function ActivityCard({
  activity,
  onClick,
}: {
  activity: ActivityResponse;
  onClick: () => void;
}) {
  const gradient = getTypeGradient(activity.activityType.name);
  const badgeClass = getTypeBadgeClass(activity.activityType.name);
  const fill = getFillPercent(activity.capacity);
  const isFull = fill >= 100;

  return (
    <div
      className="rounded-2xl bg-white shadow-md ring-1 ring-slate-100 overflow-hidden flex flex-col transition hover:shadow-lg hover:ring-purple-200 cursor-pointer group"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      {/* Colored header */}
      <div className={`relative h-28 bg-gradient-to-br ${gradient} flex items-center justify-center`}>
        <span className="text-white/20 text-7xl font-black select-none leading-none">
          {activity.activityType.name.slice(0, 1).toUpperCase()}
        </span>
        <div className="absolute top-3 left-3">
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badgeClass}`}>
            {activity.activityType.name}
          </span>
        </div>
        {isFull && (
          <div className="absolute top-3 right-3">
            <span className="inline-block rounded-full bg-red-500 px-2.5 py-0.5 text-[11px] font-semibold text-white">
              Complet
            </span>
          </div>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <h3 className="font-bold text-base text-slate-900 leading-tight line-clamp-2 group-hover:text-purple-700 transition-colors">
          {activity.title}
        </h3>

        <div className="space-y-1.5 text-xs text-slate-600">
          <div className="flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 shrink-0 text-purple-500" />
            <span>{formatDateShort(activity.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 shrink-0 text-purple-500" />
            <span>
              {formatTime(activity.startTime)} – {formatTime(activity.endTime)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-purple-500" />
            <span className="line-clamp-1">
              {activity.location.city}
              {activity.location.street ? `, ${activity.location.street}` : ""}
            </span>
          </div>
        </div>

        {/* Organisateur + participants */}
        <div className="flex items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-[10px] font-bold text-white">
              {getInitials(activity.organizerName)}
            </span>
            <span className="truncate">{activity.organizerName}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <Users className="h-3.5 w-3.5 text-slate-400" />
            <span className={isFull ? "font-semibold text-red-600" : ""}>
              {activity.capacity}
            </span>
          </div>
        </div>

        {/* Bouton d'inscription — visuel uniquement */}
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          disabled={isFull}
          className={`mt-auto w-full rounded-xl py-2.5 text-sm font-semibold text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
            isFull
              ? "cursor-not-allowed bg-slate-300 text-slate-500"
              : "bg-gradient-to-r from-blue-500 to-purple-600 shadow-md shadow-purple-200 hover:brightness-105"
          }`}
        >
          {isFull ? "Complet" : "S'inscrire"}
        </button>
      </div>
    </div>
  );
}

/* ── Modal détail ───────────────────────────────────────────────────────────── */

function ActivityDetailModal({
  activity,
  open,
  onClose,
}: {
  activity: ActivityResponse | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!open || !activity) return null;

  const gradient = getTypeGradient(activity.activityType.name);
  const badgeClass = getTypeBadgeClass(activity.activityType.name);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div className="relative z-10 w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header coloré */}
        <div className={`relative h-36 bg-gradient-to-br ${gradient} shrink-0`}>
          <span className="absolute inset-0 flex items-center justify-center text-white/15 text-9xl font-black select-none leading-none">
            {activity.activityType.name.slice(0, 1).toUpperCase()}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/25 text-white hover:bg-black/40 transition"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute bottom-3 left-4">
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badgeClass}`}>
              {activity.activityType.name}
            </span>
          </div>
        </div>

        {/* Corps */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <h2 className="text-xl font-bold text-slate-900">{activity.title}</h2>

          {activity.description && (
            <p className="text-sm text-slate-600 leading-relaxed">{activity.description}</p>
          )}

          <div className="space-y-2.5 text-sm text-slate-700">
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 shrink-0 mt-0.5 text-purple-500" />
              <span>{formatDateShort(activity.date)}</span>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 shrink-0 mt-0.5 text-purple-500" />
              <span>
                {formatTime(activity.startTime)} – {formatTime(activity.endTime)}
              </span>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-purple-500" />
              <span>
                {activity.location.street}
                {activity.location.complement ? `, ${activity.location.complement}` : ""}
                {" — "}{activity.location.postalCode} {activity.location.city}
              </span>
            </div>
            <div className="flex items-start gap-3">
              <Users className="h-4 w-4 shrink-0 mt-0.5 text-purple-500" />
              <span>Capacité : {activity.capacity} participant(s)</span>
            </div>
            <div className="flex items-start gap-3">
              <UserCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-purple-500" />
              <span>Organisé par <strong>{activity.organizerName}</strong></span>
            </div>
          </div>
        </div>

        {/* Footer bouton */}
        <div className="p-4 border-t border-slate-100 shrink-0">
          <button
            type="button"
            className="w-full rounded-xl bg-gradient-to-r from-blue-500 to-purple-600 py-3 text-sm font-semibold text-white shadow-md shadow-purple-200 hover:brightness-105 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
          >
            S'inscrire
          </button>
        </div>
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
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedActivity, setSelectedActivity] = useState<ActivityResponse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

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

  /* Types uniques pour le filtre */
  const uniqueTypes = useMemo(
    () => [...new Set(activities.map((a) => a.activityType.name))].sort(),
    [activities]
  );

  /* Filtrage */
  const filtered = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return activities.filter((a) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTitle = a.title.toLowerCase().includes(q);
        const matchType = a.activityType.name.toLowerCase().includes(q);
        const matchCity = a.location.city.toLowerCase().includes(q);
        const matchOrganizer = a.organizerName.toLowerCase().includes(q);
        if (!matchTitle && !matchType && !matchCity && !matchOrganizer) return false;
      }

      if (selectedType !== "all" && a.activityType.name !== selectedType) return false;

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
  }, [activities, searchQuery, selectedType, selectedPeriod]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  const activeFilterCount = [
    searchQuery ? 1 : 0,
    selectedType !== "all" ? 1 : 0,
    selectedPeriod !== "all" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  function changeFilter(updates: Partial<{ search: string; type: string; period: Period }>) {
    if (updates.search !== undefined) setSearchQuery(updates.search);
    if (updates.type !== undefined) setSelectedType(updates.type);
    if (updates.period !== undefined) setSelectedPeriod(updates.period);
    setCurrentPage(0);
  }

  function clearFilters() {
    setSearchQuery("");
    setSelectedType("all");
    setSelectedPeriod("all");
    setCurrentPage(0);
  }

  function openModal(activity: ActivityResponse) {
    setSelectedActivity(activity);
    setModalOpen(true);
  }

  return (
    <div className="relative min-h-full pb-6 overflow-x-hidden">
      {/* Fond décoratif */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute top-16 right-4 h-64 w-64 rounded-full bg-blue-400/15 blur-3xl" />
        <div className="absolute bottom-24 left-4 h-80 w-80 rounded-full bg-purple-400/15 blur-3xl" />
      </div>

      <div className="relative z-10">
        {/* ── Hero card ── */}
        <section className={`${PAGE_CONTAINER_CLASS} pt-4 pb-1`}>
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
                      : `${activities.length} activité${activities.length > 1 ? "s" : ""} disponible${activities.length > 1 ? "s" : ""}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Recherche & filtres ── */}
        <section className={`${PAGE_CONTAINER_CLASS} mt-4`}>
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
                className={`flex shrink-0 items-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                  showFilters || activeFilterCount > 0
                    ? "border-purple-400 bg-purple-50 text-purple-700"
                    : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Filter className="h-4 w-4" />
                <span className="hidden sm:inline">Filtres</span>
                {activeFilterCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-[10px] font-bold text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>

            {/* Panneau de filtres */}
            {showFilters && (
              <div className="space-y-3 pt-1">
                {/* Filtre par type */}
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Type d'activité
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => changeFilter({ type: "all" })}
                      className={`rounded-full px-3 py-1 text-xs font-semibold transition focus:outline-none ${
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
                        onClick={() => changeFilter({ type })}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition focus:outline-none ${
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

                {/* Filtre par période */}
                <div>
                  <p className="mb-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    Période
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {(["all", "today", "week", "month"] as Period[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => changeFilter({ period: p })}
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition focus:outline-none ${
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

                {/* Réinitialiser */}
                {activeFilterCount > 0 && (
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="flex items-center gap-1.5 text-xs font-semibold text-purple-600 hover:text-purple-800 transition"
                  >
                    <X className="h-3.5 w-3.5" />
                    Réinitialiser les filtres
                  </button>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ── Contenu principal ── */}
        <section className={`${PAGE_CONTAINER_CLASS} mt-4`}>
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
                    onClick={() => openModal(activity)}
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

      {/* Modal détail */}
      <ActivityDetailModal
        activity={selectedActivity}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </div>
  );
}
