import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorResponse } from '@/types';

/**
 * api.ts
 * ------------------------------------------------------------------
 * Centralized axios instance for all backend communication. Every API
 * call in the app (auth, assets, borrow requests) goes through this
 * single configured instance rather than importing raw `axios` and
 * repeating base URL / header / error-handling logic in every file.
 *
 * Responsibilities:
 *   1. Set a consistent base URL (relative '/api' in dev, thanks to
 *      the Vite proxy configured in vite.config.ts; absolute URL via
 *      env var in production).
 *   2. Request interceptor: automatically attach the JWT (from
 *      localStorage) to every outgoing request's Authorization header.
 *   3. Response interceptor: on a 401 (token invalid/expired), clear
 *      stale auth state and redirect to /login — centralizing this
 *      logic here means individual components never need to manually
 *      check for 401s themselves.
 */

/**
 * Base URL resolution:
 * - In development, VITE_API_URL is typically unset, so we fall back
 *   to the relative '/api' path, which Vite's dev server proxy
 *   forwards to http://localhost:5000 (see vite.config.ts).
 * - In production, VITE_API_URL should be set to the deployed
 *   backend's absolute URL (e.g., https://api.reborrow.app/api),
 *   since there's no dev-server proxy available in a static production build.
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

/**
 * localStorage key under which the JWT is persisted. Centralized as a
 * constant so AuthContext.tsx (which also reads/writes this key) and
 * this file never risk drifting out of sync on the key name.
 */
export const TOKEN_STORAGE_KEY = 'reborrow_token';

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15s — generous enough for slower connections, but prevents indefinitely hanging requests
});

/**
 * Request interceptor
 * ------------------------------------------------------------------
 * Attaches `Authorization: Bearer <token>` to every outgoing request
 * if a token exists in localStorage. Runs before every single request
 * made through this `api` instance, so individual API functions
 * (authApi.ts, assetApi.ts, etc.) never need to manually set this header.
 */
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

/**
 * Response interceptor
 * ------------------------------------------------------------------
 * Global handling for authentication failures. If the backend ever
 * responds with 401 (token missing, invalid, expired, or user
 * deleted — see authMiddleware.ts's `protect`), we:
 *   1. Clear the stale token from localStorage
 *   2. Hard-redirect to /login
 *
 * We use a hard redirect (window.location.href) rather than
 * react-router's navigate() here deliberately — this interceptor lives
 * outside the React component tree/render cycle, so it has no access
 * to router context. A hard redirect also has the useful side effect
 * of fully resetting all in-memory React state (AuthContext, any
 * stale component state), which is exactly what we want after an
 * auth failure.
 *
 * We deliberately do NOT redirect on 403 (Forbidden) — that means the
 * user IS authenticated but lacks permission for a specific action
 * (e.g., trying to approve someone else's borrow request), which
 * should be surfaced as an inline error message, not a forced logout.
 */
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);

      // Avoid an infinite redirect loop if the 401 happens to originate
      // from a request made while already on the login page.
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

/**
 * getErrorMessage
 * ------------------------------------------------------------------
 * Utility to safely extract a human-readable error message from any
 * caught error in a try-catch block, regardless of whether it's an
 * axios error with a structured backend message, a generic JS Error,
 * or something unexpected. Used throughout the app's page/component
 * catch blocks to display toast notifications consistently.
 */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    // Prefer the backend's specific error message if present
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    // Network-level failure (server unreachable, timeout, CORS block)
    if (error.code === 'ECONNABORTED') {
      return 'Request timed out. Please try again.';
    }
    if (!error.response) {
      return 'Unable to reach the server. Please check your connection.';
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred.';
}

export default api;