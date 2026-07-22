import { NavLink } from "react-router-dom";
import { PanelLeftClose, PanelLeft, PlusCircle, Bell } from "lucide-react";
import type { UserProfile } from "../../types/auth";
import { useCreateActivityModal } from "../../context/CreateActivityModalContext";
import { getInitials } from "../../utils/userDisplay";

type CollaboratorTopBarProps = {
  user: UserProfile | null;
  title: string;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
};

export function CollaboratorTopBar({
  user,
  title,
  sidebarOpen,
  onToggleSidebar,
}: CollaboratorTopBarProps) {
  const { openCreate, isCreateModalOpen } = useCreateActivityModal();
  const initials = user ? getInitials(user.firstName, user.lastName) : "?";

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center gap-2 border-b border-slate-200/90 bg-white/95 px-3 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/85 sm:gap-4 sm:px-5">
      <button
        type="button"
        onClick={onToggleSidebar}
        aria-expanded={sidebarOpen}
        aria-controls="collab-sidebar"
        aria-label={sidebarOpen ? "Masquer le menu" : "Afficher le menu"}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2"
      >
        {sidebarOpen ? (
          <PanelLeftClose className="h-5 w-5" aria-hidden />
        ) : (
          <PanelLeft className="h-5 w-5" aria-hidden />
        )}
      </button>

      <div className="hidden h-8 w-px shrink-0 bg-slate-200 sm:block" aria-hidden />

      <span className="shrink-0 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-lg font-bold tracking-tight text-transparent">
        CoLife
      </span>

      <div className="min-w-0 flex-1 px-1 sm:px-4">
        <p className="truncate text-sm font-bold text-slate-900 sm:text-base">{title}</p>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => openCreate()}
          aria-label="Créer une activité"
          className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-semibold text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 focus-visible:ring-offset-2 ${
            isCreateModalOpen
              ? "bg-purple-700"
              : "bg-gradient-to-r from-blue-600 to-purple-600 hover:brightness-105"
          }`}
        >
          <PlusCircle className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline" aria-hidden>Créer</span>
        </button>

        <button
          type="button"
          aria-label="Notifications"
          className="flex h-9 w-9 items-center justify-center rounded-xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
        >
          <Bell className="h-5 w-5" aria-hidden />
        </button>

        <NavLink
          to="/profile"
          aria-label="Mon profil"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 via-purple-600 to-pink-500 text-sm font-bold text-white shadow-md ring-2 ring-white focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
        >
          {initials}
        </NavLink>
      </div>
    </header>
  );
}
