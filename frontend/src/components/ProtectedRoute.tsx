import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * ProtectedRoute.tsx
 * ------------------------------------------------------------------
 * Route guard component, used as a layout route in App.tsx (wraps a
 * group of nested <Route> children with no path of its own). Renders:
 *   - A loading state while AuthContext is still rehydrating the
 *     session from a persisted token (prevents premature redirect)
 *   - <Outlet /> (renders the matched child route) if authenticated
 *   - A redirect to /login if not authenticated, preserving the
 *     originally-attempted location so we can return the user there
 *     after a successful login
 */
export default function ProtectedRoute() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // While AuthContext is still determining auth status (checking a
  // persisted token via GET /auth/me), avoid rendering the redirect
  // prematurely — this is the fix for the "flash of logged-out
  // content / unwanted redirect on refresh" problem noted in AuthContext.
  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div
          className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600"
          role="status"
          aria-label="Loading"
        />
      </div>
    );
  }

  if (!isAuthenticated) {
    // `state={{ from: location }}` passes the attempted URL along to
    // the login page, so LoginPage.tsx can redirect back here after a
    // successful login instead of always dumping the user on the home
    // page regardless of what they were trying to reach.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}