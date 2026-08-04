import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import * as authApi from '@/api/authApi';
import { TOKEN_STORAGE_KEY } from '@/lib/api';
import type { LoginPayload, RegisterPayload, User } from '@/types';

/**
 * AuthContext.tsx
 * ------------------------------------------------------------------
 * Global authentication state management via React Context. Owns:
 *   - The current authenticated user (or null if logged out)
 *   - The JWT's persistence in localStorage
 *   - login/register/logout actions
 *   - A loading flag for the initial "rehydrate session from token"
 *     check that runs once on app mount
 *
 * This is the ONLY place in the app that directly manages auth state.
 * Every component accesses it via the `useAuth()` hook at the bottom
 * of this file — never via importing this context directly.
 */

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean; // true only during the initial session-rehydration check
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  // Starts true: we don't know yet if a persisted token is valid until
  // we've attempted to fetch the current user with it.
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Session rehydration
   * ------------------------------------------------------------------
   * Runs once on mount. If a token exists in localStorage (e.g., from
   * a previous session, surviving a page refresh), attempt to fetch
   * the current user with it. If the token is invalid/expired, the
   * axios response interceptor (lib/api.ts) will already have cleared
   * it and redirected to /login on the resulting 401 — so we don't
   * need to duplicate that cleanup here, just handle the local loading
   * state and swallow the error (it's already been handled globally).
   */
  useEffect(() => {
    const rehydrateSession = async () => {
      const token = localStorage.getItem(TOKEN_STORAGE_KEY);

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await authApi.getCurrentUser();
        setUser(data);
      } catch {
        // Token was invalid/expired — the response interceptor already
        // cleared it from localStorage and redirected if necessary.
        // Nothing further to do here.
      } finally {
        setIsLoading(false);
      }
    };

    rehydrateSession();
  }, []);

  /**
   * login
   * ------------------------------------------------------------------
   * Calls the login API, persists the returned token, and updates
   * local user state. Throws on failure (via axios rejecting the
   * promise) so the calling component's own try-catch can surface a
   * toast with getErrorMessage(error) — this function does NOT catch
   * errors itself, keeping error-display logic in the UI layer where
   * it belongs.
   */
  const login = useCallback(async (payload: LoginPayload) => {
    const response = await authApi.login(payload);
    localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
    setUser({
      _id: response.data._id,
      name: response.data.name,
      email: response.data.email,
      role: response.data.role,
      createdAt: '', // Not returned by login/register; irrelevant for immediate post-auth UI
    });
  }, []);

  /**
   * register
   * ------------------------------------------------------------------
   * Identical pattern to login — the backend's registerUser controller
   * returns the same { data, token } shape as loginUser, so a
   * successful registration immediately logs the user in without
   * requiring a separate login step.
   */
  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await authApi.register(payload);
    localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
    setUser({
      _id: response.data._id,
      name: response.data.name,
      email: response.data.email,
      role: response.data.role,
      createdAt: '',
    });
  }, []);

  /**
   * logout
   * ------------------------------------------------------------------
   * Clears the token and resets user state. Deliberately synchronous
   * and side-effect-minimal (no API call — there's no server-side
   * session to invalidate with stateless JWTs). The calling component
   * is responsible for navigating away (e.g., to '/' or '/login')
   * after calling this, since navigation is a routing concern, not an
   * auth-state concern.
   */
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setUser(null);
  }, []);

  const value: AuthContextValue = {
    user,
    isAuthenticated: user !== null,
    isLoading,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth
 * ------------------------------------------------------------------
 * Hook for consuming AuthContext. Throws a clear, actionable error if
 * called outside an AuthProvider — this fails loudly at the exact
 * point of misuse (e.g., forgetting to wrap a test component in the
 * provider) rather than producing a cryptic "cannot read property of
 * undefined" error somewhere downstream.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}