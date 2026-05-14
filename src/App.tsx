import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import { HomePage } from "./pages/HomePage";
import { PlanningPage } from "./pages/PlanningPage";
import { ExplorePage } from "./pages/ExplorePage";
import { ProfilePage } from "./pages/ProfilePage";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { AdminDashboardPage } from "./pages/admin/AdminDashboardPage";
import { AdminActivitiesPage } from "./pages/admin/AdminActivitiesPage";
import { AdminActivityTypesPage } from "./pages/admin/AdminActivityTypesPage";
import { AdminProfilePage } from "./pages/admin/AdminProfilePage";
import { Navigation } from "./components/layout/Navigation";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminRoute } from "./components/AdminRoute";
import { CreateActivityModalProvider } from "./context/CreateActivityModalContext";

const AUTH_ROUTES = ["/login", "/register"];

function AppContent() {
  const location = useLocation();
  const isAuthPage = AUTH_ROUTES.includes(location.pathname);
  const isAdminPage = location.pathname.startsWith("/admin");

  // Navigation cachée sur les pages auth et les pages admin (qui ont leur propre layout)
  const showNavigation = !isAuthPage && !isAdminPage;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {showNavigation && <Navigation />}

      <main className={showNavigation ? "flex-1 pb-16" : "flex-1"}>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
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

          {/* Routes admin — protégées par AdminRoute (token + rôle ADMIN) */}
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
                <AdminDashboardPage />
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

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <CreateActivityModalProvider>
        <AppContent />
      </CreateActivityModalProvider>
    </BrowserRouter>
  );
}