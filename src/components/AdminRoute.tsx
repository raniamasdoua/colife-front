import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { getToken } from "../services/api";
import { getMe } from "../services/userService";
import type { UserProfile } from "../types/auth";

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Protège les routes admin :
 * - redirige vers /login si l'utilisateur n'est pas authentifié
 * - redirige vers /home si l'utilisateur n'a pas le rôle ADMIN
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    getMe()
      .then((u) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-violet-600 border-t-transparent" />
      </div>
    );
  }

  if (!getToken() || !user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "ADMIN") {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
