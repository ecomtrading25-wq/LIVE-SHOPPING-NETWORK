import { ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";

interface AdminProtectedRouteProps {
  children: ReactNode;
}

/**
 * AdminProtectedRoute Component
 * Wraps admin-only pages to ensure only users with admin role can access them
 * Redirects non-admin users to home page
 */
export default function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  // Redirect non-admin users to home page
  if (!user || user.role !== "admin") {
    setLocation("/");
    return null;
  }

  // User is admin, render the protected content
  return <>{children}</>;
}
