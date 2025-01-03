
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  const currentPath = window.location.pathname;
  if (!auth.isAuthenticated && currentPath !== '/login') {
    return <Navigate to="/login" />;
  }

  if (auth.user?.emailVerified === false && currentPath !== '/verify-email') { 
    return <Navigate to="/verify-email" />;
  }

  return <>{children}</>;
}
