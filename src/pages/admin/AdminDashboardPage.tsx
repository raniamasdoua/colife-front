import { useEffect, useState } from "react";
import { CalendarDays, CalendarCheck, Tag, Users, UserCheck, Car } from "lucide-react";

import { COLIFE_SECTION_LABEL } from "../../components/admin/adminTheme";
import { StatCard } from "../../components/admin/StatCard";
import { QuickActions } from "../../components/admin/QuickActions";
import { UpcomingActivitiesTable } from "../../components/admin/UpcomingActivitiesTable";
import { AdminActivityDetailModal } from "../../components/admin/AdminActivityDetailModal";

import { loadDashboardData } from "../../services/adminService";
import type { AdminStats } from "../../services/adminService";
import type { ActivityResponse } from "../../types/activity";

export function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [upcomingActivities, setUpcomingActivities] = useState<ActivityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [detailActivity, setDetailActivity] = useState<ActivityResponse | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  useEffect(() => {
    loadDashboardData()
      .then(({ stats: s, upcomingActivities: upcoming }) => {
        setStats(s);
        setUpcomingActivities(upcoming);
      })
      .catch(() => setError("Impossible de charger les données du tableau de bord."))
      .finally(() => setLoading(false));
  }, []);

  function handleRowClick(activity: ActivityResponse) {
    setDetailActivity(activity);
    setDetailOpen(true);
  }

  return (
    <>
      {loading ? (
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-600 border-t-transparent" />
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
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

          <section>
            <h2 className={`${COLIFE_SECTION_LABEL} mb-3`}>Engagement</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard
                label="Taux de participation"
                value={`${stats?.participationRate ?? 0} %`}
                icon={UserCheck}
                color="emerald"
                trend="Places occupées / capacité totale"
              />
              <StatCard
                label="Taux de covoiturage"
                value={`${stats?.carpoolRate ?? 0} %`}
                icon={Car}
                color="blue"
                trend="Activités hors-site avec covoiturage"
              />
            </div>
          </section>

          <QuickActions />

          <UpcomingActivitiesTable
            activities={upcomingActivities}
            onRowClick={handleRowClick}
          />
        </div>
      )}

      <AdminActivityDetailModal
        activity={detailActivity}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
      />
    </>
  );
}
