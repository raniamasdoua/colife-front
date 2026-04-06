import { useState, useEffect, useRef, useCallback } from "react";
import {
  CalendarDays,
  Clock,
  MapPin,
  Users,
  ChevronLeft,
  ChevronRight,
  Star,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  LayoutList,
} from "lucide-react";

type FilterMode = "organized" | "registered" | "all";
import { PAGE_CONTAINER_CLASS } from "../layout/page";
import { getMyActivities } from "../services/activityService";
import { getTypeConfig } from "../utils/activityDisplay";
import { useCreateActivityModal } from "../context/CreateActivityModalContext";
import { ActivityDetailModal } from "../components/planning/ActivityDetailModal";
import { EditActivityModal } from "../components/EditActivityModal";
import type { ActivityResponse } from "../types/activity";

const PAGE_SIZE = 10;

/* ── Constantes ────────────────────────────────────────────────────────────── */

const MONTH_NAMES = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
];
const DAY_LETTERS = ["L", "M", "M", "J", "V", "S", "D"];

/* ── Utilitaires de date ───────────────────────────────────────────────────── */

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function formatTime(t: string): string {
  return t.slice(0, 5);
}

function formatDateLong(date: Date): string {
  return date.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Une activité est "passée" si :
 * - sa date est antérieure à aujourd'hui, OU
 * - c'est aujourd'hui ET son heure de fin est déjà écoulée.
 */
function isActivityPast(activity: ActivityResponse, today: Date): boolean {
  const actDate = parseDate(activity.date);
  if (actDate.getTime() < today.getTime()) return true;
  if (isSameDay(actDate, today)) {
    const [h, m] = formatTime(activity.endTime).split(":").map(Number);
    const endDateTime = new Date(
      actDate.getFullYear(),
      actDate.getMonth(),
      actDate.getDate(),
      h,
      m
    );
    return endDateTime < new Date();
  }
  return false;
}

/* ── Composant carte activité ─────────────────────────────────────────────── */

function ActivityCard({
  activity,
  today,
  onClick,
  showOrganizerBadge = false,
}: {
  activity: ActivityResponse;
  today: Date;
  onClick: () => void;
  showOrganizerBadge?: boolean;
}) {
  const isPast = isActivityPast(activity, today);
  const { badge } = getTypeConfig(activity.activityType.name);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left flex overflow-hidden rounded-xl bg-white shadow-sm ring-1 transition-all duration-200 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
        isPast
          ? "ring-slate-100 opacity-55"
          : "ring-slate-100 hover:ring-purple-200 hover:-translate-y-px"
      }`}
    >
      <div className="flex-1 min-w-0 p-3 sm:p-3.5">
        {/* Titre + badges */}
        <div className="flex items-start justify-between gap-2 mb-1.5">
          <div className="flex items-center gap-1.5 min-w-0">
            {showOrganizerBadge && (
              <Star className="h-3 w-3 shrink-0 text-amber-400 fill-amber-400" />
            )}
            <h4 className="font-semibold text-sm text-slate-900 line-clamp-1 leading-snug">
              {activity.title}
            </h4>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            {showOrganizerBadge && (
              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[9px] font-bold text-amber-700 ring-1 ring-amber-200 whitespace-nowrap">
                Organisateur
              </span>
            )}
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${badge}`}>
              {activity.activityType.name}
            </span>
          </div>
        </div>

        {/* Heure + lieu */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3 shrink-0 text-slate-400" />
            {formatTime(activity.startTime)} – {formatTime(activity.endTime)}
          </span>
          <span className="flex items-center gap-1 min-w-0">
            <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
            <span className="line-clamp-1">
              {activity.location.street}, {activity.location.city}
            </span>
          </span>
        </div>

        {/* Bas : capacité + statut */}
        <div className="flex items-center justify-between mt-2">
          <span className="flex items-center gap-1 text-[11px] text-slate-500">
            <Users className="h-3 w-3 shrink-0 text-slate-400" />
            <span className="font-semibold text-slate-700">{activity.capacity}</span>
            <span>place{activity.capacity > 1 ? "s" : ""}</span>
          </span>
          {isPast ? (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">
              Passé
            </span>
          ) : (
            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 ring-1 ring-emerald-200">
              À venir
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

/* ── Page principale ──────────────────────────────────────────────────────── */

export function PlanningPage() {
  const [activities, setActivities] = useState<ActivityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [filterMode, setFilterMode] = useState<FilterMode>("organized");
  const [selectedActivity, setSelectedActivity] = useState<ActivityResponse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editActivity, setEditActivity] = useState<ActivityResponse | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const { openCreate } = useCreateActivityModal();

  const handleActivityDeleted = useCallback((id: number) => {
    setActivities((prev) => prev.filter((a) => a.id !== id));
    setSelectedActivity(null);
    setModalOpen(false);
    setEditActivity((e) => (e?.id === id ? null : e));
  }, []);

  useEffect(() => {
    if (editActivity === null && editOpen) {
      setEditOpen(false);
    }
  }, [editActivity, editOpen]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  /* Chargement API */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getMyActivities();
        if (!cancelled) setActivities(data);
      } catch {
        if (!cancelled) setError("Impossible de charger vos activités.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* ── Logique calendrier ────────────────────────────────────────────────── */

  const calendarDays = (): (Date | null)[] => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    let dow = first.getDay();
    dow = dow === 0 ? 6 : dow - 1;
    const days: (Date | null)[] = [];
    for (let i = 0; i < dow; i++) days.push(null);
    for (let d = 1; d <= last.getDate(); d++) days.push(new Date(year, month, d));
    return days;
  };

  const getActivitiesForDate = (date: Date) =>
    activities
      .filter((a) => isSameDay(parseDate(a.date), date))
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const hasActivities = (date: Date | null) =>
    date ? getActivitiesForDate(date).length > 0 : false;

  const isToday = (date: Date | null) =>
    date ? isSameDay(date, today) : false;

  const isSelected = (date: Date | null) =>
    date && selectedDate ? isSameDay(date, selectedDate) : false;

  const handleDateClick = (date: Date | null) => {
    if (!date) return;
    setSelectedDate((prev) => {
      const next = prev && isSameDay(prev, date) ? null : date;
      return next;
    });
    setCurrentPage(0);
    setTimeout(
      () =>
        listRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }),
      80
    );
  };

  const clearDate = () => {
    setSelectedDate(null);
    setCurrentPage(0);
  };

  const changeFilter = (mode: FilterMode) => {
    setFilterMode(mode);
    setSelectedDate(null);
    setCurrentPage(0);
  };

  const openActivity = (a: ActivityResponse) => {
    setSelectedActivity(a);
    setModalOpen(true);
  };

  /* ── Stats ─────────────────────────────────────────────────────────────── */

  const now = new Date();
  const totalCount = activities.length;
  const thisMonthCount = activities.filter((a) => {
    const d = parseDate(a.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;
  const upcomingCount = activities.filter((a) => !isActivityPast(a, today)).length;

  /* ── Activités affichées ────────────────────────────────────────────────── */

  const upcoming = activities
    .filter((a) => !isActivityPast(a, today))
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  const past = activities
    .filter((a) => isActivityPast(a, today))
    .sort((a, b) => b.date.localeCompare(a.date) || a.startTime.localeCompare(b.startTime));

  /* Sans date sélectionnée : uniquement les activités à venir.
     Avec date sélectionnée : toutes celles du jour (les passées sont grisées). */
  const displayed = selectedDate
    ? getActivitiesForDate(selectedDate)
    : upcoming;

  /* Groupement par date (vue "tout") */
  const buildGroups = (list: ActivityResponse[]) => {
    const map = new Map<string, ActivityResponse[]>();
    for (const a of list) {
      if (!map.has(a.date)) map.set(a.date, []);
      map.get(a.date)!.push(a);
    }
    return Array.from(map.entries()).map(([date, items]) => ({
      date,
      label: formatDateLong(parseDate(date)),
      isPast: parseDate(date) < today,
      items,
    }));
  };

  const upcomingGroups = buildGroups(upcoming);
  const pastGroups = buildGroups(past);

  /* ── Pagination ─────────────────────────────────────────────────────────── */
  const totalPages = Math.ceil(displayed.length / PAGE_SIZE);
  const pagedItems = displayed.slice(
    currentPage * PAGE_SIZE,
    (currentPage + 1) * PAGE_SIZE
  );

  /* Groupes paginés (vue "tout") */
  const pagedGroups = (() => {
    const pagedSet = new Set(pagedItems.map((a) => a.id));
    const all = [...upcomingGroups, ...pastGroups];
    return all
      .map((g) => ({ ...g, items: g.items.filter((a) => pagedSet.has(a.id)) }))
      .filter((g) => g.items.length > 0);
  })();

  const days = calendarDays();

  /* ── Rendu ──────────────────────────────────────────────────────────────── */

  return (
    <div className="min-h-full bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Blobs décoratifs (mêmes que HomePage) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-blue-300/10 blur-3xl" />
        <div className="absolute top-1/2 -left-20 h-80 w-80 rounded-full bg-purple-300/10 blur-3xl" />
      </div>

      <div className={`relative ${PAGE_CONTAINER_CLASS} pt-4 pb-24 space-y-4 sm:space-y-5`}>

        {/* ── Carte héro ─────────────────────────────────────────────────── */}
        <section
          className="rounded-2xl bg-white shadow-md shadow-slate-200/50 ring-1 ring-slate-200/80 overflow-hidden"
          aria-label="Mon Planning"
        >
          <div
            className="h-1.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600"
            aria-hidden
          />
          <div className="p-4 sm:p-5">
            <div className="flex items-start gap-3 sm:gap-4">
              <div
                className="flex h-11 w-11 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 text-white shadow-md"
                aria-hidden
              >
                <CalendarDays className="h-5 w-5 sm:h-6 sm:w-6" />
              </div>
              <div className="min-w-0 flex-1 pt-0.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-purple-600">
                  Planning
                </p>
                <h1 className="mt-0.5 text-lg sm:text-xl font-bold tracking-tight text-slate-900">
                  Mon Planning des activités
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                  {filterMode === "organized"
                    ? "Activités que vous avez organisées"
                    : filterMode === "registered"
                    ? "Activités auxquelles vous êtes inscrit"
                    : "Toutes vos activités"}
                </p>
              </div>
            </div>

            {/* Statistiques */}
            <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-xl border border-blue-100 bg-gradient-to-b from-blue-50/90 to-white px-2 py-3 text-center transition hover:border-blue-200 hover:shadow-sm">
                <Star className="mx-auto h-4 w-4 text-amber-500" aria-hidden />
                <p className="mt-1.5 text-xl sm:text-2xl font-bold tabular-nums text-slate-900">
                  {loading ? "—" : totalCount}
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-slate-500 leading-snug">
                  Total
                </p>
              </div>
              <div className="rounded-xl border border-purple-100 bg-gradient-to-b from-purple-50/90 to-white px-2 py-3 text-center transition hover:border-purple-200 hover:shadow-sm">
                <CalendarDays className="mx-auto h-4 w-4 text-purple-500" aria-hidden />
                <p className="mt-1.5 text-xl sm:text-2xl font-bold tabular-nums text-slate-900">
                  {loading ? "—" : thisMonthCount}
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-slate-500 leading-snug">
                  Ce mois
                </p>
              </div>
              <div className="rounded-xl border border-pink-100 bg-gradient-to-b from-pink-50/90 to-white px-2 py-3 text-center transition hover:border-pink-200 hover:shadow-sm">
                <TrendingUp className="mx-auto h-4 w-4 text-emerald-600" aria-hidden />
                <p className="mt-1.5 text-xl sm:text-2xl font-bold tabular-nums text-slate-900">
                  {loading ? "—" : upcomingCount}
                </p>
                <p className="mt-0.5 text-[11px] font-medium text-slate-500 leading-snug">
                  À venir
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Onglets de filtre ───────────────────────────────────────────── */}
        <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-100 p-1.5 flex gap-1">
          {(
            [
              { id: "organized", label: "J'organise", Icon: Star },
              { id: "registered", label: "Inscriptions", Icon: CheckCircle2 },
              { id: "all", label: "Tout", Icon: LayoutList },
            ] as { id: FilterMode; label: string; Icon: React.ElementType }[]
          ).map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => changeFilter(id)}
              className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl px-2 py-2.5 text-xs font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 ${
                filterMode === id
                  ? "bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-sm"
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
              }`}
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* ── Placeholder "Inscriptions" (pas encore implémenté backend) ──── */}
        {filterMode === "registered" && (
          <div className="rounded-2xl bg-white p-10 text-center shadow-md ring-1 ring-slate-100">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100">
              <CheckCircle2 className="h-8 w-8 text-purple-400" />
            </div>
            <p className="font-semibold text-slate-700">Mes inscriptions</p>
            <p className="mt-1.5 text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
              Retrouvez ici toutes les activités auxquelles vous vous êtes
              inscrit, organisées par d'autres collaborateurs.
            </p>
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 ring-1 ring-amber-200">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              Fonctionnalité en cours de développement
            </span>
          </div>
        )}

        {/* ── Mise en page deux colonnes ──────────────────────────────────── */}
        {filterMode !== "registered" && (
        <div className="md:flex md:items-start md:gap-5">

          {/* ── Colonne gauche : mini-calendrier (sticky sur desktop) ─────── */}
          <div className="md:w-[268px] md:shrink-0 mb-4 md:mb-0 md:sticky md:top-[72px]">
            <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-100 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-600" aria-hidden />

              <div className="p-3.5">
                {/* Navigation mois */}
                <div className="flex items-center justify-between mb-3">
                  <button
                    type="button"
                    aria-label="Mois précédent"
                    onClick={() => {
                      setCurrentMonth(
                        new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
                      );
                      setSelectedDate(null);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-sm font-bold text-slate-900 select-none">
                    {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </span>
                  <button
                    type="button"
                    aria-label="Mois suivant"
                    onClick={() => {
                      setCurrentMonth(
                        new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
                      );
                      setSelectedDate(null);
                    }}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>

                {/* Entêtes jours */}
                <div className="grid grid-cols-7 mb-1">
                  {DAY_LETTERS.map((l, i) => (
                    <div
                      key={i}
                      className="text-center text-[11px] font-bold text-slate-400 py-1 select-none"
                    >
                      {l}
                    </div>
                  ))}
                </div>

                {/* Grille des jours */}
                <div className="grid grid-cols-7 gap-0.5">
                  {days.map((day, idx) => {
                    const hasAct = hasActivities(day);
                    const todayDay = isToday(day);
                    const selDay = isSelected(day);

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={!day}
                        onClick={() => handleDateClick(day)}
                        className={[
                          "relative flex flex-col items-center justify-center rounded-lg py-1.5 text-xs font-medium transition-all duration-150 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500",
                          !day ? "invisible pointer-events-none" : "",
                          day && !hasAct && !todayDay && !selDay
                            ? "text-slate-700 hover:bg-slate-50"
                            : "",
                          hasAct && !selDay && !todayDay
                            ? "bg-purple-50 text-purple-700 font-semibold hover:bg-purple-100 ring-1 ring-inset ring-purple-200"
                            : "",
                          todayDay && !selDay
                            ? "bg-blue-50 text-blue-600 font-bold ring-2 ring-inset ring-blue-400"
                            : "",
                          selDay
                            ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-md shadow-purple-300/40 scale-110 z-10"
                            : "",
                        ]
                          .filter(Boolean)
                          .join(" ")}
                      >
                        {day && (
                          <span className="leading-none">{day.getDate()}</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Légende */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-center gap-4 text-[10px] text-slate-400 select-none">
                  <span className="flex items-center gap-1.5">
                    <span className="block h-2 w-2 rounded-full bg-purple-400" />
                    Activité
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="block h-2 w-2 rounded-full bg-blue-400" />
                    Aujourd'hui
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* ── Colonne droite : liste des activités ───────────────────────── */}
          <div ref={listRef} className="flex-1 min-w-0">

            {/* En-tête liste */}
            <div className="flex items-center gap-2 mb-3">
              <h2 className="text-base font-bold text-slate-900 capitalize">
                {selectedDate ? formatDateLong(selectedDate) : "Toutes mes activités"}
              </h2>
              {!loading && displayed.length > 0 && (
                <span className="rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
                  {displayed.length}
                </span>
              )}
              {selectedDate && (
                <button
                  type="button"
                  onClick={clearDate}
                  className="ml-auto text-xs font-medium text-slate-400 hover:text-slate-600 transition"
                >
                  × Effacer
                </button>
              )}
            </div>

            {/* Chargement */}
            {loading && (
              <div className="space-y-2.5">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-[88px] animate-pulse rounded-xl bg-white shadow-sm ring-1 ring-slate-100"
                  />
                ))}
              </div>
            )}

            {/* Erreur */}
            {!loading && error && (
              <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">
                {error}
              </div>
            )}

            {/* État vide */}
            {!loading && !error && displayed.length === 0 && (
              <div className="rounded-2xl bg-white p-8 sm:p-10 text-center shadow-md ring-1 ring-slate-100">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100">
                  <CalendarDays className="h-8 w-8 text-purple-400" />
                </div>
                <p className="font-semibold text-slate-700">
                  {selectedDate
                    ? "Aucune activité ce jour"
                    : "Aucune activité à venir"}
                </p>
                <p className="mt-1 text-sm text-slate-400 max-w-xs mx-auto">
                  {selectedDate
                    ? "Ce jour est libre. Sélectionnez un autre jour ou effacez la sélection."
                    : "Vous n'avez pas encore d'activité planifiée."}
                </p>
                {!selectedDate && (
                  <button
                    type="button"
                    onClick={openCreate}
                    className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-300/30 hover:brightness-105 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                  >
                    <Sparkles className="h-4 w-4" />
                    Créer une activité
                  </button>
                )}
              </div>
            )}

            {/* Activités d'un jour sélectionné (paginées) */}
            {!loading && !error && selectedDate && displayed.length > 0 && (
              <div className="space-y-2">
                {pagedItems.map((a) => (
                  <ActivityCard
                    key={a.id}
                    activity={a}
                    today={today}
                    onClick={() => openActivity(a)}
                    showOrganizerBadge={filterMode === "all"}
                  />
                ))}
              </div>
            )}

            {/* Toutes les activités groupées + paginées */}
            {!loading && !error && !selectedDate && displayed.length > 0 && (
              <div className="space-y-5">
                {/* Séparateur "À venir" si nécessaire */}
                {pagedGroups.some((g) => !g.isPast) && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-emerald-600">
                      À venir
                    </span>
                    <div className="flex-1 h-px bg-emerald-100" />
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 ring-1 ring-emerald-200">
                      {upcomingCount}
                    </span>
                  </div>
                )}

                {pagedGroups.map((group, gIdx) => {
                  const prevGroup = pagedGroups[gIdx - 1];
                  const showHistorySep =
                    group.isPast && prevGroup && !prevGroup.isPast;
                  return (
                    <div key={group.date}>
                      {showHistorySep && (
                        <div className="flex items-center gap-3 mb-5">
                          <div className="flex-1 h-px bg-slate-200" />
                          <span className="text-[11px] font-medium text-slate-400 select-none">
                            Historique
                          </span>
                          <div className="flex-1 h-px bg-slate-200" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() =>
                          !group.isPast
                            ? handleDateClick(parseDate(group.date))
                            : undefined
                        }
                        className={`mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold capitalize transition focus:outline-none ${
                          group.isPast
                            ? "text-slate-400 cursor-default"
                            : "text-purple-600 hover:text-purple-800"
                        }`}
                      >
                        <CalendarDays className="h-3 w-3" />
                        {group.label}
                      </button>
                      <div className="space-y-1.5">
                        {group.items.map((a) => (
                          <ActivityCard
                            key={a.id}
                            activity={a}
                            today={today}
                            onClick={() => openActivity(a)}
                            showOrganizerBadge={filterMode === "all"}
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            {!loading && !error && totalPages > 1 && (
              <div className="mt-5 flex items-center justify-between gap-3">
                <button
                  type="button"
                  disabled={currentPage === 0}
                  onClick={() => { setCurrentPage((p) => p - 1); listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                  Précédent
                </button>
                <span className="text-xs font-medium text-slate-500">
                  Page{" "}
                  <span className="font-bold text-slate-900">{currentPage + 1}</span>
                  {" "}/ {totalPages}
                </span>
                <button
                  type="button"
                  disabled={currentPage >= totalPages - 1}
                  onClick={() => { setCurrentPage((p) => p + 1); listRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                  className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                >
                  Suivant
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
        )} {/* fin filterMode !== 'registered' */}
      </div>

      {/* ── Modal de détail ─────────────────────────────────────────────────── */}
      <ActivityDetailModal
        activity={selectedActivity}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onEdit={(a) => {
          setModalOpen(false);
          setEditActivity(a);
          setEditOpen(true);
        }}
        onDeleted={handleActivityDeleted}
      />

      {/* ── Modal de modification ────────────────────────────────────────────── */}
      <EditActivityModal
        activity={editActivity}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={(updated) => {
          setActivities((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
          setSelectedActivity((prev) => (prev?.id === updated.id ? updated : prev));
        }}
      />
    </div>
  );
}
