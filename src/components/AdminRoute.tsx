import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";
import { getMe } from "../services/userService";
import type { UserProfile } from "../types/auth";

interface AdminRouteProps {
  children: React.ReactNode;
}

/**
 * Protège les routes admin :
 * - envoie vers /welcome si l'utilisateur n'est pas authentifié
 * - redirige vers /home si l'utilisateur n'a pas le rôle ADMIN
 */
export function AdminRoute({ children }: AdminRouteProps) {
  const auth = useAuth();
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!auth.isAuthenticated) return;
    let cancelled = false;
    getMe()
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {
        if (!cancelled) setUser(null);
      })
      .finally(() => {
        if (!cancelled) setLoadingProfile(false);
      });
    return () => {
      cancelled = true;
    };
  }, [auth.isAuthenticated]);

  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-violet-600 border-t-transparent" />
      </div>
    );
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/welcome" replace />;
  }

  if (loadingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-violet-600 border-t-transparent" />
      </div>
    );
  }

  if (!user || user.role !== "ADMIN") {
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
}
