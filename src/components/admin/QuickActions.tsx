import { Link } from "react-router-dom";
import { CalendarDays, Tag, Users, ArrowRight } from "lucide-react";

import { COLIFE_CARD, COLIFE_SECTION_LABEL } from "./adminTheme";

const ACTIONS = [
  {
    to: "/admin/activities",
    icon: CalendarDays,
    label: "Voir toutes les activités",
    description: "Gérer, modifier ou supprimer les activités",
    color: "blue" as const,
  },
  {
    to: "/admin/activity-types",
    icon: Tag,
    label: "Gérer les types d'activités",
    description: "Créer et modifier les catégories",
    color: "violet" as const,
  },
  {
    to: "/admin/users",
    icon: Users,
    label: "Voir les utilisateurs",
    description: "Consulter et gérer les comptes",
    color: "pink" as const,
  },
];

const colorMap = {
  blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-100 ring-1 ring-blue-100/80",
  violet: "bg-purple-50 text-purple-600 group-hover:bg-purple-100 ring-1 ring-purple-100/80",
  pink: "bg-pink-50 text-pink-600 group-hover:bg-pink-100 ring-1 ring-pink-100/80",
};

export function QuickActions() {
  return (
    <section>
      <h2 className={`${COLIFE_SECTION_LABEL} mb-3`}>Actions rapides</h2>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {ACTIONS.map(({ to, icon: Icon, label, description, color }) => (
          <Link
            key={to}
            to={to}
            className={`group ${COLIFE_CARD} p-5 flex items-center gap-4 transition-all hover:shadow-lg hover:shadow-purple-500/10 hover:ring-purple-200/60`}
          >
            <div className={`rounded-xl p-3 transition-colors shrink-0 ${colorMap[color]}`}>
              <Icon size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800 leading-tight">{label}</p>
              <p className="text-xs text-slate-500 mt-0.5 truncate">{description}</p>
            </div>
            <ArrowRight
              size={16}
              className="text-slate-300 group-hover:text-purple-500 transition-colors shrink-0"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
