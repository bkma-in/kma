import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getDashboardByRole } from '../utils/auth';
import { Loader2 } from 'lucide-react';

type ProtectedRouteProps = {
  allowedRoles: string[];
  children: React.ReactNode;
};

export default function ProtectedRoute({
  allowedRoles,
  children,
}: ProtectedRouteProps) {
  const { currentUser, loading, roleLoading } = useAuth();

  // Wait for Firebase Auth SDK to initialize
  if (loading || roleLoading) {
    return (
      <div className="p-6 space-y-6 animate-pulse">
        <div className="h-8 bg-zinc-200 rounded w-1/4 mb-6" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={idx} className="bg-white border border-zinc-100 p-6 rounded-3xl h-28" />
          ))}
        </div>
        <div className="bg-white border border-zinc-100 rounded-3xl p-6 h-64" />
      </div>
    );
  }

  // No user at all — redirect to login
  if (!currentUser) {
    console.warn('[AUTH-DIAGNOSTIC] Route Guard Decision: REJECTED (No user session). Redirecting to login.');
    return <Navigate to="/auth?mode=login" replace />;
  }

  // User exists but role is not in allowed list
  const role = currentUser.role;
  if (!role) {
    console.error(`[AUTH-DIAGNOSTIC] Route Guard: User ${currentUser.uid} has no role defined. Rendering loader.`);
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-zinc-300" size={48} />
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Loading Role</p>
        </div>
      </div>
    );
  }

  if (!allowedRoles.includes(role)) {
    console.warn(`[AUTH-DIAGNOSTIC] Route Guard Decision: REJECTED. User ${currentUser.uid} with role "${role}" is not in allowed roles [${allowedRoles.join(', ')}]. Redirecting to correct dashboard.`);
    return (
      <Navigate
        to={getDashboardByRole(role)}
        replace
      />
    );
  }

  console.log(`[AUTH-DIAGNOSTIC] Route Guard Decision: ALLOWED. User ${currentUser.uid} with role "${role}" allowed for [${allowedRoles.join(', ')}]`);
  return <>{children}</>;
}
