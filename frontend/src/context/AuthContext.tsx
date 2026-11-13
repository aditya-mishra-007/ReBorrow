import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import * as authApi from '@/api/authApi';
import {
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
  getValidToken,
  getCachedUser,
  clearAuthStorage,
} from '@/lib/api';
import type { LoginPayload, RegisterPayload, User } from '@/types';

/**
 * AuthContext.tsx
 * ------------------------------------------------------------------
 * Global authentication state management via React Context. Owns:
 *   - The current authenticated user (or null if logged out)
 *   - The JWT's persistence in localStorage
 *   - login/register/logout actions
 *   - Instant synchronous initialization to prevent 5s+ cold-start delays
 */

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Synchronous initialization: reads cached valid user immediately (0ms).
  const [user, setUser] = useState<User | null>(() => {
    return getCachedUser();
  });

  // Only true if we have a token but haven't cached the user yet.
  // For unauthenticated visitors, isLoading is immediately false (0ms redirect).
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const token = getValidToken();
    if (!token) return false;
    return !getCachedUser();
  });

  /**
   * Session rehydration (Stale-While-Revalidate)
   * ------------------------------------------------------------------
   * Runs in the background on mount. Validates token with backend.
   */
  useEffect(() => {
    const rehydrateSession = async () => {
      const token = getValidToken();

      if (!token) {
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await authApi.getCurrentUser();
        setUser(data);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data));
      } catch {
        clearAuthStorage();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    rehydrateSession();
  }, []);

  const login = useCallback(async (payload: LoginPayload) => {
    const response = await authApi.login(payload);
    localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
    const userData: User = {
      _id: response.data._id,
      name: response.data.name,
      email: response.data.email,
      role: response.data.role,
      createdAt: '',
    };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    setUser(userData);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const response = await authApi.register(payload);
    localStorage.setItem(TOKEN_STORAGE_KEY, response.token);
    const userData: User = {
      _id: response.data._id,
      name: response.data.name,
      email: response.data.email,
      role: response.data.role,
      createdAt: '',
    };
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    clearAuthStorage();
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