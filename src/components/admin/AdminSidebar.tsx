import { Link, NavLink } from "react-router-dom";
import { LayoutDashboard, CalendarDays, Tag, Users, LayoutGrid } from "lucide-react";

import { COLIFE_GRADIENT_BAR } from "./adminTheme";

const NAV_ITEMS = [
  { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/activities", icon: CalendarDays, label: "Activités" },
  { to: "/admin/activity-types", icon: Tag, label: "Types d'activités" },
  { to: "/admin/users", icon: Users, label: "Utilisateurs" },
];

type AdminSidebarProps = {
  /** Fermer le menu après navigation (ex. mobile) */
  onNavigate?: () => void;
};

export function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  return (
    <>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-4">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => onNavigate?.()}
            className={({ isActive }) =>
              [
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                isActive
                  ? "bg-purple-50 text-purple-700 shadow-sm ring-1 ring-purple-100/80"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className={`absolute left-0 top-1/2 h-9 w-1 -translate-y-1/2 rounded-full ${COLIFE_GRADIENT_BAR}`}
                    aria-hidden
                  />
                )}
                <Icon
                  size={18}
                  className={
                    isActive ? "text-purple-600" : "text-slate-400 group-hover:text-purple-500"
                  }
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-slate-100 px-2.5 pt-3 pb-1">
        <Link
          to="/home"
          onClick={() => onNavigate?.()}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-purple-700 bg-gradient-to-r from-purple-50 to-pink-50 ring-1 ring-purple-100/80 transition hover:from-purple-100 hover:to-pink-100"
        >
          <LayoutGrid size={18} className="text-purple-500 shrink-0" />
          Espace collaborateur
        </Link>
      </div>

      <div className="bg-slate-50/80 px-3 py-3">
        <p className="px-3 text-[11px] text-slate-400">CoLife · v0.0.3</p>
      </div>
    </>
  );
}
