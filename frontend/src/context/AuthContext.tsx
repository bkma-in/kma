import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { auth } from '../config/firebase';
import { onAuthStateChanged, onIdTokenChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import type { Role } from '../utils/validation';
import api from '../services/api';

// ─── Constants ───────────────────────────────────────────────────────
const SESSION_WARNING_MS = 50 * 60 * 1000; // 50 minutes — warn before the ~55-min token refresh
const ROLE_CACHE_KEY = '__kma_cached_role';
const NAME_CACHE_KEY = '__kma_cached_name';
const MAX_RETRY = 3;
const RETRY_BASE_DELAY_MS = 2000;

// ─── Types ───────────────────────────────────────────────────────────
interface AuthContextType {
  currentUser: (User & { role: Role; name: string }) | null;
  loading: boolean;       // true until Firebase Auth SDK has initialized
  roleLoading: boolean;   // true while role is being fetched/verified from backend
  sessionExpired: boolean; // true when auth is lost (user must re-login)
  showRefreshNotice: boolean; // true when ~55 min approaches — tells user to refresh
  logout: () => Promise<void>;
  refreshRole: () => Promise<void>;
  dismissRefreshNotice: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Helper: Fetch role from backend with retry ──────────────────────
async function fetchRoleFromBackend(retries = MAX_RETRY): Promise<{ role: Role; name: string }> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await api.post('/auth/verify');
      if (response.data.success) {
        const { role, name } = response.data.user;
        console.log(`[AuthContext] Role fetched from backend (attempt ${attempt}):`, role);
        return { role, name };
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
  const [currentUser, setCurrentUser] = useState<(User & { role: Role; name: string }) | null>(null);
  const [loading, setLoading] = useState(true);        // Auth SDK init
  const [roleLoading, setRoleLoading] = useState(false); // Role verification
  const [sessionExpired, setSessionExpired] = useState(false);
  const [showRefreshNotice, setShowRefreshNotice] = useState(false);

  const sessionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialAuthCheck = useRef(true);

  // ─── Start session timer ──────────────────────────────────────────
  const startSessionTimer = useCallback(() => {
    // Clear any existing timer
    if (sessionTimerRef.current) {
      clearTimeout(sessionTimerRef.current);
    }
    // After ~50 minutes, show the refresh notification
    sessionTimerRef.current = setTimeout(() => {
      console.log('[AuthContext] Session approaching token refresh window. Showing refresh notice.');
      setShowRefreshNotice(true);
    }, SESSION_WARNING_MS);
    console.log('[AuthContext] Session timer started. Will notify in ~50 minutes.');
  }, []);

  // ─── Dismiss refresh notice ──────────────────────────────────────
  const dismissRefreshNotice = useCallback(() => {
    setShowRefreshNotice(false);
  }, []);

  // ─── Fetch and set role (idempotent, never defaults to reader) ────
  const loadRole = useCallback(async (user: User, isTokenRefresh = false) => {
    // Don't set roleLoading on token refresh — it would flash the loading screen
    if (!isTokenRefresh) {
      setRoleLoading(true);
    }

    try {
      const { role, name } = await fetchRoleFromBackend();

      // Cache for instant initial render on next page load
      localStorage.setItem(ROLE_CACHE_KEY, role);
      localStorage.setItem(NAME_CACHE_KEY, name);

      setCurrentUser(prev => {
        // Only update if something actually changed
        if (prev && prev.uid === user.uid && prev.role === role && prev.name === name) {
          return prev;
        }
        // Log if role changed unexpectedly
        if (prev && prev.role !== role) {
          console.warn(`[AuthContext] ⚠️ ROLE CHANGED: ${prev.role} → ${role} for user ${user.uid}`);
        }
        return { ...user, role, name };
      });

      // Reset session timer on successful role fetch
      startSessionTimer();
      setSessionExpired(false);
    } catch (error) {
      console.error('[AuthContext] All role fetch attempts failed:', error);

      if (isTokenRefresh) {
        // On token-refresh failure: DO NOT overwrite the role.
        // Keep the existing role and show refresh notice instead.
        console.log('[AuthContext] Keeping existing role. Showing refresh notice to user.');
        setShowRefreshNotice(true);
        return;
      }

      // On initial load: try cached role, otherwise show session expired
      const cachedRole = localStorage.getItem(ROLE_CACHE_KEY) as Role | null;
      const cachedName = localStorage.getItem(NAME_CACHE_KEY);

      if (cachedRole) {
        console.log('[AuthContext] Using cached role:', cachedRole);
        setCurrentUser({ ...user, role: cachedRole, name: cachedName || user.displayName || user.email?.split('@')[0] || 'User' });
        setShowRefreshNotice(true); // Still notify user there was an issue
      } else {
        // No cache, no backend — user must re-login
        console.error('[AuthContext] No cached role available. Marking session as expired.');
        setSessionExpired(true);
      }
    } finally {
      if (!isTokenRefresh) {
        setRoleLoading(false);
      }
    }
  }, [startSessionTimer]);

  // ─── Firebase Auth State Listener ──────────────────────────────────
  useEffect(() => {
    console.log('[AuthContext] Setting up onAuthStateChanged listener');

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      console.log('[AuthContext] onAuthStateChanged fired. User:', user ? user.uid : 'null');

      if (user) {
        await loadRole(user, false);
        setSessionExpired(false);
      } else {
        // User is null — either signed out or session genuinely expired
        if (!isInitialAuthCheck.current) {
          // This is NOT the initial check — the user WAS logged in before
          console.log('[AuthContext] Auth state lost (was previously logged in). Session expired.');
          setSessionExpired(true);
        }
        setCurrentUser(null);
        // Clear session timer
        if (sessionTimerRef.current) {
          clearTimeout(sessionTimerRef.current);
        }
      }

      isInitialAuthCheck.current = false;
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      if (sessionTimerRef.current) {
        clearTimeout(sessionTimerRef.current);
      }
    };
  }, [loadRole]);

  // ─── Token Refresh Listener (separate from auth state) ─────────────
  useEffect(() => {
    console.log('[AuthContext] Setting up onIdTokenChanged listener');

    // Track whether this is the first fire (which happens immediately on setup)
    let isFirstFire = true;

    const unsubscribeToken = onIdTokenChanged(auth, async (user) => {
      if (isFirstFire) {
        isFirstFire = false;
        return; // Skip the initial fire — onAuthStateChanged already handles it
      }

      if (user) {
        console.log('[AuthContext] 🔄 Token refreshed for user:', user.uid);
        // Re-verify role from backend on token refresh, but DON'T reset state on failure
        await loadRole(user, true);
      }
    });

    return () => unsubscribeToken();
  }, [loadRole]);

  // ─── Manual role refresh ───────────────────────────────────────────
  const refreshRole = useCallback(async () => {
    const user = auth.currentUser;
    if (user) {
      console.log('[AuthContext] Manual role refresh triggered');
      setShowRefreshNotice(false);
      await loadRole(user, false);
    }
  }, [loadRole]);

  // ─── Logout ────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      console.log('[AuthContext] Logout initiated');
      await auth.signOut();
      const authKeys = ['isLoggedIn', 'role', 'userEmail', 'userName', 'userId', 'is_temp_password', ROLE_CACHE_KEY, NAME_CACHE_KEY];
      authKeys.forEach(key => {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      });
      setCurrentUser(null);
      setSessionExpired(false);
      setShowRefreshNotice(false);
      if (sessionTimerRef.current) {
        clearTimeout(sessionTimerRef.current);
      }
      console.log('[AuthContext] Logout complete. All auth data cleared.');
    } catch (error) {
      console.error('[AuthContext] Error signing out:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{
      currentUser,
      loading,
      roleLoading,
      sessionExpired,
      showRefreshNotice,
      logout,
      refreshRole,
      dismissRefreshNotice
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
