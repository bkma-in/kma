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
  loading: boolean;          // true until Firebase Auth SDK has initialized
  roleLoading: boolean;      // true while role is being verified from backend
  isRoleVerified: boolean;   // true ONLY AFTER backend /auth/verify confirms the user's role
  sessionExpired: boolean;   // true when auth is lost
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
  const [isRoleVerified, setIsRoleVerified] = useState(false);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  const isInitialAuthCheck = useRef(true);

  // ─── Fetch and set role (idempotent & authoritative) ────
  const loadRole = useCallback(async (user: User, isTokenRefresh = false) => {
    console.log(`[AUTH-DIAGNOSTIC] loadRole invoked for UID: ${user.uid}, isTokenRefresh: ${isTokenRefresh}`);

    // Mark verification in progress
    setIsRoleVerified(false);
    setRoleLoading(true);
    setRoleError(null);

    const cachedRole = localStorage.getItem(ROLE_CACHE_KEY) as Role | null;
    const cachedName = localStorage.getItem(NAME_CACHE_KEY);
    const hasCache = cachedRole && VALID_ROLES.includes(cachedRole) && cachedName;

    // Optimistic UI preview only (isRoleVerified remains false until backend confirms)
    if (hasCache) {
      console.log(`[AUTH-DIAGNOSTIC] Setting optimistic currentUser from cache: "${cachedRole}" for UID: ${user.uid}`);
      setCurrentUser({ ...user, role: cachedRole!, name: cachedName! });
    }

    try {
      console.log(`[AUTH-DIAGNOSTIC] Verifying authoritative role from backend for UID: ${user.uid}...`);
      const { role, name, mustChangePassword } = await fetchRoleFromBackend();

      if (!role || !VALID_ROLES.includes(role)) {
        throw new Error(`Invalid role value received: "${role}"`);
      }

      console.log(`[AUTH-DIAGNOSTIC] Authoritative role verified from backend: "${role}" for UID: ${user.uid}`);
      
      // Update cache with backend-verified values
      localStorage.setItem(ROLE_CACHE_KEY, role);
      localStorage.setItem(NAME_CACHE_KEY, name);

      setCurrentUser({ ...user, role, name, mustChangePassword } as any);
      setIsRoleVerified(true);
      setSessionExpired(false);
    } catch (error: any) {
      console.error(`[AUTH-DIAGNOSTIC] ❌ Role verification failed for UID: ${user.uid}:`, error);

      const isAuthError = error.response?.status === 401 || error.response?.status === 403 || error.message?.includes('deactivated') || error.message?.includes('permissions');

      if (isAuthError) {
        console.error('[AUTH-DIAGNOSTIC] Auth/RBAC validation failure. Clearing session.');
        localStorage.removeItem(ROLE_CACHE_KEY);
        localStorage.removeItem(NAME_CACHE_KEY);
        setCurrentUser(null);
        setIsRoleVerified(false);
        setRoleError('Your account permissions could not be verified. Please sign in again.');
        await auth.signOut();
      } else {
        // Network/transient error: keep cached user if present but block route guard until verified
        setRoleError('Unable to verify your account permissions. Please retry.');
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
        setIsRoleVerified(false);
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
      setIsRoleVerified(false);
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
    isRoleVerified,
    sessionExpired,
    roleError,
    logout,
    refreshRole
  }), [currentUser, loading, roleLoading, isRoleVerified, sessionExpired, roleError, refreshRole]);

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
