import { useEffect, useState, useCallback } from "react";
import { Outlet, useLocation } from "react-router-dom";

import { AdminSidebar } from "./AdminSidebar";
import { AdminTopBar } from "./AdminTopBar";
import { getMe } from "../../services/userService";
import type { UserProfile } from "../../types/auth";

const PAGE_TITLES: Record<string, { title: string; subtitle: string }> = {
  "/admin/dashboard": {
    title: "Tableau de bord administrateur",
    subtitle: "Supervisez et gérez l'ensemble de la plateforme CoLife",
  },
  "/admin/activities": {
    title: "Activités",
    subtitle: "Vue complète et gestion de toutes les activités de la plateforme",
  },
  "/admin/activity-types": {
    title: "Types d'activités",
    subtitle: "Créez et gérez les catégories proposées aux collaborateurs",
  },
  "/admin/users": {
    title: "Utilisateurs",
    subtitle: "Gestion et consultation de tous les membres de la plateforme",
  },
  "/admin/profile": {
    title: "Mon profil",
    subtitle: "Gérez vos informations personnelles et la sécurité de votre compte",
  },
};

const DEFAULT_PAGE = PAGE_TITLES["/admin/dashboard"];

/**
 * Layout persistant de l'espace admin (route parente avec <Outlet/>) : la
 * sidebar/topbar ne se montent qu'une fois pour tout l'espace, seul le
 * contenu de la page change à la navigation — plus de rechargement du profil
 * utilisateur ni de remontage de la sidebar à chaque changement de page.
 */
export function AdminLayout() {
  const location = useLocation();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const sync = () => setSidebarOpen(mql.matches);
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen((o) => !o);
  }, []);

  const handleSidebarNavigate = useCallback(() => {
    if (window.matchMedia("(max-width: 767px)").matches) {
      setSidebarOpen(false);
    }
  }, []);

  const { title, subtitle } = PAGE_TITLES[location.pathname] ?? DEFAULT_PAGE;

  useEffect(() => {
    document.title = `${title} — CoLife Admin`;
  }, [title]);

  const asideClass = [
    "flex shrink-0 flex-col overflow-hidden border-slate-200/90 bg-white shadow-md transition-[width,transform] duration-300 ease-in-out",
    "fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] md:sticky md:top-16 md:z-0 md:shadow-sm",
    sidebarOpen
      ? "w-60 translate-x-0 border-r md:translate-x-0"
      : "-translate-x-full border-r md:w-0 md:translate-x-0 md:border-0 md:shadow-none",
  ].join(" ");

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 font-sans text-slate-900">
      <AdminTopBar
        user={user}
        title={title}
        subtitle={subtitle}
        sidebarOpen={sidebarOpen}
        onToggleSidebar={toggleSidebar}
      />

      <div className="relative flex min-h-0 flex-1">
        {sidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 top-16 z-30 bg-slate-900/40 backdrop-blur-[1px] md:hidden"
            aria-label="Fermer le menu"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside id="admin-sidebar" className={asideClass}>
          <div className="flex h-full w-60 flex-col">
            <AdminSidebar onNavigate={handleSidebarNavigate} />
          </div>
        </aside>

        <main className="min-h-[calc(100vh-4rem)] min-w-0 flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 via-white to-slate-50/90 p-6 md:pt-6 lg:p-8">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
