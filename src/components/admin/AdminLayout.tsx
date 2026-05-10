import { useEffect, useState, useCallback, type ReactNode } from "react";

import { AdminSidebar } from "./AdminSidebar";
import { AdminTopBar } from "./AdminTopBar";
import { getMe } from "../../services/userService";
import type { UserProfile } from "../../types/auth";

type AdminLayoutProps = {
  children: ReactNode;
  title?: string;
  subtitle?: string;
};

export function AdminLayout({
  children,
  title = "Tableau de bord administrateur",
  subtitle = "Supervisez et gérez l'ensemble de la plateforme CoLife",
}: AdminLayoutProps) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMe()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
      </div>
    );
  }

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
          <div className="mx-auto w-full max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
