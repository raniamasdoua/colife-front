import { Navigate } from "react-router-dom";
import { useAuth } from "react-oidc-context";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Protège une route : exige une session OIDC (Keycloak) valide.
 * Si l'utilisateur n'est pas authentifié, on l'envoie sur la page d'accueil
 * publique (/welcome) — la redirection vers Keycloak ne se fait qu'au clic.
 */
export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const auth = useAuth();

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

  return <>{children}</>;
}
