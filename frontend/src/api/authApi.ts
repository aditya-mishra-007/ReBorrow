import api from '@/lib/api';
import type {
  ApiResponse,
  AuthResponseData,
  LoginPayload,
  RegisterPayload,
  User,
} from '@/types';

/**
 * authApi.ts
 * ------------------------------------------------------------------
 * Typed wrapper functions around the shared `api` axios instance for
 * all authentication-related backend endpoints. Mirrors
 * backend/src/routes/authRoutes.ts exactly:
 *
 *   POST /api/auth/register  -> register()
 *   POST /api/auth/login     -> login()
 *   GET  /api/auth/me        -> getCurrentUser()
 *
 * These functions contain NO business logic or state management —
 * they're a thin, fully-typed layer whose only job is "make this HTTP
 * call and return the typed result." State management (storing the
 * token, tracking the current user) lives in AuthContext.tsx, which
 * calls these functions.
 */

/**
 * LoginResponse
 * ------------------------------------------------------------------
 * Extends the standard AuthResponseData shape with the `token` field,
 * since both /register and /login return `{ data: {...user}, token }`
 * as sibling fields in the response body (see authController.ts) —
 * `token` is NOT nested inside `data`.
 */
interface AuthApiResponse extends ApiResponse<AuthResponseData> {
  token: string;
}

/**
 * register
 * ------------------------------------------------------------------
 * Creates a new user account. On success, the backend returns both
 * the created user's safe profile data AND a JWT — the caller
 * (AuthContext) is responsible for persisting the token and updating
 * global auth state.
 */
export async function register(payload: RegisterPayload): Promise<AuthApiResponse> {
  const response = await api.post<AuthApiResponse>('/auth/register', payload);
  return response.data;
}

/**
 * login
 * ------------------------------------------------------------------
 * Authenticates an existing user with email/password. Same response
 * shape as `register` — user profile + JWT.
 */
export async function login(payload: LoginPayload): Promise<AuthApiResponse> {
  const response = await api.post<AuthApiResponse>('/auth/login', payload);
  return response.data;
}

/**
 * getCurrentUser
 * ------------------------------------------------------------------
 * Fetches the profile of the currently authenticated user, based on
 * whatever JWT is attached by the request interceptor in lib/api.ts.
 * Used by AuthContext on app load to "rehydrate" auth state from a
 * persisted token (e.g., after a page refresh), verifying the token
 * is still valid and fetching fresh user data in one call.
 */
export async function getCurrentUser(): Promise<ApiResponse<User>> {
  const response = await api.get<ApiResponse<User>>('/auth/me');
  return response.data;
}