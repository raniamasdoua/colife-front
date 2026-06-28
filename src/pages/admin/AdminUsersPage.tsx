import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  Filter,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Search,
  Shield,
  User,
  UserCheck,
  Users,
  X,
} from "lucide-react";

import { AdminLayout } from "../../components/admin/AdminLayout";
import { COLIFE_CARD, COLIFE_SECTION_LABEL } from "../../components/admin/adminTheme";
import { ApiRequestError } from "../../services/api";
import { getAllUsers } from "../../services/userService";
import type { UserProfile } from "../../types/auth";
import { getInitials } from "../../utils/userDisplay";

/* ── Helpers ──────────────────────────────────────────────────────────────── */

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

type RoleFilter = "all" | "ADMIN" | "COLLABORATOR";

/* ── Mini stat card ───────────────────────────────────────────────────────── */

interface MiniStatProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: "blue" | "purple" | "emerald";
}

function MiniStat({ label, value, icon: Icon, color }: MiniStatProps) {
  const colors = {
    blue: "from-blue-500 to-indigo-600 shadow-blue-500/25",
    purple: "from-purple-500 to-violet-600 shadow-purple-500/25",
    emerald: "from-emerald-500 to-teal-600 shadow-emerald-500/25",
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

/* ── Badge rôle ───────────────────────────────────────────────────────────── */

function RoleBadge({ role }: { role: "ADMIN" | "COLLABORATOR" }) {
  if (role === "ADMIN") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-purple-100 text-purple-700">
        <Shield className="h-3 w-3" />
        Admin
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700">
      <UserCheck className="h-3 w-3" />
      Collaborateur
    </span>
  );
}

/* ── Avatar initiales ─────────────────────────────────────────────────────── */

function UserAvatar({ user }: { user: UserProfile }) {
  const initials = getInitials(user.firstName, user.lastName);
  const isAdmin = user.role === "ADMIN";
  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
        isAdmin
          ? "bg-gradient-to-br from-purple-500 to-violet-600"
          : "bg-gradient-to-br from-blue-500 to-indigo-500"
      }`}
    >
      {initials}
    </div>
  );
}

/* ── Dropdown filtre rôle ─────────────────────────────────────────────────── */

function RoleSelect({
  value,
  onChange,
}: {
  value: RoleFilter;
  onChange: (v: RoleFilter) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const labels: Record<RoleFilter, string> = {
    all: "Tous les rôles",
    ADMIN: "Admins",
    COLLABORATOR: "Collaborateurs",
  };

  return (
    <div ref={ref} className="relative sm:w-48">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 pl-3 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
      >
        <Filter className="h-4 w-4 text-slate-400 shrink-0" />
        <span className={`flex-1 text-left ${value === "all" ? "text-slate-400" : "text-slate-700"}`}>
          {labels[value]}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 shrink-0 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-xl border border-slate-200 bg-white shadow-lg shadow-slate-200/70 overflow-hidden">
          {(["all", "ADMIN", "COLLABORATOR"] as RoleFilter[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => { onChange(r); setOpen(false); }}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm transition-colors ${
                value === r
                  ? "bg-purple-50 text-purple-700 font-semibold"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {r === "all" && <span className="h-2.5 w-2.5 rounded-full bg-slate-200 shrink-0" />}
              {r === "ADMIN" && <Shield className="h-3.5 w-3.5 text-purple-500 shrink-0" />}
              {r === "COLLABORATOR" && <UserCheck className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
              <span className="flex-1 text-left">{labels[r]}</span>
              {value === r && <span className="ml-auto text-purple-500 text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Modal détail utilisateur ─────────────────────────────────────────────── */

function UserDetailModal({
  user,
  open,
  onClose,
}: {
  user: UserProfile | null;
  open: boolean;
  onClose: () => void;
}) {
  if (!open || !user) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        aria-label="Fermer"
        onClick={onClose}
      />
      <div className={`relative z-10 w-full max-w-md ${COLIFE_CARD} p-6 shadow-2xl`}>
        {/* En-tête */}
        <div className="flex items-start justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div
              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-xl font-bold text-white ${
                user.role === "ADMIN"
                  ? "bg-gradient-to-br from-purple-500 to-violet-600"
                  : "bg-gradient-to-br from-blue-500 to-indigo-500"
              }`}
            >
              {getInitials(user.firstName, user.lastName)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                {user.firstName} {user.lastName}
              </h2>
              <RoleBadge role={user.role} />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Champs */}
        <dl className="space-y-3">
          <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3">
            <Mail className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <dt className={`${COLIFE_SECTION_LABEL} text-[10px]`}>Email</dt>
              <dd className="text-sm text-slate-800 font-medium truncate">{user.email}</dd>
            </div>
          </div>

          {user.phone && (
            <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <Phone className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <dt className={`${COLIFE_SECTION_LABEL} text-[10px]`}>Téléphone</dt>
                <dd className="text-sm text-slate-800">{user.phone}</dd>
              </div>
            </div>
          )}

          {user.address && (
            <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <dt className={`${COLIFE_SECTION_LABEL} text-[10px]`}>Adresse</dt>
                <dd className="text-sm text-slate-800">{user.address}</dd>
              </div>
            </div>
          )}

          {user.bio && (
            <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <User className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <dt className={`${COLIFE_SECTION_LABEL} text-[10px]`}>Bio</dt>
                <dd className="text-sm text-slate-700 leading-relaxed">{user.bio}</dd>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 rounded-xl bg-slate-50 px-4 py-3">
            <CalendarDays className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
            <div className="min-w-0">
              <dt className={`${COLIFE_SECTION_LABEL} text-[10px]`}>Membre depuis</dt>
              <dd className="text-sm text-slate-800">{formatDate(user.createdAt)}</dd>
            </div>
          </div>
        </dl>
      </div>
    </div>
  );
}

/* ── Page principale ──────────────────────────────────────────────────────── */

export function AdminUsersPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");

  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  /* ── Chargement ── */
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setListError("");
    getAllUsers()
      .then((data) => {
        if (!cancelled) setUsers(data);
      })
      .catch((e) => {
        if (!cancelled)
          setListError(
            e instanceof ApiRequestError ? e.message : "Impossible de charger les utilisateurs."
          );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  /* ── Stats ── */
  const adminCount = useMemo(() => users.filter((u) => u.role === "ADMIN").length, [users]);
  const collaboratorCount = useMemo(
    () => users.filter((u) => u.role === "COLLABORATOR").length,
    [users]
  );

  /* ── Filtrage ── */
  const filtered = useMemo(() => {
    let list = users;
    if (roleFilter !== "all") {
      list = list.filter((u) => u.role === roleFilter);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (u) =>
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, search, roleFilter]);

  const hasActiveFilters = search.trim() || roleFilter !== "all";

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("all");
  };

  const openDetail = (u: UserProfile) => {
    setSelectedUser(u);
    setDetailOpen(true);
  };

  /* ── Rendu ── */
  return (
    <AdminLayout
      title="Utilisateurs"
      subtitle="Gestion et consultation de tous les membres de la plateforme"
    >
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <MiniStat label="Total membres" value={users.length} icon={Users} color="blue" />
          <MiniStat label="Administrateurs" value={adminCount} icon={Shield} color="purple" />
          <MiniStat label="Collaborateurs" value={collaboratorCount} icon={UserCheck} color="emerald" />
        </div>

        {/* ── Filtres ── */}
        <div className="rounded-2xl bg-white shadow-md shadow-slate-200/50 ring-1 ring-slate-200/80 p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Recherche */}
            <div className="relative flex-1 min-w-0">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Rechercher par nom ou email…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              />
            </div>

            {/* Filtre rôle */}
            <RoleSelect value={roleFilter} onChange={setRoleFilter} />

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

          <div className="mt-3">
            <p className="text-xs text-slate-400">
              {!loading &&
                `${filtered.length} utilisateur${filtered.length !== 1 ? "s" : ""}${
                  hasActiveFilters ? ` trouvé${filtered.length !== 1 ? "s" : ""}` : ""
                }`}
            </p>
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
              Chargement des utilisateurs…
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="inline-flex rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 p-4 mb-3 ring-1 ring-purple-100/80">
                <Users className="h-8 w-8 text-purple-400" />
              </div>
              <p className="text-slate-600 font-medium">
                {hasActiveFilters
                  ? "Aucun utilisateur ne correspond à votre recherche"
                  : "Aucun utilisateur"}
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
              {/* Table desktop */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-purple-50/40">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Utilisateur
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        Email
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-36">
                        Rôle
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-32">
                        Téléphone
                      </th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide w-36">
                        Membre depuis
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filtered.map((user) => (
                      <tr
                        key={user.id}
                        onClick={() => openDetail(user)}
                        className="hover:bg-purple-50/30 transition-colors cursor-pointer"
                      >
                        {/* Utilisateur */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <UserAvatar user={user} />
                            <span className="font-semibold text-slate-900">
                              {user.firstName} {user.lastName}
                            </span>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-5 py-3.5">
                          <span className="text-slate-600 text-sm">{user.email}</span>
                        </td>

                        {/* Rôle */}
                        <td className="px-5 py-3.5">
                          <RoleBadge role={user.role} />
                        </td>

                        {/* Téléphone */}
                        <td className="px-5 py-3.5">
                          {user.phone ? (
                            <span className="text-sm text-slate-600">{user.phone}</span>
                          ) : (
                            <span className="text-xs text-slate-300 italic">—</span>
                          )}
                        </td>

                        {/* Membre depuis */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1.5 text-sm text-slate-500">
                            <CalendarDays className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                            {formatDate(user.createdAt)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Cards mobile */}
              <ul className="lg:hidden divide-y divide-slate-50">
                {filtered.map((user) => (
                  <li
                    key={user.id}
                    onClick={() => openDetail(user)}
                    className="px-4 py-4 flex items-center gap-3 cursor-pointer hover:bg-purple-50/20 transition-colors"
                  >
                    <UserAvatar user={user} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm text-slate-900 truncate">
                          {user.firstName} {user.lastName}
                        </p>
                        <RoleBadge role={user.role} />
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Membre depuis {formatDate(user.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>

      {/* ── Modal détail ── */}
      <UserDetailModal
        user={selectedUser}
        open={detailOpen}
        onClose={() => {
          setDetailOpen(false);
          setSelectedUser(null);
        }}
      />
    </AdminLayout>
  );
}
