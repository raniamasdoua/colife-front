import { getAllActivitiesAdmin } from "./activityService";
import { countActivityTypes } from "./activityTypeService";
import { countUsers } from "./userService";
import { isActivityNoLongerEditable } from "../utils/activitySchedule";
import type { ActivityResponse } from "../types/activity";

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AdminStats {
  totalActivities: number;
  upcomingActivities: number;
  totalActivityTypes: number;
  totalUsers: number;
}

export interface DashboardData {
  stats: AdminStats;
  /** 5 prochaines activités à venir, triées par date/heure (objets complets). */
  upcomingActivities: ActivityResponse[];
}

// ─── API ────────────────────────────────────────────────────────────────────

/**
 * Charge toutes les données du tableau de bord admin en parallèle :
 * activités actives, types d'activités, nombre d'utilisateurs.
 */
export async function loadDashboardData(): Promise<DashboardData> {
  const [activities, totalActivityTypes, totalUsers] = await Promise.all([
    getAllActivitiesAdmin(false),
    countActivityTypes(),
    countUsers(),
  ]);

  const now = new Date();
  const upcoming = activities
    .filter((a) => !isActivityNoLongerEditable(a, now))
    .sort((a, b) => {
      const da = new Date(`${a.date}T${a.startTime}`).getTime();
      const db = new Date(`${b.date}T${b.startTime}`).getTime();
      return da - db;
    });

  const stats: AdminStats = {
    totalActivities: activities.length,
    upcomingActivities: upcoming.length,
    totalActivityTypes,
    totalUsers,
  };

  return { stats, upcomingActivities: upcoming.slice(0, 5) };
}
