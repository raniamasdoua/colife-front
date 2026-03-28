import { Navigate } from "react-router-dom";
import { getToken } from "../services/api";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
