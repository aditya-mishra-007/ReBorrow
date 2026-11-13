import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import type { ApiErrorResponse, User } from '@/types';

/**
 * api.ts
 * ------------------------------------------------------------------
 * Centralized axios instance for all backend communication. Every API
 * call in the app (auth, assets, borrow requests) goes through this
 * single configured instance rather than importing raw `axios` and
 * repeating base URL / header / error-handling logic in every file.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const TOKEN_STORAGE_KEY = 'reborrow_token';
export const USER_STORAGE_KEY = 'reborrow_user';

/**
 * Checks if a JWT token is expired without sending a network request.
 * Decodes the base64 payload in 0ms.
 */
export function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split('.');
    if (parts.length !== 3 || !parts[1]) return true;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const payload = JSON.parse(jsonPayload);
    if (!payload.exp) return false;
    // Buffer by 10 seconds to avoid edge-of-expiry race conditions
    return payload.exp * 1000 <= Date.now() + 10000;
  } catch {
    return true;
  }
}

/**
 * Clears authentication tokens and cached user data from localStorage.
 */
export function clearAuthStorage(): void {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  localStorage.removeItem(USER_STORAGE_KEY);
}

/**
 * Returns the token if it exists and is not expired; otherwise cleans up storage.
 */
export function getValidToken(): string | null {
  const token = localStorage.getItem(TOKEN_STORAGE_KEY);
  if (!token) {
    localStorage.removeItem(USER_STORAGE_KEY);
    return null;
  }
  if (isTokenExpired(token)) {
    clearAuthStorage();
    return null;
  }
  return token;
}

/**
 * Returns cached user data if a valid token exists.
 */
export function getCachedUser(): User | null {
  const token = getValidToken();
  if (!token) return null;
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

/**
 * Warm up backend on cold-start hosts (e.g. Render free tier).
 * Non-blocking fire-and-forget fetch to /api/health.
 */
let hasWarmedUp = false;
export function warmUpBackend(): void {
  if (hasWarmedUp) return;
  hasWarmedUp = true;
  try {
    const target = API_BASE_URL.startsWith('http')
      ? `${API_BASE_URL.replace(/\/api\/?$/, '')}/api/health`
      : '/api/health';
    fetch(target, { method: 'GET', cache: 'no-store', keepalive: true }).catch(() => {});
  } catch {
    // Non-critical
  }
}

// Trigger warmup immediately upon script evaluation
warmUpBackend();

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getValidToken();

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiErrorResponse>) => {
    if (error.response?.status === 401) {
      clearAuthStorage();

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