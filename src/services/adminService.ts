import { countActivityTypes } from "./activityTypeService";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AdminStats {
  totalActivities: number;
  upcomingActivities: number;
  totalActivityTypes: number;
  totalUsers: number;
}

export interface UpcomingActivityRow {
  id: number;
  title: string;
  date: string;
  startTime: string;
  organizerName: string;
  participantCount: number;
  capacity: number;
}

// ─── Mock data (à remplacer par des appels API réels) ───────────────────────

const MOCK_STATS: AdminStats = {
  totalActivities: 48,
  upcomingActivities: 12,
  totalActivityTypes: 0,
  totalUsers: 134,
};

const MOCK_UPCOMING: UpcomingActivityRow[] = [
  {
    id: 1,
    title: "Yoga du matin",
    date: "2026-04-21",
    startTime: "08:00",
    organizerName: "Sophie Martin",
    participantCount: 12,
    capacity: 20,
  },
  {
    id: 2,
    title: "Tournoi de tennis",
    date: "2026-04-22",
    startTime: "14:00",
    organizerName: "Julien Dupont",
    participantCount: 8,
    capacity: 16,
  },
  {
    id: 3,
    title: "Atelier cuisine",
    date: "2026-04-24",
    startTime: "12:00",
    organizerName: "Marie Leblanc",
    participantCount: 18,
    capacity: 20,
  },
  {
    id: 4,
    title: "Randonnée en forêt",
    date: "2026-04-26",
    startTime: "09:00",
    organizerName: "Thomas Bernard",
    participantCount: 5,
    capacity: 25,
  },
  {
    id: 5,
    title: "Session running",
    date: "2026-04-28",
    startTime: "07:30",
    organizerName: "Camille Petit",
    participantCount: 10,
    capacity: 15,
  },
];

// ─── API calls (décommenter et adapter quand le backend sera prêt) ───────────

export async function getAdminStats(): Promise<AdminStats> {
  const totalActivityTypes = await countActivityTypes();
  return {
    ...MOCK_STATS,
    totalActivityTypes,
  };
}

export async function getUpcomingActivitiesAdmin(): Promise<UpcomingActivityRow[]> {
  // return apiFetch<UpcomingActivityRow[]>("/admin/activities/upcoming");
  return Promise.resolve(MOCK_UPCOMING);
}
