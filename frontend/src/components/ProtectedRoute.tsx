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
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-zinc-300" size={48} />
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em]">Checking Access</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/auth?mode=login" replace />;
  }

  const role = currentUser.role || "author";

  if (!allowedRoles.includes(role)) {
    return (
      <Navigate
        to={getDashboardByRole(role)}
        replace
      />
    );
  }

  return <>{children}</>;
}
