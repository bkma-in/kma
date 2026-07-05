import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { auth } from '../config/firebase';
import { onAuthStateChanged, onIdTokenChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import type { Role } from '../utils/validation';
import api from '../services/api';

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
  roleError: string | null;  // error message when role verification fails
  logout: () => Promise<void>;
  refreshRole: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Helper: Fetch role from backend with retry ──────────────────────
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
  // Should never reach here, but TypeScript needs it
  throw new Error('All retry attempts exhausted');
}

// ─── Provider ────────────────────────────────────────────────────────
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<(User & { role: Role; name: string; mustChangePassword?: boolean }) | null>(null);
  const [loading, setLoading] = useState(true);        // Auth SDK init
  const [roleLoading, setRoleLoading] = useState(false); // Role verification
  const [sessionExpired, setSessionExpired] = useState(false);
  const [roleError, setRoleError] = useState<string | null>(null);

  const isInitialAuthCheck = useRef(true);

  // ─── Fetch and set role (idempotent, never defaults to reader) ────
  const loadRole = useCallback(async (user: User, isTokenRefresh = false) => {
    console.log(`[AUTH-DIAGNOSTIC] loadRole invoked for UID: ${user.uid}, isTokenRefresh: ${isTokenRefresh}`);
    // Always set roleLoading to true to prevent race conditions during token refresh or initial load
    setRoleLoading(true);
    setRoleError(null); // Reset role error at start of attempt

    try {
      console.log(`[AUTH-DIAGNOSTIC] Fetching role from backend for UID: ${user.uid}...`);
      const { role, name, mustChangePassword } = await fetchRoleFromBackend();

      // Validate the retrieved role
      if (!role || !VALID_ROLES.includes(role)) {
        throw new Error(`Invalid role value received: "${role}"`);
      }

      console.log(`[AUTH-DIAGNOSTIC] Role successfully verified from backend: "${role}" for UID: ${user.uid}`);

      // Cache for instant initial render on next page load
      localStorage.setItem(ROLE_CACHE_KEY, role);
      localStorage.setItem(NAME_CACHE_KEY, name);

      setCurrentUser(prev => {
        // Only update if something actually changed
        if (prev && prev.uid === user.uid && prev.role === role && prev.name === name && prev.mustChangePassword === mustChangePassword) {
          return prev;
        }
        // Log if role changed unexpectedly
        if (prev && prev.role !== role) {
          console.warn(`[AUTH-DIAGNOSTIC] ⚠️ ROLE CHANGED unexpectedly: "${prev.role}" → "${role}" for UID: ${user.uid}`);
        }
        return { ...user, role, name, mustChangePassword };
      });

      setSessionExpired(false);
    } catch (error: any) {
      console.error(`[AUTH-DIAGNOSTIC] ❌ Role retrieval/verification failed for UID: ${user.uid}:`, error);

      if (isTokenRefresh) {
        // On token-refresh failure: DO NOT overwrite the role in active session.
        // Keep the existing role and show refresh notice instead.
        console.warn('[AUTH-DIAGNOSTIC] Token refresh role lookup failed. Retaining active session role.');
        return;
      }

      // On initial load: try cached role, otherwise show role verification error
      const cachedRole = localStorage.getItem(ROLE_CACHE_KEY) as Role | null;
      const cachedName = localStorage.getItem(NAME_CACHE_KEY);

      if (cachedRole && VALID_ROLES.includes(cachedRole)) {
        console.log(`[AUTH-DIAGNOSTIC] Using cached role: "${cachedRole}" for UID: ${user.uid}`);
        setCurrentUser({ ...user, role: cachedRole, name: cachedName || user.displayName || user.email?.split('@')[0] || 'User' });
      } else {
        // No cache, no backend — user has failed role verification
        console.error('[AUTH-DIAGNOSTIC] ❌ No valid cached role available and backend verification failed. Setting role error.');
        setRoleError('Unable to verify your account permissions. Please sign in again.');
      }
    } finally {
      setRoleLoading(false);
      console.log(`[AUTH-DIAGNOSTIC] loadRole completed for UID: ${user.uid}`);
    }
  }, []);

  // ─── Firebase Auth State Listener ──────────────────────────────────
  useEffect(() => {
    console.log('[AUTH-DIAGNOSTIC] Setting up onAuthStateChanged listener');

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      console.log('[AUTH-DIAGNOSTIC] onAuthStateChanged fired. User:', user ? user.uid : 'null');

      if (user) {
        if (localStorage.getItem('registration_in_progress') === 'true') {
          console.log('[AUTH-DIAGNOSTIC] Registration in progress, skipping role load');
          isInitialAuthCheck.current = false;
          setLoading(false);
          return;
        }
        await loadRole(user, false);
        setSessionExpired(false);
      } else {
        // User is null — either signed out or session genuinely expired
        const isManual = localStorage.getItem('manual_logout_active') === 'true';
        const isRegistering = localStorage.getItem('registration_in_progress') === 'true';
        
        if (isManual) {
          localStorage.removeItem('manual_logout_active');
        }

        if (!isInitialAuthCheck.current && !isManual && !isRegistering) {
          // This is NOT the initial check — the user WAS logged in before
          console.warn('[AUTH-DIAGNOSTIC] Auth state lost (previously logged in). Session marked as expired.');
          setSessionExpired(true);
        }
        setCurrentUser(null);
      }

      isInitialAuthCheck.current = false;
      setLoading(false);
    });

    return () => {
      console.log('[AUTH-DIAGNOSTIC] Unsubscribing onAuthStateChanged listener');
      unsubscribeAuth();
    };
  }, [loadRole]);

  // ─── Token Refresh Listener (separate from auth state) ─────────────
  useEffect(() => {
    console.log('[AUTH-DIAGNOSTIC] Setting up onIdTokenChanged listener');

    // Track whether this is the first fire (which happens immediately on setup)
    let isFirstFire = true;

    const unsubscribeToken = onIdTokenChanged(auth, async (user) => {
      if (isFirstFire) {
        isFirstFire = false;
        return; // Skip the initial fire — onAuthStateChanged already handles it
      }

      if (user) {
        console.log('[AUTH-DIAGNOSTIC] 🔄 Token change/refresh detected for UID:', user.uid);
        if (localStorage.getItem('registration_in_progress') === 'true') {
          console.log('[AUTH-DIAGNOSTIC] Registration in progress, skipping token refresh role load');
          return;
        }
        // Re-verify role from backend on token refresh
        await loadRole(user, true);
      }
    });

    return () => {
      console.log('[AUTH-DIAGNOSTIC] Unsubscribing onIdTokenChanged listener');
      unsubscribeToken();
    };
  }, [loadRole]);

  // ─── Manual role refresh ───────────────────────────────────────────
  const refreshRole = useCallback(async () => {
    const user = auth.currentUser;
    if (user) {
      console.log('[AUTH-DIAGNOSTIC] Manual role refresh triggered');
      await loadRole(user, false);
    }
  }, [loadRole]);

  // ─── Logout ────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      console.log('[AUTH-DIAGNOSTIC] Logout initiated');
      localStorage.setItem('manual_logout_active', 'true');
      await auth.signOut();
      const authKeys = ['isLoggedIn', 'role', 'userEmail', 'userName', 'userId', 'is_temp_password', ROLE_CACHE_KEY, NAME_CACHE_KEY];
      authKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      setCurrentUser(null);
      setSessionExpired(false);
      setRoleError(null);
      console.log('[AUTH-DIAGNOSTIC] Logout complete. All auth data and local caches cleared.');
    } catch (error) {
      console.error('[AUTH-DIAGNOSTIC] ❌ Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      loading,
      roleLoading,
      sessionExpired,
      roleError,
      logout,
      refreshRole
    }}>
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
