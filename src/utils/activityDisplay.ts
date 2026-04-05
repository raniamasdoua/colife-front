import type { LucideIcon } from "lucide-react";
import {
  Waves,
  Wind,
  Leaf,
  Mountain,
  UtensilsCrossed,
  Brain,
  Gamepad2,
  Users,
  Dumbbell,
  Target,
  Zap,
  Feather,
  Compass,
  Trophy,
  Heart,
  Bike,
  Volleyball,
  Footprints,
} from "lucide-react";

export type ActivityTypeConfig = {
  gradient: string;   // Tailwind gradient classes
  badge: string;      // Tailwind badge bg + text classes
  icon: LucideIcon;   // lucide-react icon component
};

const CONFIG: Record<string, ActivityTypeConfig> = {
  Piscine:          { gradient: "from-blue-400 to-cyan-500",    badge: "bg-blue-100 text-blue-800",    icon: Waves },
  Natation:         { gradient: "from-blue-400 to-cyan-500",    badge: "bg-blue-100 text-blue-800",    icon: Waves },
  Padel:            { gradient: "from-green-400 to-teal-500",   badge: "bg-green-100 text-green-800",  icon: Target },
  Tennis:           { gradient: "from-yellow-400 to-orange-400",badge: "bg-yellow-100 text-yellow-800",icon: Target },
  Football:         { gradient: "from-emerald-500 to-green-600",badge: "bg-emerald-100 text-emerald-800", icon: Volleyball },
  "Course à pied":  { gradient: "from-red-400 to-orange-500",   badge: "bg-red-100 text-red-800",      icon: Wind },
  Running:          { gradient: "from-red-400 to-orange-500",   badge: "bg-red-100 text-red-800",      icon: Wind },
  Randonnée:        { gradient: "from-lime-500 to-green-600",   badge: "bg-lime-100 text-lime-800",    icon: Mountain },
  Escalade:         { gradient: "from-indigo-400 to-blue-600",  badge: "bg-indigo-100 text-indigo-800",icon: Mountain },
  Yoga:             { gradient: "from-violet-400 to-purple-500",badge: "bg-violet-100 text-violet-800",icon: Leaf },
  Méditation:       { gradient: "from-purple-400 to-violet-500",badge: "bg-purple-100 text-purple-800",icon: Brain },
  Pilates:          { gradient: "from-fuchsia-400 to-pink-500", badge: "bg-fuchsia-100 text-fuchsia-800", icon: Heart },
  Cuisine:          { gradient: "from-pink-400 to-rose-500",    badge: "bg-pink-100 text-pink-800",    icon: UtensilsCrossed },
  Badminton:        { gradient: "from-amber-400 to-yellow-500", badge: "bg-amber-100 text-amber-800",  icon: Feather },
  "Jeux de société":{ gradient: "from-orange-400 to-amber-500", badge: "bg-orange-100 text-orange-800",icon: Gamepad2 },
  Social:           { gradient: "from-rose-400 to-pink-500",    badge: "bg-rose-100 text-rose-800",    icon: Users },
  Sport:            { gradient: "from-blue-500 to-cyan-600",    badge: "bg-blue-100 text-blue-800",    icon: Dumbbell },
  Musculation:      { gradient: "from-slate-500 to-slate-700",  badge: "bg-slate-100 text-slate-800",  icon: Dumbbell },
  Cyclisme:         { gradient: "from-sky-400 to-blue-500",     badge: "bg-sky-100 text-sky-800",      icon: Bike },
  Compétition:      { gradient: "from-orange-500 to-red-600",   badge: "bg-orange-100 text-orange-800",icon: Trophy },
  Marche:           { gradient: "from-teal-400 to-cyan-500",    badge: "bg-teal-100 text-teal-800",    icon: Footprints },
  Zumba:            { gradient: "from-pink-500 to-fuchsia-500", badge: "bg-pink-100 text-pink-800",    icon: Zap },
};

const DEFAULT_CONFIG: ActivityTypeConfig = {
  gradient: "from-blue-500 to-purple-600",
  badge: "bg-slate-100 text-slate-700",
  icon: Compass,
};

export function getTypeConfig(typeName: string): ActivityTypeConfig {
  return CONFIG[typeName] ?? DEFAULT_CONFIG;
}
