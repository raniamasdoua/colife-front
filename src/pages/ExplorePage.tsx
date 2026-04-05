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
import { getTypeConfig } from "../utils/activityDisplay";

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
  onClick,
}: {
  activity: ActivityResponse;
  onClick: () => void;
}) {
  const { badge } = getTypeConfig(activity.activityType.name);
  const fill = Math.min(100, Math.round((activity.participantCount / activity.capacity) * 100));
  const isFull = activity.participantCount >= activity.capacity;
  const isHot = fill >= 80 && !isFull;

  return (
    <div
      className="rounded-2xl bg-white shadow-md ring-1 ring-slate-100 overflow-hidden flex flex-col transition hover:shadow-xl hover:ring-purple-200 hover:-translate-y-0.5 cursor-pointer group"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onClick()}
    >
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${badge}`}>
            {activity.activityType.name}
          </span>
          {isHot && (
            <span className="inline-flex items-center gap-0.5 rounded-full bg-orange-500 px-2 py-0.5 text-[10px] font-bold text-white">
              🔥 Hot
            </span>
          )}
          {isFull && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-600">
              Complet
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
            <Calendar className="h-3.5 w-3.5 shrink-0 text-purple-400" />
            <span>{formatDateShort(activity.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 shrink-0 text-purple-400" />
            <span>{formatTime(activity.startTime)} – {formatTime(activity.endTime)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-purple-400" />
            <span className="line-clamp-1">
              {activity.location.city}
              {activity.location.street ? `, ${activity.location.street}` : ""}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 shrink-0 text-purple-400" />
              <span className={isFull ? "font-semibold text-red-600" : isHot ? "font-semibold text-orange-600" : ""}>
                {activity.participantCount}/{activity.capacity} place{activity.capacity > 1 ? "s" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* Organisateur */}
        <div className="flex items-center gap-2 text-xs text-slate-600 mt-auto">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-[10px] font-bold text-white">
            {getInitials(activity.organizerName)}
          </span>
          <span className="truncate">{activity.organizerName}</span>
        </div>

        {/* Bouton S'inscrire — visuel uniquement */}
        <button
          type="button"
          disabled={isFull}
          onClick={(e) => e.stopPropagation()}
          className={`w-full rounded-xl py-2.5 text-sm font-semibold text-white shadow-md transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
            isFull
              ? "cursor-not-allowed bg-slate-300 text-slate-500 shadow-none"
              : "bg-gradient-to-r from-blue-500 to-purple-600 shadow-purple-200/50 hover:brightness-105"
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

  const { gradient, badge, icon: Icon } = getTypeConfig(activity.activityType.name);

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
        {/* Header coloré avec icône */}
        <div className={`relative h-36 bg-gradient-to-br ${gradient} shrink-0 flex items-center justify-center overflow-hidden`}>
          <div className="absolute -top-6 -right-6 h-32 w-32 rounded-full bg-white/10" />
          <div className="absolute -bottom-8 -left-8 h-36 w-36 rounded-full bg-white/10" />
          <Icon className="h-16 w-16 text-white/90 drop-shadow-sm relative z-10" strokeWidth={1.5} />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-black/25 text-white hover:bg-black/40 transition"
            aria-label="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute bottom-3 left-4">
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold shadow-sm ${badge}`}>
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
