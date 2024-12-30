
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  // Allow access to /settings even if user is not logged in
  const currentPath = window.location.pathname;
  if (!auth.isAuthenticated && currentPath !== '/settings') {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}
