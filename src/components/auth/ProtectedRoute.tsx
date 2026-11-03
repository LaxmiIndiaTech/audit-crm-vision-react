import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { UserRole } from '@/types/auth';
import { Loader2 } from 'lucide-react';
import useValidatedRoles from '@/hooks/useValidatedRoles';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const { roles, isLoading: rolesLoading, error: rolesError } = useValidatedRoles(!!allowedRoles);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Roles are validated via useValidatedRoles only when allowedRoles is provided

  if (allowedRoles) {
    if (rolesLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Checking permissions...</p>
          </div>
        </div>
      );
    }

    if (rolesError) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Access Check Failed</h1>
            <p className="text-muted-foreground">{rolesError}</p>
          </div>
        </div>
      );
    }

    // If backend returned no roles, block access for pages that require roles
    if (roles && roles.length === 0) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">You don't have rights</h1>
            <p className="text-muted-foreground">Please contact your administrator to request access.</p>
          </div>
        </div>
      );
    }

    // Super admin can access everything
    const isSuperAdmin = (roles ?? []).includes('super_admin');
    // Allow access if any validated role matches allowedRoles
    const hasAccess = isSuperAdmin || (roles ?? []).some(r => allowedRoles.includes(r as UserRole));
    if (!hasAccess) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
            <p className="text-muted-foreground">
              You don't have permission to access this page.
            </p>
          </div>
        </div>
      );
    }
  }

  // No role gating when allowedRoles is not specified

  return <>{children}</>;
};

export default ProtectedRoute;