import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getToken } from "../services/api";
import { getMe } from "../services/userService";
import type { UserProfile } from "../types/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;

  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-violet-600 border-t-transparent" />
      </div>
    );
  }

  // Profil : les admins utilisent /admin/profile (shell admin, sans nav collaborateurs).
  if (user?.role === "ADMIN" && location.pathname === "/profile") {
    return <Navigate to="/admin/profile" replace />;
  }

  // Un ADMIN est redirigé vers le dashboard pour tout le reste de l'espace collaborateur.
  if (user?.role === "ADMIN" && !location.pathname.startsWith("/admin")) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  return <>{children}</>;
}
