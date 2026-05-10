import { useEffect, useState } from "react";
import { CalendarDays, CalendarCheck, Tag, Users } from "lucide-react";

import { AdminLayout } from "../../components/admin/AdminLayout";
import { COLIFE_SECTION_LABEL } from "../../components/admin/adminTheme";
import { StatCard } from "../../components/admin/StatCard";
import { QuickActions } from "../../components/admin/QuickActions";
import { UpcomingActivitiesTable } from "../../components/admin/UpcomingActivitiesTable";

import {
  getAdminStats,
  getUpcomingActivitiesAdmin,
} from "../../services/adminService";
import type { AdminStats, UpcomingActivityRow } from "../../services/adminService";

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [upcomingActivities, setUpcomingActivities] = useState<UpcomingActivityRow[]>(
    []
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAdminStats(), getUpcomingActivitiesAdmin()])
      .then(([s, activities]) => {
        setStats(s);
        setUpcomingActivities(activities);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-600 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-8">
          <section>
            <h2 className={`${COLIFE_SECTION_LABEL} mb-3`}>Vue d'ensemble</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard
                label="Total activités"
                value={stats?.totalActivities ?? 0}
                icon={CalendarDays}
                color="blue"
                trend="Toutes périodes"
              />
              <StatCard
                label="Activités à venir"
                value={stats?.upcomingActivities ?? 0}
                icon={CalendarCheck}
                color="emerald"
                trend="Prochainement"
              />
              <StatCard
                label="Types d'activités"
                value={stats?.totalActivityTypes ?? 0}
                icon={Tag}
                color="violet"
              />
              <StatCard
                label="Utilisateurs"
                value={stats?.totalUsers ?? 0}
                icon={Users}
                color="pink"
                trend="Inscrits"
              />
            </div>
          </section>

          <QuickActions />

          <UpcomingActivitiesTable activities={upcomingActivities} />
        </div>
      )}
    </AdminLayout>
  );
}
