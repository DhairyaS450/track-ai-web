
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { ReactNode, memo } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
}

const ProtectedRouteComponent = memo(({ children }: ProtectedRouteProps) => {
  console.log('ProtectedRoute');
  const auth = useAuth();

  const currentPath = window.location.pathname;
  if (!auth.isAuthenticated && currentPath !== '/settings') {
    return <Navigate to="/login" />;
  }

  if (auth.user?.emailVerified === false && currentPath !== '/verify-email') { 
    return <Navigate to="/verify-email" />;
  }

  return <>{children}</>;
});

export const ProtectedRoute = memo(ProtectedRouteComponent);
