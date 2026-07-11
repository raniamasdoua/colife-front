import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  CalendarDays,
  Car,
  Clock,
  MapPin,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Star,
  TrendingUp,
  Sparkles,
  CheckCircle2,
  LayoutList,
  X as XIcon,
} from "lucide-react";

type FilterMode = "organized" | "registered" | "all";
import { CollaboratorLayout } from "../components/layout/CollaboratorLayout";
import { getMyActivities, getRegisteredActivities } from "../services/activityService";
import { getTypeConfig } from "../utils/activityDisplay";
import { useCreateActivityModal } from "../context/CreateActivityModalContext";
import { ActivityDetailModal } from "../components/home/ActivityDetailModal";
import { EditActivityModal } from "../components/EditActivityModal";
import { MessageModal } from "../components/ui/MessageModal";
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
  const isOnSite = activity.locationType === "ON_SITE";

  const locationLabel = isOnSite
    ? (activity.location.room ?? "Sur site")
    : [activity.location.street, activity.location.city].filter(Boolean).join(", ") || "—";

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
        {/* Titre + type */}
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
            {isOnSite
              ? <Building2 className="h-3 w-3 shrink-0 text-emerald-500" />
              : <MapPin className="h-3 w-3 shrink-0 text-slate-400" />}
            <span className="line-clamp-1">{locationLabel}</span>
          </span>
        </div>

        {/* Bas : badges de contexte + statut */}
        <div className="flex items-center justify-between gap-2 mt-2">
          <div className="flex items-center gap-1.5 flex-wrap min-w-0">
            {/* Badge lieu */}
            {isOnSite ? (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-700 ring-1 ring-emerald-100 whitespace-nowrap">
                <Building2 className="h-2.5 w-2.5" />
                Sur site
              </span>
            ) : (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-1.5 py-0.5 text-[9px] font-semibold text-blue-700 ring-1 ring-blue-100 whitespace-nowrap">
                <MapPin className="h-2.5 w-2.5" />
                Hors site
              </span>
            )}
            {/* Badge covoiturage */}
            {activity.carpool && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-violet-50 px-1.5 py-0.5 text-[9px] font-semibold text-violet-700 ring-1 ring-violet-100 whitespace-nowrap">
                <Car className="h-2.5 w-2.5" />
                Covoiturage
              </span>
            )}
          </div>
          {isPast ? (
            <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-400">
              Passé
            </span>
          ) : (
            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 ring-1 ring-emerald-200">
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
  const [organizedActivities, setOrganizedActivities] = useState<ActivityResponse[]>([]);
  const [registeredActivities, setRegisteredActivities] = useState<ActivityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [currentPage, setCurrentPage] = useState(0);
  const [filterMode, setFilterMode] = useState<FilterMode>("organized");
  const [locationFilter, setLocationFilter] = useState<"all" | "on_site" | "off_site">("all");
  const [carpoolFilter, setCarpoolFilter] = useState(false);
  const [typeFilter, setTypeFilter] = useState<Set<string>>(() => new Set());
  const [selectedActivity, setSelectedActivity] = useState<ActivityResponse | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editActivity, setEditActivity] = useState<ActivityResponse | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const [unsubscribeErrorMessage, setUnsubscribeErrorMessage] = useState<string | null>(null);
  const [unsubscribeSuccessMessage, setUnsubscribeSuccessMessage] = useState<string | null>(null);

  const listRef = useRef<HTMLDivElement>(null);
  const { openCreate } = useCreateActivityModal();

  const handleUnsubscribedFromDetail = useCallback((updated: ActivityResponse) => {
    setUnsubscribeErrorMessage(null);
    setUnsubscribeSuccessMessage(
      "Votre désinscription a bien été enregistrée. L'activité ne figure plus dans vos inscriptions."
    );
    setRegisteredActivities((prev) => prev.filter((a) => a.id !== updated.id));
    setSelectedActivity(null);
    setModalOpen(false);
  }, []);

  const handleActivityDeleted = useCallback((id: number) => {
    setOrganizedActivities((prev) => prev.filter((a) => a.id !== id));
    setRegisteredActivities((prev) => prev.filter((a) => a.id !== id));
    setSelectedActivity(null);
    setModalOpen(false);
    setEditActivity((e) => (e?.id === id ? null : e));
  }, []);

  const organizedIdSet = useMemo(
    () => new Set(organizedActivities.map((a) => a.id)),
    [organizedActivities]
  );

  const activities = useMemo(() => {
    if (filterMode === "organized") return organizedActivities;
    if (filterMode === "registered") return registeredActivities;
    const map = new Map<number, ActivityResponse>();
    organizedActivities.forEach((a) => map.set(a.id, a));
    registeredActivities.forEach((a) => map.set(a.id, a));
    return Array.from(map.values());
  }, [filterMode, organizedActivities, registeredActivities]);

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
        const [organized, registered] = await Promise.all([
          getMyActivities(),
          getRegisteredActivities(),
        ]);
        if (!cancelled) {
          setOrganizedActivities(organized);
          setRegisteredActivities(registered);
        }
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

  useEffect(() => {
    const handler = (e: Event) => {
      const newActivity = (e as CustomEvent<ActivityResponse>).detail;
      setOrganizedActivities((prev) => {
        if (prev.some((a) => a.id === newActivity.id)) return prev;
        return [...prev, newActivity].sort(
          (a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime)
        );
      });
    };
    window.addEventListener("colife:activity-created", handler);
    return () => window.removeEventListener("colife:activity-created", handler);
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

  const toggleLocationFilter = (loc: "on_site" | "off_site") => {
    setLocationFilter((prev) => (prev === loc ? "all" : loc));
    setCurrentPage(0);
  };

  const toggleCarpoolFilter = () => {
    setCarpoolFilter((v) => !v);
    setCurrentPage(0);
  };

  const resetSubFilters = () => {
    setLocationFilter("all");
    setCarpoolFilter(false);
    setTypeFilter(new Set());
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

  /* ── Sous-filtres (lieu + covoiturage + type) ──────────────────────────── */

  /** Types uniques présents dans la vue courante (selon filterMode), triés. */
  const availableTypes = useMemo(() => {
    const names = new Set(activities.map((a) => a.activityType.name));
    return Array.from(names).sort((a, b) => a.localeCompare(b, "fr"));
  }, [activities]);

  const filteredActivities = useMemo(() => {
    return activities.filter((a) => {
      if (locationFilter === "on_site" && a.locationType !== "ON_SITE") return false;
      if (locationFilter === "off_site" && a.locationType !== "OFF_SITE") return false;
      if (carpoolFilter && !a.carpool) return false;
      if (typeFilter.size > 0 && !typeFilter.has(a.activityType.name)) return false;
      return true;
    });
  }, [activities, locationFilter, carpoolFilter, typeFilter]);

  const hasActiveSubFilters = locationFilter !== "all" || carpoolFilter || typeFilter.size > 0;

  /* ── Activités affichées ────────────────────────────────────────────────── */

  const upcoming = filteredActivities
    .filter((a) => !isActivityPast(a, today))
    .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime));

  const past = filteredActivities
    .filter((a) => isActivityPast(a, today))
    .sort((a, b) => b.date.localeCompare(a.date) || a.startTime.localeCompare(b.startTime));

  /* Sans date sélectionnée : uniquement les activités à venir.
     Avec date sélectionnée : toutes celles du jour (les passées sont grisées), filtrées. */
  const displayed = selectedDate
    ? filteredActivities
        .filter((a) => isSameDay(parseDate(a.date), selectedDate))
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
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
    <CollaboratorLayout>
      <div className="pb-6 space-y-4">

        {/* ── Onglets de filtre (toujours en haut) ──────────────────────── */}
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

        {/* ── Disposition : calendrier (gauche) + agenda (droite) ─────────── */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:gap-6">

          {/* ── Calendrier mis en avant ──────────────────────────────────── */}
          <div className="lg:w-[52%] lg:shrink-0 lg:sticky lg:top-20">
            <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-100 overflow-hidden">
              <div className="h-1.5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" aria-hidden />

              {/* En-tête : mois + navigation */}
              <div className="flex items-center justify-between px-5 pt-4 pb-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-purple-600">
                    {filterMode === "organized" ? "J'organise" : filterMode === "registered" ? "Inscriptions" : "Toutes mes activités"}
                  </p>
                  <h1 className="mt-0.5 text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {MONTH_NAMES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                  </h1>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Mois précédent"
                    onClick={() => {
                      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
                      setSelectedDate(null);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    aria-label="Mois suivant"
                    onClick={() => {
                      setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
                      setSelectedDate(null);
                    }}
                    className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Bande de stats */}
              <div className="mx-4 mb-3 grid grid-cols-3 gap-2">
                <div className="rounded-xl border border-blue-100 bg-blue-50/60 px-2 py-2.5 text-center">
                  <Star className="mx-auto h-3.5 w-3.5 text-amber-500 mb-1" aria-hidden />
                  <p className="text-lg font-bold tabular-nums text-slate-900">{loading ? "—" : totalCount}</p>
                  <p className="text-[10px] font-medium text-slate-500 leading-tight">Total</p>
                </div>
                <div className="rounded-xl border border-purple-100 bg-purple-50/60 px-2 py-2.5 text-center">
                  <CalendarDays className="mx-auto h-3.5 w-3.5 text-purple-500 mb-1" aria-hidden />
                  <p className="text-lg font-bold tabular-nums text-slate-900">{loading ? "—" : thisMonthCount}</p>
                  <p className="text-[10px] font-medium text-slate-500 leading-tight">Ce mois</p>
                </div>
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-2 py-2.5 text-center">
                  <TrendingUp className="mx-auto h-3.5 w-3.5 text-emerald-600 mb-1" aria-hidden />
                  <p className="text-lg font-bold tabular-nums text-slate-900">{loading ? "—" : upcomingCount}</p>
                  <p className="text-[10px] font-medium text-slate-500 leading-tight">À venir</p>
                </div>
              </div>

              {/* Grille calendrier */}
              <div className="px-4 pb-4">
                {/* En-têtes jours */}
                <div className="grid grid-cols-7 mb-1.5">
                  {DAY_LETTERS.map((l, i) => (
                    <div key={i} className="text-center text-[11px] font-bold text-slate-400 py-1 select-none">
                      {l}
                    </div>
                  ))}
                </div>

                {/* Cellules (plus grandes) */}
                <div className="grid grid-cols-7 gap-1">
                  {days.map((day, idx) => {
                    const hasAct = hasActivities(day);
                    const todayDay = isToday(day);
                    const selDay = isSelected(day);
                    const actCount = day ? getActivitiesForDate(day).length : 0;

                    return (
                      <button
                        key={idx}
                        type="button"
                        disabled={!day}
                        onClick={() => handleDateClick(day)}
                        className={[
                          "relative flex flex-col items-center justify-center rounded-xl h-10 sm:h-11 text-xs font-medium transition-all duration-150 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500",
                          !day ? "invisible pointer-events-none" : "",
                          day && !hasAct && !todayDay && !selDay ? "text-slate-700 hover:bg-slate-50" : "",
                          hasAct && !selDay && !todayDay ? "bg-purple-50 text-purple-700 font-semibold hover:bg-purple-100 ring-1 ring-inset ring-purple-200" : "",
                          todayDay && !selDay ? "bg-blue-50 text-blue-600 font-bold ring-2 ring-inset ring-blue-400" : "",
                          selDay ? "bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-md shadow-purple-300/40 scale-110 z-10" : "",
                        ].filter(Boolean).join(" ")}
                      >
                        {day && (
                          <>
                            <span className="leading-none text-sm">{day.getDate()}</span>
                            {hasAct && !selDay && (
                              <span className="mt-0.5 h-1 w-1 rounded-full bg-current opacity-60" />
                            )}
                            {selDay && actCount > 0 && (
                              <span className="mt-0.5 text-[9px] font-bold text-white/80 leading-none">{actCount}</span>
                            )}
                          </>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Légende */}
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-center gap-5 text-[10px] text-slate-400 select-none">
                  <span className="flex items-center gap-1.5">
                    <span className="block h-2 w-2 rounded-full bg-purple-400" />
                    Activité
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="block h-2 w-2 rounded-full bg-blue-400" />
                    Aujourd'hui
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="block h-2.5 w-2.5 rounded-full bg-gradient-to-br from-blue-500 to-purple-600" />
                    Sélectionné
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ── Agenda (droite) ─────────────────────────────────────────── */}
          <div ref={listRef} className="flex-1 min-w-0 space-y-3">

            {/* Sous-filtres */}
            <div className="rounded-2xl bg-white shadow-md ring-1 ring-slate-200/80 overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" aria-hidden />
              <div className="flex items-center justify-between gap-3 px-4 pt-3 pb-2">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-3.5 w-3.5 text-purple-500" />
                  <span className="text-xs font-bold text-slate-700 tracking-wide">Filtres</span>
                  {hasActiveSubFilters && (
                    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                      {[locationFilter !== "all", carpoolFilter, typeFilter.size > 0].filter(Boolean).length} actif{[locationFilter !== "all", carpoolFilter, typeFilter.size > 0].filter(Boolean).length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
                {hasActiveSubFilters && (
                  <button
                    type="button"
                    onClick={resetSubFilters}
                    className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold text-slate-500 bg-slate-100 hover:bg-slate-200 transition"
                  >
                    <XIcon className="h-3 w-3" />
                    Tout effacer
                  </button>
                )}
              </div>

              <div className="px-4 pb-3 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-14 shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">Lieu</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => toggleLocationFilter("on_site")}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${locationFilter === "on_site" ? "bg-emerald-500 text-white shadow-sm shadow-emerald-200" : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"}`}
                    >
                      <Building2 className="h-3 w-3" />
                      Sur site
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleLocationFilter("off_site")}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${locationFilter === "off_site" ? "bg-blue-500 text-white shadow-sm shadow-blue-200" : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700"}`}
                    >
                      <MapPin className="h-3 w-3" />
                      Hors site
                    </button>
                    <div className="h-5 w-px bg-slate-200 mx-1" />
                    <button
                      type="button"
                      onClick={toggleCarpoolFilter}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${carpoolFilter ? "bg-violet-500 text-white shadow-sm shadow-violet-200" : "bg-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-700"}`}
                    >
                      <Car className="h-3 w-3" />
                      Covoiturage
                    </button>
                  </div>
                </div>

                {availableTypes.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="w-14 shrink-0 text-[10px] font-bold uppercase tracking-wider text-slate-400">Type</span>
                    <div className="relative flex-1 min-w-0">
                      <select
                        value={typeFilter.size === 1 ? Array.from(typeFilter)[0] : ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setTypeFilter(val ? new Set([val]) : new Set());
                          setCurrentPage(0);
                        }}
                        className={`w-full appearance-none rounded-lg border py-1.5 pl-3 pr-8 text-[11px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${typeFilter.size > 0 ? "border-purple-300 bg-purple-50 text-purple-800" : "border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white"}`}
                      >
                        <option value="">Tous les types</option>
                        {availableTypes.map((typeName) => (
                          <option key={typeName} value={typeName}>{typeName}</option>
                        ))}
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* En-tête liste */}
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-900 capitalize">
                {selectedDate
                  ? formatDateLong(selectedDate)
                  : filterMode === "registered"
                    ? "Mes inscriptions"
                    : filterMode === "organized"
                      ? "Mes activités"
                      : "Tout mon planning"}
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
                  <div key={i} className="h-[88px] animate-pulse rounded-xl bg-white shadow-sm ring-1 ring-slate-100" />
                ))}
              </div>
            )}

            {/* Erreur */}
            {!loading && error && (
              <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-200">{error}</div>
            )}

            {/* État vide */}
            {!loading && !error && displayed.length === 0 && (
              <div className="rounded-2xl bg-white p-8 sm:p-10 text-center shadow-md ring-1 ring-slate-100">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-100 to-purple-100">
                  <CalendarDays className="h-8 w-8 text-purple-400" />
                </div>
                <p className="font-semibold text-slate-700">
                  {hasActiveSubFilters ? "Aucune activité ne correspond aux filtres" : selectedDate ? "Aucune activité ce jour" : filterMode === "registered" ? "Aucune inscription à venir" : "Aucune activité à venir"}
                </p>
                <p className="mt-1 text-sm text-slate-400 max-w-xs mx-auto">
                  {hasActiveSubFilters ? "Essayez de modifier ou supprimer les filtres actifs." : selectedDate ? "Ce jour est libre. Sélectionnez un autre jour ou effacez la sélection." : filterMode === "registered" ? "Explorez les activités publiées par vos collègues et inscrivez-vous." : "Vous n'avez pas encore d'activité planifiée."}
                </p>
                {!selectedDate && filterMode === "registered" && (
                  <Link to="/explore" className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-300/30 hover:brightness-105 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500">
                    <Sparkles className="h-4 w-4" />
                    Explorer les activités
                  </Link>
                )}
                {!selectedDate && filterMode !== "registered" && (
                  <button type="button" onClick={openCreate} className="mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-purple-300/30 hover:brightness-105 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500">
                    <Sparkles className="h-4 w-4" />
                    Créer une activité
                  </button>
                )}
              </div>
            )}

            {/* Activités d'un jour sélectionné */}
            {!loading && !error && selectedDate && displayed.length > 0 && (
              <div className="space-y-2">
                {pagedItems.map((a) => (
                  <ActivityCard key={a.id} activity={a} today={today} onClick={() => openActivity(a)} showOrganizerBadge={filterMode === "all" && organizedIdSet.has(a.id)} />
                ))}
              </div>
            )}

            {/* Toutes les activités groupées */}
            {!loading && !error && !selectedDate && displayed.length > 0 && (
              <div className="space-y-5">
                {pagedGroups.some((g) => !g.isPast) && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-emerald-600">À venir</span>
                    <div className="flex-1 h-px bg-emerald-100" />
                    <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 ring-1 ring-emerald-200">{upcomingCount}</span>
                  </div>
                )}
                {pagedGroups.map((group, gIdx) => {
                  const prevGroup = pagedGroups[gIdx - 1];
                  const showHistorySep = group.isPast && prevGroup && !prevGroup.isPast;
                  return (
                    <div key={group.date}>
                      {showHistorySep && (
                        <div className="flex items-center gap-3 mb-5">
                          <div className="flex-1 h-px bg-slate-200" />
                          <span className="text-[11px] font-medium text-slate-400 select-none">Historique</span>
                          <div className="flex-1 h-px bg-slate-200" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => !group.isPast ? handleDateClick(parseDate(group.date)) : undefined}
                        className={`mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold capitalize transition focus:outline-none ${group.isPast ? "text-slate-400 cursor-default" : "text-purple-600 hover:text-purple-800"}`}
                      >
                        <CalendarDays className="h-3 w-3" />
                        {group.label}
                      </button>
                      <div className="space-y-1.5">
                        {group.items.map((a) => (
                          <ActivityCard key={a.id} activity={a} today={today} onClick={() => openActivity(a)} showOrganizerBadge={filterMode === "all" && organizedIdSet.has(a.id)} />
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
                  Page <span className="font-bold text-slate-900">{currentPage + 1}</span> / {totalPages}
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
      </div>

      {/* ── Modal de détail ─────────────────────────────────────────────────── */}
      <ActivityDetailModal
        activity={selectedActivity}
        open={modalOpen}
        onOpenChange={setModalOpen}
        mode={
          selectedActivity && organizedIdSet.has(selectedActivity.id)
            ? "organizer"
            : "available"
        }
        isSubscribed={
          !!selectedActivity &&
          registeredActivities.some((a) => a.id === selectedActivity.id)
        }
        onEdit={(a) => {
          setModalOpen(false);
          setEditActivity(a);
          setEditOpen(true);
        }}
        onDeleted={handleActivityDeleted}
        onUnsubscribed={handleUnsubscribedFromDetail}
        onUnsubscribeError={setUnsubscribeErrorMessage}
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

      {/* ── Modal de modification ────────────────────────────────────────────── */}
      <EditActivityModal
        activity={editActivity}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={(updated) => {
          setOrganizedActivities((prev) =>
            prev.map((a) => (a.id === updated.id ? updated : a))
          );
          setRegisteredActivities((prev) =>
            prev.map((a) => (a.id === updated.id ? updated : a))
          );
          setSelectedActivity((prev) => (prev?.id === updated.id ? updated : prev));
        }}
      />
    </CollaboratorLayout>
  );
}
