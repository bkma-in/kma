import axios from 'axios';
import { auth } from '../config/firebase';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
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

// Add a request interceptor to automatically add the Firebase token
api.interceptors.request.use(async (config) => {
  // If Firebase Auth is not yet initialized, wait for the global initPromise
  if (!isInitialized) {
    await initPromise;
  }

  const user = auth.currentUser;
  if (user) {
    const token = await user.getIdToken();
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
