import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import { COLIFE_GRADIENT_BAR } from "../admin/adminTheme";

export type SidebarNavItem = { to: string; icon: LucideIcon; label: string; badge?: number };

type Props = {
  readonly items: SidebarNavItem[];
  readonly onNavigate?: () => void;
  readonly ariaLabel?: string;
};

export function SidebarNavList({ items, onNavigate, ariaLabel }: Props) {
  return (
    <nav
      className="flex-1 space-y-0.5 overflow-y-auto px-2.5 py-4"
      aria-label={ariaLabel}
    >
      {items.map(({ to, icon: Icon, label, badge }) => (
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
                aria-hidden
                className={
                  isActive ? "text-purple-600" : "text-slate-400 group-hover:text-purple-500"
                }
              />
              <span className="flex-1">{label}</span>
              {!!badge && badge > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                  {badge > 9 ? "9+" : badge}
                </span>
              )}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
