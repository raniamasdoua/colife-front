import type { LucideIcon } from "lucide-react";

import { COLIFE_CARD, COLIFE_SECTION_LABEL } from "./adminTheme";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  color: "blue" | "violet" | "pink" | "emerald";
  trend?: string;
}

const colorMap = {
  blue: {
    tile: "border border-blue-100 bg-gradient-to-b from-blue-50/90 to-white",
    icon: "text-blue-600",
    value: "text-slate-900",
    badge: "bg-blue-100 text-blue-700",
  },
  violet: {
    tile: "border border-purple-100 bg-gradient-to-b from-purple-50/90 to-white",
    icon: "text-purple-600",
    value: "text-slate-900",
    badge: "bg-purple-100 text-purple-700",
  },
  pink: {
    tile: "border border-pink-100 bg-gradient-to-b from-pink-50/90 to-white",
    icon: "text-pink-600",
    value: "text-slate-900",
    badge: "bg-pink-100 text-pink-700",
  },
  emerald: {
    tile: "border border-emerald-100 bg-gradient-to-b from-emerald-50/90 to-white",
    icon: "text-emerald-600",
    value: "text-slate-900",
    badge: "bg-emerald-100 text-emerald-700",
  },
};

export function StatCard({ label, value, icon: Icon, color, trend }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={`${COLIFE_CARD} flex items-start gap-4 p-5`}>
      <div className={`rounded-xl p-3 shrink-0 ${c.tile}`}>
        <Icon size={22} className={c.icon} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`${COLIFE_SECTION_LABEL} truncate`}>{label}</p>
        <p className={`text-3xl font-bold mt-1 tabular-nums ${c.value}`}>{value}</p>
        {trend && (
          <span
            className={`inline-block text-xs font-medium mt-2 px-2 py-0.5 rounded-full ${c.badge}`}
          >
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
