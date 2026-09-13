import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "react-oidc-context";

import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { CollaboratorLayout } from "./components/layout/CollaboratorLayout";
import { AdminLayout } from "./components/admin/AdminLayout";
import { CreateActivityModalProvider } from "./context/CreateActivityModalContext";
import { oidcConfig, requireLogout, setAccessToken, setLoginTrigger, setLogoutTrigger } from "./auth/oidcConfig";

const HomePage = lazy(() => import("./pages/HomePage").then((m) => ({ default: m.HomePage })));
const PlanningPage = lazy(() => import("./pages/PlanningPage").then((m) => ({ default: m.PlanningPage })));
const ExplorePage = lazy(() => import("./pages/ExplorePage").then((m) => ({ default: m.ExplorePage })));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage").then((m) => ({ default: m.NotificationsPage })));
const ProfilePage = lazy(() => import("./pages/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const WelcomePage = lazy(() => import("./pages/WelcomePage").then((m) => ({ default: m.WelcomePage })));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage").then((m) => ({ default: m.AdminDashboardPage })));
const AdminActivitiesPage = lazy(() => import("./pages/admin/AdminActivitiesPage").then((m) => ({ default: m.AdminActivitiesPage })));
const AdminActivityTypesPage = lazy(() => import("./pages/admin/AdminActivityTypesPage").then((m) => ({ default: m.AdminActivityTypesPage })));
const AdminProfilePage = lazy(() => import("./pages/admin/AdminProfilePage").then((m) => ({ default: m.AdminProfilePage })));
const AdminUsersPage = lazy(() => import("./pages/admin/AdminUsersPage").then((m) => ({ default: m.AdminUsersPage })));

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

  useEffect(() => {
    setLogoutTrigger(() => {
      void auth.removeUser();
    });
  }, [auth]);

  // Le renouvellement silencieux (automaticSilentRenew) échoue quand le refresh token
  // n'est plus valide (typiquement : session Keycloak déjà expirée côté serveur). Dans
  // ce cas la session applicative est irrécupérable : on nettoie l'état local pour que
  // l'utilisateur retombe proprement sur /welcome plutôt que de rester avec un token
  // mort et des appels API qui échouent en boucle.
  useEffect(() => {
    return auth.events.addSilentRenewError((error) => {
      console.error("Échec du renouvellement de session, déconnexion locale :", error);
      requireLogout();
    });
  }, [auth.events]);

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

  if (auth.isLoading || auth.activeNavigator) {
    return <FullScreenLoader />;
  }

  if (auth.error) {
    const isStaleState = auth.error.message.includes("No matching state found in storage");
    if (isStaleState) {
      auth.clearStaleState();
      void auth.signinRedirect();
      return null;
    }
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
    <Suspense fallback={<FullScreenLoader />}>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/activities/new" element={<Navigate to="/home" replace />} />

        <Route
          element={
            <ProtectedRoute>
              <CollaboratorLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/home" element={<HomePage />} />
          <Route path="/planning" element={<PlanningPage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
        </Route>

        <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
        <Route
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/activities" element={<AdminActivitiesPage />} />
          <Route path="/admin/activity-types" element={<AdminActivityTypesPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/profile" element={<AdminProfilePage />} />
        </Route>

        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </Suspense>
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
