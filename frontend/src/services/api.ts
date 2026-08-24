import axios, { type InternalAxiosRequestConfig, type AxiosError } from 'axios';
import { auth } from '../config/firebase';

interface CustomRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
  _retryCount?: number;
}

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://bkma.onrender.com/api',
  timeout: 60000, // 60 seconds to support server cold-starts
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

// Helper to determine if an error is a retryable network or server cold-start error
const isRetryableNetworkError = (error: AxiosError): boolean => {
  // Network errors, connection closed, timeout, DNS resolution failure
  if (!error.response) {
    return true;
  }
  const status = error.response.status;
  // 502 Bad Gateway, 503 Service Unavailable, 504 Gateway Timeout
  return status === 502 || status === 503 || status === 504;
};

// ─── Response Interceptor: Handle 429, 401 & Automatic Cold-Start Retries ─────
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as CustomRequestConfig | undefined;
    if (!originalRequest) {
      return Promise.reject(error);
    }

    // Handle 429 Too Many Requests cleanly
    if (error.response?.status === 429) {
      const data = error.response.data as any;
      const serverMessage = data?.message || 'Too many requests. Please wait a moment and try again.';
      const retryAfter = data?.retryAfter || error.response.headers?.['retry-after'];
      
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

    // Handle Network / Cold-Start connection closed errors with retry
    const maxRetries = 3;
    const currentRetryCount = originalRequest._retryCount || 0;

    if (isRetryableNetworkError(error) && currentRetryCount < maxRetries) {
      originalRequest._retryCount = currentRetryCount + 1;
      const delayMs = Math.min(1000 * Math.pow(2, currentRetryCount), 6000);

      console.warn(
        `[API Interceptor] Network / Server wake-up issue detected (${error.message || error.code || error.response?.status}). Retrying attempt ${originalRequest._retryCount}/${maxRetries} in ${delayMs}ms...`
      );

      await new Promise(resolve => setTimeout(resolve, delayMs));
      return api(originalRequest);
    }

    return Promise.reject(error);
  }
);

export default api;
