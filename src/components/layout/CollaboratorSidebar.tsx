import { Link } from "react-router-dom";
import { Home, CalendarDays, Compass, Bell, User, Shield } from "lucide-react";
import { SidebarNavList } from "./SidebarNavList";

const NAV_ITEMS = [
  { to: "/home", icon: Home, label: "Accueil" },
  { to: "/planning", icon: CalendarDays, label: "Planning" },
  { to: "/explore", icon: Compass, label: "Explorer" },
  { to: "/notifications", icon: Bell, label: "Notifications" },
  { to: "/profile", icon: User, label: "Profil" },
];

type CollaboratorSidebarProps = {
  readonly isAdmin: boolean;
  readonly onNavigate?: () => void;
};

export function CollaboratorSidebar({ isAdmin, onNavigate }: CollaboratorSidebarProps) {
  return (
    <>
      <SidebarNavList items={NAV_ITEMS} onNavigate={onNavigate} ariaLabel="Navigation principale" />

      {isAdmin && (
        <div className="border-t border-slate-100 px-2.5 pt-3 pb-1">
          <Link
            to="/admin/dashboard"
            onClick={() => onNavigate?.()}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-purple-700 bg-gradient-to-r from-purple-50 to-pink-50 ring-1 ring-purple-100/80 transition hover:from-purple-100 hover:to-pink-100"
          >
            <Shield size={18} aria-hidden className="text-purple-500 shrink-0" />
            Espace admin
          </Link>
        </div>
      )}

      <div className="bg-slate-50/80 px-3 py-3">
        <p className="px-3 text-[11px] text-slate-400">CoLife · v0.3.0</p>
      </div>
    </>
  );
}
