import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";

import { HomePage } from "./pages/HomePage";
import { PlanningPage } from "./pages/PlanningPage";
import { ProfilePage } from "./pages/ProfilePage";
import { LoginPage } from "./pages/auth/LoginPage";
import { RegisterPage } from "./pages/auth/RegisterPage";
import { Navigation } from "./components/layout/Navigation";
import { ProtectedRoute } from "./components/ProtectedRoute";

const AUTH_ROUTES = ["/login", "/register"];

function AppContent() {
  const location = useLocation();
  const isAuthPage = AUTH_ROUTES.includes(location.pathname);

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 ${isAuthPage ? "" : "pb-16"}`}>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />

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
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>

      {!isAuthPage && <Navigation />}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}