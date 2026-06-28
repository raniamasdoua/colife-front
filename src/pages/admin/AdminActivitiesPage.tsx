import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  CalendarCheck,
  CalendarX,
  ChevronDown,
  Filter,
  Loader2,
  MapPin,
  Pencil,
  Search,
  Trash,
  Trash2,
  Users,
  X,
  Eye,
  Building2,
  Car,
  SlidersHorizontal,
} from "lucide-react";

import { AdminLayout } from "../../components/admin/AdminLayout";
import { ActivityMetaBadges } from "../../components/admin/ActivityMetaBadges";
import { EditActivityModal } from "../../components/EditActivityModal";
import { MessageModal } from "../../components/ui/MessageModal";
import { AdminActivityDetailModal } from "../../components/admin/AdminActivityDetailModal";
import { COLIFE_CARD } from "../../components/admin/adminTheme";
import { ApiRequestError } from "../../services/api";
import {
  deleteActivity,
  getAllActivitiesAdmin,
} from "../../services/activityService";
import { listActivityTypes } from "../../services/activityTypeService";
import type { ActivityResponse, ActivityTypeOption } from "../../types/activity";
import { getTypeConfig } from "../../utils/activityDisplay";
import { isActivityNoLongerEditable } from "../../utils/activitySchedule";
import {
  formatActivityLocationMeta,
  formatActivityLocationShort,
} from "../../utils/activityLocationDisplay";

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

function formatTime(hms: string): string {
  return hms.slice(0, 5);
}

function isPast(activity: ActivityResponse): boolean {
  return isActivityNoLongerEditable(activity, new Date());
}

type PeriodFilter = "all" | "upcoming" | "past";

/* ── Dropdown type d'activité ─────────────────────────────────────────────── */

function ActivityTypeSelect({
  value,
  onChange,
  types,
}: {
  value: string;
  onChange: (v: string) => void;
  types: ActivityTypeOption[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const selectedType = types.find((t) => String(t.id) === value) ?? null;
  const selectedCfg = selectedType ? getTypeConfig(selectedType.name) : null;

  return (
    <div ref={ref} className="relative sm:w-52">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 pl-3 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
      >
        <Filter className="h-4 w-4 text-slate-400 shrink-0" />
        {selectedType && selectedCfg ? (
          <>
            <span
              className={`h-2.5 w-2.5 rounded-full bg-gradient-to-br ${selectedCfg.gradient} shrink-0`}
            />
            <span className="flex-1 text-left text-slate-700 truncate">{selectedType.name}</span>
          </>
        ) : (
          <span className="flex-1 text-left text-slate-400">Tous les types</span>
        )}
        <ChevronDown
          className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/70 overflow-hidden max-h-64 overflow-y-auto">
          {/* Option "Tous les types" */}
          <button
            type="button"
            onClick={() => { onChange(""); setOpen(false); }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
              !value
                ? "bg-purple-50 text-purple-700 font-semibold"
                : "text-slate-500 hover:bg-slate-50"
            }`}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-slate-200 shrink-0" />
            <span>Tous les types</span>
            {!value && <span className="ml-auto text-purple-500 text-xs">✓</span>}
          </button>

          {/* Séparateur */}
          <div className="h-px bg-slate-100 mx-2" />

          {types.map((t) => {
            const cfg = getTypeConfig(t.name);
            const selected = String(t.id) === value;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => { onChange(String(t.id)); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                  selected
                    ? "bg-purple-50 text-purple-700 font-semibold"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span
                  className={`h-2.5 w-2.5 rounded-full bg-gradient-to-br ${cfg.gradient} shrink-0`}
                />
                <span className="truncate flex-1 text-left">{t.name}</span>
                {selected && <span className="ml-auto text-purple-500 text-xs shrink-0">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Mini stat card ───────────────────────────────────────────────────────── */

interface MiniStatProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: "blue" | "emerald" | "slate" | "red";
}

function MiniStat({ label, value, icon: Icon, color }: MiniStatProps) {
  const colors = {
    blue: "from-blue-500 to-indigo-600 shadow-blue-500/25",
    emerald: "from-emerald-500 to-teal-600 shadow-emerald-500/25",
    slate: "from-slate-400 to-slate-600 shadow-slate-500/20",
    red: "from-red-400 to-rose-600 shadow-red-500/20",
  };
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-md shadow-slate-200/50 ring-1 ring-slate-200/80">
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${colors[color]} shadow-lg`}
      >
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="min-w-0">
        <p className="text-2xl font-bold text-slate-900 leading-none">{value}</p>
        <p className="mt-0.5 text-xs text-slate-500 truncate">{label}</p>
      </div>
    </div>
  );
}

/* ── Barre de capacité ────────────────────────────────────────────────────── */

function CapacityBar({
  participantCount,
  capacity,
}: {
  participantCount: number;
  capacity: number;
}) {
  const pct = capacity > 0 ? Math.min((participantCount / capacity) * 100, 100) : 0;
  const full = participantCount >= capacity;
  return (
    <div className="flex items-center gap-2 min-w-[80px]">
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${
            full ? "bg-red-500" : pct >= 75 ? "bg-amber-500" : "bg-emerald-500"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs tabular-nums text-slate-600 shrink-0">
        {participantCount}/{capacity}
      </span>
    </div>
  );
}

/* ── Badge statut ─────────────────────────────────────────────────────────── */

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

/* ── Page principale ──────────────────────────────────────────────────────── */

export function AdminActivitiesPage() {
  const [activities, setActivities] = useState<ActivityResponse[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityTypeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [showDeleted, setShowDeleted] = useState(false);
  const [locationFilter, setLocationFilter] = useState<"all" | "on_site" | "off_site">("all");
  const [carpoolFilter, setCarpoolFilter] = useState(false);

  const [detailActivity, setDetailActivity] = useState<ActivityResponse | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const [editTarget, setEditTarget] = useState<ActivityResponse | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<ActivityResponse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [messageModal, setMessageModal] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant?: "default" | "success";
  }>({ open: false, title: "", message: "" });

  /* ── Chargement ── */
  const loadData = useCallback(
    async (withDeleted: boolean) => {
      setListError("");
      setLoading(true);
      try {
        const [acts, types] = await Promise.all([
          getAllActivitiesAdmin(withDeleted),
          listActivityTypes(),
        ]);
        acts.sort((a, b) => {
          if (a.date !== b.date) return b.date.localeCompare(a.date);
          return b.startTime.localeCompare(a.startTime);
        });
        setActivities(acts);
        setActivityTypes(types.sort((a, b) => a.name.localeCompare(b.name, "fr")));
      } catch (e) {
        setListError(
          e instanceof ApiRequestError ? e.message : "Impossible de charger les activités."
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    loadData(showDeleted);
  }, [loadData, showDeleted]);

  /* ── Filtrage ── */
  const now = useMemo(() => new Date(), []);

  const filtered = useMemo(() => {
    let list = activities;

    /* Filtre principal : actives OU supprimées uniquement */
    if (showDeleted) {
      list = list.filter((a) => a.deleted);
    } else {
      list = list.filter((a) => !a.deleted);
      if (periodFilter === "upcoming") {
        list = list.filter((a) => !isActivityNoLongerEditable(a, now));
      } else if (periodFilter === "past") {
        list = list.filter((a) => isActivityNoLongerEditable(a, now));
      }
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.organizerName.toLowerCase().includes(q)
      );
    }
    if (typeFilter) {
      list = list.filter((a) => String(a.activityType.id) === typeFilter);
    }
    if (locationFilter === "on_site") {
      list = list.filter((a) => a.locationType === "ON_SITE");
    } else if (locationFilter === "off_site") {
      list = list.filter((a) => a.locationType === "OFF_SITE");
    }
    if (carpoolFilter) {
      list = list.filter((a) => !!a.carpool);
    }
    return list;
  }, [activities, search, typeFilter, periodFilter, locationFilter, carpoolFilter, now, showDeleted]);

  /* ── Stats ── */
  const activeActivities = useMemo(() => activities.filter((a) => !a.deleted), [activities]);
  const deletedCount = useMemo(() => activities.filter((a) => a.deleted).length, [activities]);
  const upcomingCount = useMemo(
    () => activeActivities.filter((a) => !isActivityNoLongerEditable(a, now)).length,
    [activeActivities, now]
  );
  const pastCount = activeActivities.length - upcomingCount;

  /* ── Handlers ── */
  const openDetail = (a: ActivityResponse) => {
    setDetailActivity(a);
    setDetailOpen(true);
  };

  const openEdit = (a: ActivityResponse) => {
    setEditTarget(a);
    setEditOpen(true);
  };

  const handleEditSuccess = (updated: ActivityResponse) => {
    setActivities((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    setMessageModal({
      open: true,
      title: "Activité modifiée",
      message: `« ${updated.title} » a été mise à jour.`,
      variant: "success",
    });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteActivity(deleteTarget.id);
      if (showDeleted) {
        setActivities((prev) =>
          prev.map((a) => (a.id === deleteTarget.id ? { ...a, deleted: true } : a))
        );
      } else {
        setActivities((prev) => prev.filter((a) => a.id !== deleteTarget.id));
      }
      setDeleteTarget(null);
      setMessageModal({
        open: true,
        title: "Activité supprimée",
        message: "L'activité a été supprimée.",
        variant: "success",
      });
    } catch (e) {
      const msg =
        e instanceof ApiRequestError
          ? e.message
          : "Impossible de supprimer cette activité.";
      setMessageModal({ open: true, title: "Suppression impossible", message: msg });
    } finally {
      setDeleteLoading(false);
    }
  };

  const clearFilters = () => {
    setSearch("");
    setTypeFilter("");
    setPeriodFilter("all");
    setLocationFilter("all");
    setCarpoolFilter(false);
  };

  const hasActiveFilters =
    search.trim() || typeFilter || periodFilter !== "all" || locationFilter !== "all" || carpoolFilter;

  /* ── Rendu ── */
  return (
    <AdminLayout
      title="Activités"
      subtitle="Vue complète et gestion de toutes les activités de la plateforme"
    >
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <MiniStat
            label="Total actives"
            value={activeActivities.length}
            icon={CalendarDays}
            color="blue"
          />
          <MiniStat label="À venir" value={upcomingCount} icon={CalendarCheck} color="emerald" />
          <MiniStat label="Passées" value={pastCount} icon={CalendarX} color="slate" />
          <MiniStat label="Supprimées" value={deletedCount} icon={Trash} color="red" />
        </div>

        {/* ── Filtres ── */}
        <div className="rounded-2xl bg-white shadow-md shadow-slate-200/50 ring-1 ring-slate-200/80 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Recherche */}
            <div className="relative flex-1 min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par titre ou organisateur…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              />
            </div>

            {/* Filtre par type */}
            <ActivityTypeSelect
              value={typeFilter}
              onChange={setTypeFilter}
              types={activityTypes}
            />

            {/* Filtre période (désactivé en mode supprimées) */}
            <div
              className={`flex rounded-xl border border-slate-200 bg-white overflow-hidden shrink-0 transition-opacity ${
                showDeleted ? "opacity-40 pointer-events-none" : ""
              }`}
            >
              {(["all", "upcoming", "past"] as PeriodFilter[]).map((p) => {
                const labels: Record<PeriodFilter, string> = {
                  all: "Toutes",
                  upcoming: "À venir",
                  past: "Passées",
                };
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPeriodFilter(p)}
                    className={`px-3 py-2 text-xs font-semibold transition-colors ${
                      periodFilter === p
                        ? "bg-purple-600 text-white"
                        : "text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {labels[p]}
                  </button>
                );
              })}
            </div>

            {/* Réinitialiser */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
              >
                <X className="h-3.5 w-3.5" />
                Effacer
              </button>
            )}
          </div>

          {/* Sous-filtres : lieu + covoiturage */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-2 mr-1">
              <SlidersHorizontal className="h-3.5 w-3.5 text-purple-500" />
              <span className="text-xs font-semibold text-slate-600">Affiner</span>
            </div>
            <button
              type="button"
              onClick={() => setLocationFilter((prev) => (prev === "on_site" ? "all" : "on_site"))}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${
                locationFilter === "on_site"
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
              }`}
            >
              <Building2 className="h-3 w-3" />
              Sur site
            </button>
            <button
              type="button"
              onClick={() => setLocationFilter((prev) => (prev === "off_site" ? "all" : "off_site"))}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${
                locationFilter === "off_site"
                  ? "bg-blue-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700"
              }`}
            >
              <MapPin className="h-3 w-3" />
              Hors site
            </button>
            <button
              type="button"
              onClick={() => setCarpoolFilter((v) => !v)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${
                carpoolFilter
                  ? "bg-violet-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-violet-50 hover:text-violet-700"
              }`}
            >
              <Car className="h-3 w-3" />
              Covoiturage
            </button>
          </div>

          {/* Toggle activités supprimées */}
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-slate-400">
              {!loading &&
                `${filtered.length} activité${filtered.length !== 1 ? "s" : ""}${hasActiveFilters ? " trouvée" + (filtered.length !== 1 ? "s" : "") : ""}`}
            </p>
            <label className="flex cursor-pointer items-center gap-2 select-none">
              <span className="text-xs font-medium text-slate-600">
                Afficher les supprimées
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={showDeleted}
                onClick={() => {
                  setShowDeleted((v) => {
                    if (!v) setPeriodFilter("all");
                    return !v;
                  });
                }}
                className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 ${
                  showDeleted ? "bg-red-500" : "bg-slate-200"
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                    showDeleted ? "translate-x-4" : "translate-x-1"
                  }`}
                />
              </button>
            </label>
          </div>
        </div>

        {/* ── Erreur ── */}
        {listError && (
          <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            {listError}
          </div>
        )}

        {/* ── Table / liste ── */}
        <div className={COLIFE_CARD}>
          {loading ? (
            <div className="flex items-center justify-center py-20 gap-2 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin text-purple-600" />
              Chargement des activités…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="inline-flex rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 p-4 mb-3 ring-1 ring-purple-100/80">
                <CalendarDays className="h-8 w-8 text-purple-400" />
              </div>
              <p className="text-slate-600 font-medium">
                {hasActiveFilters
                  ? "Aucune activité ne correspond à votre recherche"
                  : "Aucune activité"}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-3 text-sm text-purple-600 hover:underline"
                >
                  Réinitialiser les filtres
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-purple-50/40">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Activité
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Organisateur
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Date
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Lieu
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-36">
                        Places
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-28">
                        Statut
                      </th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-28">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.map((activity) => {
                      const typeConfig = getTypeConfig(activity.activityType.name);
                      const past = isPast(activity);
                      const isDeleted = !!activity.deleted;
                      const canAct = !isDeleted && !past;

                      return (
                        <tr
                          key={activity.id}
                          onClick={() => openDetail(activity)}
                          className={`transition-colors cursor-pointer ${
                            isDeleted
                              ? "bg-red-50/30 hover:bg-red-50/60"
                              : "hover:bg-purple-50/30"
                          }`}
                        >
                          {/* Activité */}
                          <td className="px-5 py-3.5">
                            <div className="flex flex-col gap-1 max-w-xs">
                              <span
                                className={`font-semibold truncate ${
                                  isDeleted
                                    ? "text-slate-400 line-through"
                                    : past
                                    ? "text-slate-500"
                                    : "text-slate-900"
                                }`}
                              >
                                {activity.title}
                              </span>
                              <span
                                className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                  isDeleted ? "opacity-50" : ""
                                } ${typeConfig.badge}`}
                              >
                                {activity.activityType.name}
                              </span>
                              <ActivityMetaBadges activity={activity} />
                            </div>
                          </td>

                          {/* Organisateur */}
                          <td className="px-5 py-3.5">
                            <span
                              className={`text-sm ${
                                isDeleted ? "text-slate-400" : "text-slate-700"
                              }`}
                            >
                              {activity.organizerName}
                            </span>
                          </td>

                          {/* Date */}
                          <td className="px-5 py-3.5">
                            <div className="flex flex-col gap-0.5">
                              <span
                                className={`font-medium text-sm ${
                                  isDeleted ? "text-slate-400" : "text-slate-800"
                                }`}
                              >
                                {formatDate(activity.date)}
                              </span>
                              <span className="text-xs text-slate-400">
                                {formatTime(activity.startTime)} –{" "}
                                {formatTime(activity.endTime)}
                              </span>
                            </div>
                          </td>

                          {/* Lieu */}
                          <td className="px-5 py-3.5 max-w-[180px]">
                            <div className="flex items-start gap-1.5">
                              {activity.locationType === "ON_SITE" ? (
                                <Building2 className="h-3.5 w-3.5 text-emerald-500 mt-0.5 shrink-0" />
                              ) : (
                                <MapPin className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                              )}
                              <div className="min-w-0">
                                <span
                                  className={`text-xs block truncate ${
                                    isDeleted ? "text-slate-400" : "text-slate-600"
                                  }`}
                                >
                                  {formatActivityLocationShort(activity)}
                                </span>
                                {formatActivityLocationMeta(activity) && (
                                  <span className="text-[10px] text-slate-400">
                                    {formatActivityLocationMeta(activity)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Places */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                              <CapacityBar
                                participantCount={activity.participantCount}
                                capacity={activity.capacity}
                              />
                            </div>
                          </td>

                          {/* Statut */}
                          <td className="px-5 py-3.5">
                            <StatusBadge activity={activity} />
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDetail(activity);
                                }}
                                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition"
                                title="Voir le détail"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEdit(activity);
                                }}
                                disabled={!canAct}
                                className="p-2 rounded-lg text-slate-500 hover:bg-purple-50 hover:text-purple-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
                                title={
                                  isDeleted
                                    ? "Activité supprimée"
                                    : past
                                    ? "Activité passée"
                                    : "Modifier"
                                }
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTarget(activity);
                                }}
                                disabled={!canAct}
                                className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition disabled:opacity-30 disabled:cursor-not-allowed"
                                title={
                                  isDeleted
                                    ? "Déjà supprimée"
                                    : past
                                    ? "Activité passée"
                                    : "Supprimer"
                                }
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="lg:hidden divide-y divide-slate-50">
                {filtered.map((activity) => {
                  const typeConfig = getTypeConfig(activity.activityType.name);
                  const past = isPast(activity);
                  const isDeleted = !!activity.deleted;
                  const canAct = !isDeleted && !past;

                  return (
                    <li
                      key={activity.id}
                      onClick={() => openDetail(activity)}
                      className={`px-4 py-4 space-y-3 cursor-pointer transition-colors ${
                        isDeleted ? "bg-red-50/30" : "hover:bg-purple-50/20"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p
                            className={`font-semibold text-sm truncate ${
                              isDeleted
                                ? "text-slate-400 line-through"
                                : past
                                ? "text-slate-500"
                                : "text-slate-900"
                            }`}
                          >
                            {activity.title}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                                isDeleted ? "opacity-50" : ""
                              } ${typeConfig.badge}`}
                            >
                              {activity.activityType.name}
                            </span>
                            <StatusBadge activity={activity} />
                            <ActivityMetaBadges activity={activity} />
                          </div>
                        </div>
                        <div className="flex shrink-0 gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(activity);
                            }}
                            disabled={!canAct}
                            className="p-2 rounded-lg text-slate-500 hover:bg-purple-50 hover:text-purple-700 disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Modifier"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(activity);
                            }}
                            disabled={!canAct}
                            className="p-2 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                            aria-label="Supprimer"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                        <div className="flex items-center gap-1.5">
                          <CalendarDays className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <span>{formatDate(activity.date)}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {activity.locationType === "ON_SITE" ? (
                            <Building2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                          ) : (
                            <MapPin className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                          )}
                          <span className="truncate">{formatActivityLocationShort(activity)}</span>
                        </div>
                        <div className="col-span-2 flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          <CapacityBar
                            participantCount={activity.participantCount}
                            capacity={activity.capacity}
                          />
                        </div>
                      </div>

                      <div className="text-xs text-slate-400">
                        Par{" "}
                        <span className="font-medium text-slate-600">
                          {activity.organizerName}
                        </span>{" "}
                        · {formatTime(activity.startTime)} – {formatTime(activity.endTime)}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* ── Modal de détail ── */}
      <AdminActivityDetailModal
        activity={detailActivity}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setDetailActivity(null);
        }}
        onEdit={openEdit}
        onDelete={setDeleteTarget}
      />

      {/* ── Modal édition ── */}
      <EditActivityModal
        activity={editTarget}
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditTarget(null);
        }}
        onSuccess={handleEditSuccess}
        readOnlyCarpool
      />

      {/* ── Confirm suppression ── */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-[210] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
        >
          <button
            type="button"
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            aria-label="Fermer"
            onClick={() => !deleteLoading && setDeleteTarget(null)}
          />
          <div className={`relative z-10 w-full max-w-sm ${COLIFE_CARD} p-5 shadow-2xl`}>
            <h2 className="text-lg font-bold text-slate-900">Supprimer cette activité ?</h2>
            <p className="mt-2 text-sm text-slate-600">
              <span className="font-semibold">« {deleteTarget.title} »</span> sera supprimée
              et tous les participants seront désinscrits.
            </p>
            <p className="mt-1 text-xs text-slate-400">
              Organisateur : {deleteTarget.organizerName} · {formatDate(deleteTarget.date)}
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={deleteLoading}
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
              >
                {deleteLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Suppression…
                  </span>
                ) : (
                  "Supprimer"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Feedback ── */}
      <MessageModal
        open={messageModal.open}
        title={messageModal.title}
        message={messageModal.message}
        variant={messageModal.variant}
        onClose={() => setMessageModal((m) => ({ ...m, open: false }))}
      />
    </AdminLayout>
  );
}
