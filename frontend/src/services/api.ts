import axios from 'axios';
import { auth } from '../config/firebase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://bkma.onrender.com/api',
});

// Track initialization state globally to avoid memory leaks/repeated subscriptions
let isInitialized = false;
let resolveInit: (val: unknown) => void;
const initPromise = new Promise<unknown>((resolve) => {
  resolveInit = resolve;
});

auth.authStateReady().then(() => {
  isInitialized = true;
  resolveInit(true);
});

// ─── Request Interceptor: Attach Firebase token ──────────────────────
api.interceptors.request.use(async (config) => {
  // If Firebase Auth is not yet initialized, wait for the global initPromise
  if (!isInitialized) {
    await initPromise;
  }

  const user = auth.currentUser;
  if (user) {
    // getIdToken() returns a cached token if still valid, or refreshes it automatically
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Track last rate limit notification time to prevent duplicate toasts for parallel requests
let lastRateLimitTime = 0;
let lastRateLimitMessage = '';

// ─── Response Interceptor: Handle 429 & 401 with token refresh + retry ─────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle 429 Too Many Requests cleanly
    if (error.response?.status === 429) {
      const serverMessage = error.response.data?.message || 'Too many requests. Please wait a moment and try again.';
      const retryAfter = error.response.data?.retryAfter || error.response.headers?.['retry-after'];
      
      const now = Date.now();
      // Deduplicate toasts within a 2-second window for identical messages
      if (now - lastRateLimitTime > 2000 || lastRateLimitMessage !== serverMessage) {
        lastRateLimitTime = now;
        lastRateLimitMessage = serverMessage;

        window.dispatchEvent(new CustomEvent('kma:rate_limit_exceeded', {
          detail: {
            message: serverMessage,
            retryAfter: retryAfter ? Number(retryAfter) : null
          }
        }));
      }

      return Promise.reject(error);
    }

    // If we get a 401 and haven't already retried, try refreshing the token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      console.log('[API Interceptor] Got 401. Attempting token refresh and retry...');

      try {
        const user = auth.currentUser;
        if (user) {
          // Force a fresh token (bypass cache)
          const freshToken = await user.getIdToken(true);
          console.log('[API Interceptor] Token refreshed. Retrying request.');
          originalRequest.headers.Authorization = `Bearer ${freshToken}`;
          return api(originalRequest);
        } else {
          console.warn('[API Interceptor] No current user. Cannot refresh token.');
        }
      } catch (refreshError) {
        console.error('[API Interceptor] Token refresh failed:', refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
