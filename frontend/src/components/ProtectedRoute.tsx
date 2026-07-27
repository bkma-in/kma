import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardByRole } from '../utils/auth';

type ProtectedRouteProps = {
  allowedRoles: string[];
  children: React.ReactNode;
};

export default function ProtectedRoute({
  allowedRoles,
  children,
}: ProtectedRouteProps) {
  const { currentUser, loading, roleLoading, isRoleVerified } = useAuth();

  // 1. Block rendering until Firebase Auth SDK initializes AND backend role is verified
  if (loading || roleLoading || !isRoleVerified) {
    return (
      <div className="p-6 space-y-6 animate-pulse w-full max-w-7xl mx-auto">
        <div className="h-8 bg-zinc-200 rounded-lg w-1/4 mb-6" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-white border border-zinc-100 p-6 rounded-3xl h-28" />
          ))}
        </div>
        <div className="bg-white border border-zinc-100 rounded-3xl p-6 h-64" />
      </div>
    );
  }

  // 2. Unauthenticated user -> Redirect to login
  if (!currentUser) {
    console.warn('[AUTH-DIAGNOSTIC] Route Guard Decision: REJECTED (No user session). Redirecting to login.');
    return <Navigate to="/auth?mode=login" replace />;
  }

  // 3. User exists & backend role is verified. Check if verified role matches allowedRoles
  const verifiedRole = currentUser.role;
  if (!verifiedRole || !allowedRoles.includes(verifiedRole)) {
    console.warn(`[AUTH-DIAGNOSTIC] Route Guard Decision: REJECTED. User ${currentUser.uid} with verified role "${verifiedRole}" is not in allowed roles [${allowedRoles.join(', ')}]. Redirecting to correct dashboard.`);
    return <Navigate to={getDashboardByRole(verifiedRole)} replace />;
  }

  console.log(`[AUTH-DIAGNOSTIC] Route Guard Decision: ALLOWED. User ${currentUser.uid} with verified role "${verifiedRole}" allowed for [${allowedRoles.join(', ')}]`);
  return <>{children}</>;
}
