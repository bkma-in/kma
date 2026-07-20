import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { auth } from '../config/firebase';
import { onAuthStateChanged, onIdTokenChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import type { Role } from '../utils/validation';
import api from '../services/api';
import { clearProfileCache } from '../services/user.service';

// ─── Constants ───────────────────────────────────────────────────────
const ROLE_CACHE_KEY = '__kma_cached_role';
const NAME_CACHE_KEY = '__kma_cached_name';
const MAX_RETRY = 3;
const RETRY_BASE_DELAY_MS = 2000;
const VALID_ROLES: Role[] = ['admin', 'reviewer', 'author', 'reader', 'dev'];

// ─── Types ───────────────────────────────────────────────────────────
interface AuthContextType {
  currentUser: (User & { role: Role; name: string; mustChangePassword?: boolean }) | null;
  loading: boolean;       // true until Firebase Auth SDK has initialized
  roleLoading: boolean;   // true while role is being fetched/verified from backend
  sessionExpired: boolean; // true when auth is lost (user must re-login)
  roleError: string | null;
  logout: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Retry helper for backend role fetch ────────────────────────────
async function fetchRoleFromBackend(retries = MAX_RETRY): Promise<{ role: Role; name: string; mustChangePassword?: boolean }> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await api.post('/auth/verify');
      if (response.data.success) {
        const { role, name, mustChangePassword } = response.data.user;
        console.log(`[AuthContext] Role fetched from backend (attempt ${attempt}):`, role);
        return { role, name, mustChangePassword };
      }
      throw new Error('Backend verify returned success=false');
    } catch (error: any) {
      console.warn(`[AuthContext] Role fetch attempt ${attempt}/${retries} failed:`, error.message);
      if (attempt < retries) {
        const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`[AuthContext] Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
  throw new Error('All retry attempts exhausted');
}

// ─── Provider ────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<(User & { role: Role; name: string; mustChangePassword?: boolean }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  const isInitialAuthCheck = useRef(true);

  // ─── Fetch and set role (idempotent, never defaults to reader) ────
  const loadRole = useCallback(async (user: User, isTokenRefresh = false) => {
    console.log(`[AUTH-DIAGNOSTIC] loadRole invoked for UID: ${user.uid}, isTokenRefresh: ${isTokenRefresh}`);
    setRoleError(null);

    const cachedRole = localStorage.getItem(ROLE_CACHE_KEY) as Role | null;
    const cachedName = localStorage.getItem(NAME_CACHE_KEY);
    const hasCache = cachedRole && VALID_ROLES.includes(cachedRole);

    if (hasCache && !isTokenRefresh) {
      console.log(`[AUTH-DIAGNOSTIC] Cache First: Immediate render shell with role "${cachedRole}"`);
      setCurrentUser({
        ...user,
        role: cachedRole,
        name: cachedName || user.displayName || user.email?.split('@')[0] || 'User'
      } as any);
      setRoleLoading(false);
    } else {
      setRoleLoading(true);
    }

    try {
      console.log(`[AUTH-DIAGNOSTIC] Verifying role from backend for UID: ${user.uid}...`);
      const { role, name, mustChangePassword } = await fetchRoleFromBackend();

      if (!role || !VALID_ROLES.includes(role)) {
        throw new Error(`Invalid role value received: "${role}"`);
      }

      console.log(`[AUTH-DIAGNOSTIC] Role verified from backend: "${role}" for UID: ${user.uid}`);
      
      // Update cache
      localStorage.setItem(ROLE_CACHE_KEY, role);
      localStorage.setItem(NAME_CACHE_KEY, name);

      setCurrentUser(prev => {
        if (prev && prev.uid === user.uid && prev.role === role && prev.name === name && prev.mustChangePassword === mustChangePassword) {
          return prev;
        }
        return { ...user, role, name, mustChangePassword } as any;
      });

      setSessionExpired(false);
    } catch (error: any) {
      console.error(`[AUTH-DIAGNOSTIC] ❌ Role verification failed for UID: ${user.uid}:`, error);

      // Check if it's a structural auth failure (like 401, 403, or "Not approved/Active")
      const isAuthError = error.response?.status === 401 || error.response?.status === 403 || error.message?.includes('deactivated') || error.message?.includes('permissions');

      if (isAuthError) {
        console.error('[AUTH-DIAGNOSTIC] Auth/RBAC validation failure. Logging out user.');
        localStorage.removeItem(ROLE_CACHE_KEY);
        localStorage.removeItem(NAME_CACHE_KEY);
        setCurrentUser(null);
        setRoleError('Your account has been deactivated or rejected. Please contact an administrator.');
        await auth.signOut();
      } else if (!hasCache) {
        // Only trigger blocker error if there is no cache to fall back on
        setRoleError('Unable to verify your account permissions. Please sign in again.');
      }
    } finally {
      setRoleLoading(false);
      console.log(`[AUTH-DIAGNOSTIC] loadRole completed for UID: ${user.uid}`);
    }
  }, []);

  // ─── Firebase Auth State Listener ──────────────────────────────────
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        if (localStorage.getItem('registration_in_progress') === 'true') {
          isInitialAuthCheck.current = false;
          setLoading(false);
          return;
        }
        await loadRole(user, false);
        setSessionExpired(false);
      } else {
        const isManual = localStorage.getItem('manual_logout_active') === 'true';
        const isRegistering = localStorage.getItem('registration_in_progress') === 'true';
        
        if (isManual) localStorage.removeItem('manual_logout_active');
        if (!isInitialAuthCheck.current && !isManual && !isRegistering) {
          setSessionExpired(true);
        }
        setCurrentUser(null);
      }
      isInitialAuthCheck.current = false;
      setLoading(false);
    });
    return () => unsubscribeAuth();
  }, [loadRole]);

  // ─── Token Refresh Listener ────────────────────────────────────────
  useEffect(() => {
    let isFirstFire = true;
    const unsubscribeToken = onIdTokenChanged(auth, async (user) => {
      if (isFirstFire) { isFirstFire = false; return; }
      if (user && localStorage.getItem('registration_in_progress') !== 'true') {
        await loadRole(user, true);
      }
    });
    return () => unsubscribeToken();
  }, [loadRole]);

  // ─── Manual role refresh ───────────────────────────────────────────
  const refreshRole = useCallback(async () => {
    const user = auth.currentUser;
    if (user) await loadRole(user, false);
  }, [loadRole]);

  // ─── Logout ────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      localStorage.setItem('manual_logout_active', 'true');
      await auth.signOut();
      const authKeys = ['isLoggedIn', 'role', 'userEmail', 'userName', 'userId', 'is_temp_password', ROLE_CACHE_KEY, NAME_CACHE_KEY];
      authKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      clearProfileCache();
      setCurrentUser(null);
      setSessionExpired(false);
      setRoleError(null);
    } catch (error) {
      console.error('[AUTH-DIAGNOSTIC] ❌ Error signing out:', error);
      throw error;
    }
  };

  const contextValue = useMemo(() => ({
    currentUser,
    loading,
    roleLoading,
    sessionExpired,
    roleError,
    logout,
    refreshRole
  }), [currentUser, loading, roleLoading, sessionExpired, roleError, refreshRole]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
