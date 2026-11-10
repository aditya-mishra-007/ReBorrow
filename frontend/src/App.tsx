import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import Layout from '@/components/Layout';

// Eager imports — always needed for the initial render, so NOT lazy.
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';

// Lazy imports — split into separate chunks to reduce the initial JS bundle.
// These are only fetched when the user navigates to the matching route.
const AssetDetailPage = lazy(() => import('@/pages/AssetDetailPage'));
const CreateAssetPage = lazy(() => import('@/pages/CreateAssetPage'));
const MyAssetsPage = lazy(() => import('@/pages/MyAssetsPage'));
const MyRequestsPage = lazy(() => import('@/pages/MyRequestsPage'));
const IncomingRequestsPage = lazy(() => import('@/pages/IncomingRequestsPage'));
const MessagesPage = lazy(() => import('@/pages/MessagesPage'));
const AdminDashboardPage = lazy(() => import('@/pages/AdminDashboardPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

/**
 * Shared Suspense fallback — a simple centered spinner shown while a
 * lazy-loaded route chunk is being fetched. Kept minimal so it's
 * nearly invisible on fast connections but provides clear feedback on
 * slower ones.
 */
const RouteFallback = (
  <div className="flex min-h-screen items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
  </div>
);

/**
 * App.tsx
 * ------------------------------------------------------------------
 * Top-level route definitions and global providers.
 *
 * Provider nesting: AuthProvider wraps SocketProvider, since the
 * socket connection logic depends on knowing the current auth state
 * (see SocketContext.tsx) — AuthProvider must be the outer, already-
 * initialized context by the time SocketProvider's effect runs.
 *
 * Performance: all routes except the landing/auth pages use React.lazy
 * so they're code-split into separate chunks, keeping the initial
 * bundle small and time-to-interactive low.
 */
function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              fontSize: '14px',
            },
          }}
        />
        <Suspense fallback={RouteFallback}>
          <Routes>
            {/* Layout wraps every route with shared Navbar/Footer chrome */}
            <Route element={<Layout />}>
              {/* --- Public routes (eager) --- */}
              <Route path="/" element={<HomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              {/* --- Public routes (lazy) --- */}
              <Route path="/assets/:id" element={<AssetDetailPage />} />

              {/* --- Private routes (require authentication) --- */}
              <Route element={<ProtectedRoute />}>
                <Route path="/assets/new" element={<CreateAssetPage />} />
                <Route path="/my-assets" element={<MyAssetsPage />} />
                <Route path="/my-requests" element={<MyRequestsPage />} />
                <Route path="/incoming-requests" element={<IncomingRequestsPage />} />
                <Route path="/messages" element={<MessagesPage />} />

                {/* --- Admin-only routes (require authentication AND admin role) --- */}
                <Route element={<AdminRoute />}>
                  <Route path="/admin" element={<AdminDashboardPage />} />
                </Route>
              </Route>

              {/* --- Catch-all 404 --- */}
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Suspense>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;
