import { Link } from "react-router-dom";
import { PanelLeftClose, PanelLeft, Shield } from "lucide-react";
import type { UserProfile } from "../../types/auth";

type AdminTopBarProps = {
  user: UserProfile | null;
  title: string;
  subtitle: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
};

export function AdminTopBar({
  user,
  title,
  subtitle,
  sidebarOpen,
  onToggleSidebar,
}: AdminTopBarProps) {
  const initials = user
    ? `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
    : "A";

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b border-slate-200/90 bg-white/95 px-3 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/85 sm:gap-4 sm:px-5">
      <button
        type="button"
        onClick={onToggleSidebar}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2"
        aria-expanded={sidebarOpen}
        aria-controls="admin-sidebar"
        title={sidebarOpen ? "Masquer le menu" : "Afficher le menu"}
      >
        {sidebarOpen ? (
          <PanelLeftClose className="h-5 w-5" aria-hidden />
        ) : (
          <PanelLeft className="h-5 w-5" aria-hidden />
        )}
      </button>

      <div className="hidden h-8 w-px shrink-0 bg-slate-200 sm:block" aria-hidden />

      <div className="flex shrink-0 items-center gap-2">
        <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-lg font-bold tracking-tight text-transparent">
          CoLife
        </span>
        <span className="rounded-md border border-purple-100 bg-purple-50 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-purple-700">
          Admin
        </span>
      </div>

      <div className="min-w-0 flex-1 px-1 sm:px-4">
        <h1 className="truncate text-sm font-bold text-slate-900 sm:text-base">{title}</h1>
        <p className="hidden truncate text-xs text-slate-500 sm:block">{subtitle}</p>
      </div>

      <Link
        to="/admin/profile"
        className="flex shrink-0 items-center gap-2 rounded-xl px-2 py-1.5 text-slate-700 ring-1 ring-slate-200/90 transition hover:bg-slate-50 hover:ring-slate-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 sm:gap-3 sm:px-3"
        title="Voir mon profil"
      >
        <div className="hidden text-right sm:block">
          <p className="text-sm font-semibold leading-none text-slate-900">
            {user ? `${user.firstName} ${user.lastName}` : "Administrateur"}
          </p>
          <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-purple-600">
            <Shield className="h-3 w-3" aria-hidden />
            Admin
          </span>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 text-sm font-bold text-white shadow-md ring-2 ring-white">
          {initials}
        </div>
      </Link>
    </header>
  );
}
