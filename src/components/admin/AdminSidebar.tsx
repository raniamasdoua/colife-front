import { Link } from "react-router-dom";
import { LayoutDashboard, CalendarDays, Tag, Users, LayoutGrid } from "lucide-react";
import { SidebarNavList } from "../layout/SidebarNavList";

const NAV_ITEMS = [
  { to: "/admin/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/admin/activities", icon: CalendarDays, label: "Activités" },
  { to: "/admin/activity-types", icon: Tag, label: "Types d'activités" },
  { to: "/admin/users", icon: Users, label: "Utilisateurs" },
];

type AdminSidebarProps = {
  readonly onNavigate?: () => void;
};

export function AdminSidebar({ onNavigate }: AdminSidebarProps) {
  return (
    <>
      <SidebarNavList items={NAV_ITEMS} onNavigate={onNavigate} />

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
