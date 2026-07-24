import { getAllActivitiesAdmin } from "./activityService";
import { countActivityTypes } from "./activityTypeService";
import { countUsers } from "./userService";
import { isActivityNoLongerEditable } from "../utils/activitySchedule";
import type { ActivityResponse } from "../types/activity";

export interface AdminStats {
  totalActivities: number;
  upcomingActivities: number;
  totalActivityTypes: number;
  totalUsers: number;
  participationRate: number;
  carpoolRate: number;
}

export interface DashboardData {
  stats: AdminStats;
  upcomingActivities: ActivityResponse[];
}

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

  const totalCapacity = activities.reduce((sum, a) => sum + a.capacity, 0);
  const totalParticipants = activities.reduce((sum, a) => sum + a.participantCount, 0);
  const participationRate = totalCapacity > 0
    ? Math.round((totalParticipants / totalCapacity) * 100)
    : 0;

  const offSite = activities.filter((a) => a.locationType === "OFF_SITE");
  const offSiteWithCarpool = offSite.filter((a) => a.carpool !== null);
  const carpoolRate = offSite.length > 0
    ? Math.round((offSiteWithCarpool.length / offSite.length) * 100)
    : 0;

  const stats: AdminStats = {
    totalActivities: activities.length,
    upcomingActivities: upcoming.length,
    totalActivityTypes,
    totalUsers,
    participationRate,
    carpoolRate,
  };

  return { stats, upcomingActivities: upcoming.slice(0, 5) };
}
