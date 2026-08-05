import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * AdminRoute.tsx
 * ------------------------------------------------------------------
 * Route guard for admin-only pages. Used nested INSIDE ProtectedRoute
 * in App.tsx — so by the time this component runs, authentication is
 * already guaranteed; this only adds the additional role check.
 *
 * Non-admins attempting to reach an admin route are redirected home
 * rather than to /login (they ARE logged in, just not authorized) —
 * with no indication of what they were trying to reach, since exposing
 * "you tried to access /admin" isn't meaningful extra information
 * worth surfacing.
 */
export default function AdminRoute() {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}