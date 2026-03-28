export type ActivityItem = {
  id: number;
  title: string;
  type: string;
  image: string;
  date: string;
  time: string;
  location: string;
  description?: string;
  organizer: { name: string; avatar: string };
  participants: { current: number; max: number };
  isOrganizer?: boolean;
};

/** Données alignées sur la maquette Figma (à brancher sur l’API plus tard). */
export const myOrganizedActivities: ActivityItem[] = [
  {
    id: 10,
    title: "Session Piscine Team",
    type: "Piscine",
    image:
      "https://images.unsplash.com/photo-1562016600-ece13e8ba570?w=1080&q=80",
    date: "2 nov. 2025",
    time: "18:30 - 20:00",
    location: "Piscine Olympique",
    description: "Session de natation que j'organise pour l'équipe",
    organizer: { name: "Vous", avatar: "VO" },
    participants: { current: 10, max: 15 },
    isOrganizer: true,
  },
];

export const myRegisteredActivities: ActivityItem[] = [
  {
    id: 1,
    title: "Match de Padel",
    type: "Padel",
    image:
      "https://images.unsplash.com/photo-1699117686612-ece525e4f91a?w=1080&q=80",
    date: "1 nov. 2025",
    time: "12:00 - 14:00",
    location: "Club de Padel Paris",
    description: "Match de padel en double.",
    organizer: { name: "Thomas Dubois", avatar: "TD" },
    participants: { current: 4, max: 4 },
  },
  {
    id: 2,
    title: "Yoga Matinal",
    type: "Yoga",
    image:
      "https://images.unsplash.com/photo-1588286840104-8957b019727f?w=1080&q=80",
    date: "30 oct. 2025",
    time: "07:30 - 08:30",
    location: "Salle de Sport Bureau",
    description: "Séance de yoga relaxante.",
    organizer: { name: "Marie Laurent", avatar: "ML" },
    participants: { current: 6, max: 15 },
  },
];

export const trendingActivities: ActivityItem[] = [
  {
    id: 4,
    title: "Soirée Jeux de Société",
    type: "Jeux de société",
    image:
      "https://images.unsplash.com/photo-1645652267295-769f5dc8b10d?w=1080&q=80",
    date: "3 nov. 2025",
    time: "19:00 - 22:00",
    location: "Salle de Réunion A",
    description: "Soirée conviviale autour de jeux de société modernes.",
    organizer: { name: "Pierre Petit", avatar: "PP" },
    participants: { current: 5, max: 10 },
  },
  {
    id: 5,
    title: "Running du Mercredi",
    type: "Course à pied",
    image:
      "https://images.unsplash.com/photo-1563391885380-20acff25036b?w=1080&q=80",
    date: "6 nov. 2025",
    time: "18:30 - 19:30",
    location: "Parc de la Villette",
    organizer: { name: "Julie Bernard", avatar: "JB" },
    participants: { current: 18, max: 20 },
  },
  {
    id: 6,
    title: "Match de Foot",
    type: "Football",
    image:
      "https://images.unsplash.com/photo-1668068872884-c1dff139285d?w=1080&q=80",
    date: "8 nov. 2025",
    time: "15:00 - 17:00",
    location: "Terrain Synthétique Nord",
    description: "Match amical de football en équipes.",
    organizer: { name: "Lucas Moreau", avatar: "LM" },
    participants: { current: 14, max: 22 },
  },
];

export function getTypeBadgeClasses(type: string): string {
  const colors: Record<string, string> = {
    Piscine: "bg-blue-100 text-blue-800",
    Padel: "bg-green-100 text-green-800",
    Yoga: "bg-purple-100 text-purple-800",
    "Jeux de société": "bg-orange-100 text-orange-800",
    "Course à pied": "bg-red-100 text-red-800",
    Football: "bg-emerald-100 text-emerald-800",
  };
  return colors[type] ?? "bg-slate-100 text-slate-700";
}
