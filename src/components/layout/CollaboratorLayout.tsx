import { useCallback, useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { CollaboratorSidebar } from "./CollaboratorSidebar";
import { CollaboratorTopBar } from "./CollaboratorTopBar";
import { getMe } from "../../services/userService";
import type { UserProfile } from "../../types/auth";

const PAGE_TITLES: Record<string, string> = {
  "/home": "Accueil",
  "/planning": "Mon planning",
  "/explore": "Explorer",
  "/notifications": "Notifications",
  "/profile": "Mon profil",
};

/**
 * Layout persistant de l'espace collaborateur (route parente avec <Outlet/>) :
 * la sidebar/topbar ne se montent qu'une fois pour tout l'espace, seul le
 * contenu de la page change à la navigation — plus de rechargement du profil
 * utilisateur ni de remontage de la sidebar à chaque changement de page.
 */
export function CollaboratorLayout() {
  const location = useLocation();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 768px)");
    const sync = () => setSidebarOpen(mql.matches);
    sync();
    mql.addEventListener("change", sync);
    return () => mql.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((u) => {
        if (!cancelled) {
          setUser(u);
          setIsAdmin(u.role === "ADMIN");
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleSidebar = useCallback(() => setSidebarOpen((o) => !o), []);

  const handleSidebarNavigate = useCallback(() => {
    if (window.matchMedia("(max-width: 767px)").matches) {
      setSidebarOpen(false);
    }
  }, []);

  const title = PAGE_TITLES[location.pathname] ?? "CoLife";

  useEffect(() => {
    document.title = `${title} — CoLife`;
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
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-purple-700 focus:shadow-lg focus:ring-2 focus:ring-purple-400"
      >
        Aller au contenu principal
      </a>
      <CollaboratorTopBar
        user={user}
        title={title}
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

        <aside id="collab-sidebar" className={asideClass} aria-label="Menu de navigation">
          <div className="flex h-full w-60 flex-col">
            <CollaboratorSidebar isAdmin={isAdmin} onNavigate={handleSidebarNavigate} />
          </div>
        </aside>

        <main id="main-content" className="min-h-[calc(100vh-4rem)] min-w-0 flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 via-white to-slate-50/90 p-4 md:p-6 lg:p-8">
          <div className="mx-auto w-full max-w-6xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
