import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthProvider, useAuth } from "react-oidc-context";

import { HomePage } from "./pages/HomePage";
import { PlanningPage } from "./pages/PlanningPage";
import { ExplorePage } from "./pages/ExplorePage";
import { ProfilePage } from "./pages/ProfilePage";
import { WelcomePage } from "./pages/WelcomePage";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminActivitiesPage } from "./pages/admin/AdminActivitiesPage";
import { AdminActivityTypesPage } from "./pages/admin/AdminActivityTypesPage";
import { AdminProfilePage } from "./pages/admin/AdminProfilePage";
import { AdminUsersPage } from "./pages/admin/AdminUsersPage";
import { Navigation } from "./components/layout/Navigation";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { CreateActivityModalProvider } from "./context/CreateActivityModalContext";
import { oidcConfig, setAccessToken, setLoginTrigger } from "./auth/oidcConfig";

/**
 * Pont entre la lib OIDC (React) et la couche fetch (modules non-React) :
 * pousse le token courant et le déclencheur de connexion vers api.ts.
 */
function AuthBridge() {
  const auth = useAuth();

  useEffect(() => {
    setAccessToken(auth.user?.access_token ?? null);
  }, [auth.user?.access_token]);

  useEffect(() => {
    setLoginTrigger(() => {
      void auth.signinRedirect();
    });
  }, [auth]);

  return null;
}

function FullScreenLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-violet-600 border-t-transparent" />
    </div>
  );
}

function AppContent() {
  const auth = useAuth();
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith("/admin");
  const isWelcomePage = location.pathname === "/welcome";

  // Navigation cachée sur la page d'accueil publique et les pages admin (layout dédié).
  const showNavigation = !isAdminPage && !isWelcomePage;

  // Tant que la lib OIDC s'initialise ou traite le retour de Keycloak
  // (URL avec ?code&state), on n'affiche PAS les routes : sinon le <Navigate>
  // de "/" effacerait ces paramètres avant que la lib ne les consomme
  // → boucle de redirection. On laisse la lib finir, puis elle nettoie l'URL.
  if (auth.isLoading || auth.activeNavigator) {
    return <FullScreenLoader />;
  }

  // Échec d'authentification (ex. callback invalide) : on affiche l'erreur
  // au lieu de relancer une connexion en boucle.
  if (auth.error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50 p-6 text-center">
        <p className="text-red-600">Erreur d'authentification : {auth.error.message}</p>
        <button
          onClick={() => void auth.signinRedirect()}
          className="px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition"
        >
          Réessayer
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {showNavigation && <Navigation />}

      <main className={showNavigation ? "flex-1 pb-16" : "flex-1"}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/welcome" element={<WelcomePage />} />
          <Route path="/activities/new" element={<Navigate to="/home" replace />} />

          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/planning"
            element={
              <ProtectedRoute>
                <PlanningPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/explore"
            element={
              <ProtectedRoute>
                <ExplorePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          {/* Routes admin — protégées par AdminRoute (session OIDC + rôle ADMIN) */}
          <Route
            path="/admin"
            element={<Navigate to="/admin/dashboard" replace />}
          />
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboardPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/activities"
            element={
              <AdminRoute>
                <AdminActivitiesPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/activity-types"
            element={
              <AdminRoute>
                <AdminActivityTypesPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <AdminUsersPage />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <AdminRoute>
                <AdminProfilePage />
              </AdminRoute>
            }
          />

          {/* Toute route inconnue renvoie vers l'accueil (l'auth est gérée par Keycloak). */}
          <Route path="*" element={<Navigate to="/home" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider {...oidcConfig}>
      <AuthBridge />
      <BrowserRouter>
        <CreateActivityModalProvider>
          <AppContent />
        </CreateActivityModalProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}
