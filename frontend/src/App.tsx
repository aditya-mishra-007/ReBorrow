import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';

import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import AssetDetailPage from '@/pages/AssetDetailPage';
import CreateAssetPage from '@/pages/CreateAssetPage';
import MyAssetsPage from '@/pages/MyAssetsPage';
import MyRequestsPage from '@/pages/MyRequestsPage';
import IncomingRequestsPage from '@/pages/IncomingRequestsPage';
import NotFoundPage from '@/pages/NotFoundPage';
import AdminRoute from '@/components/AdminRoute';
import AdminDashboardPage from '@/pages/AdminDashboardPage';

/**
 * App.tsx
 * ------------------------------------------------------------------
 * Top-level route definitions and global providers.
 *
 * Access model (public browsing, auth wall on actions):
 *   - Public:  home/browse assets, asset detail, login, register
 *   - Private: create asset, my assets, my requests, incoming requests
 *
 * `AuthProvider` wraps the entire route tree so authentication state
 * (current user, token, login/logout functions) is available anywhere
 * via the `useAuth()` hook, regardless of route. `Toaster` is placed
 * once here at the root so any component can call `toast.success(...)`
 * / `toast.error(...)` without needing to render its own toast container.
 */
function App() {
  return (
    <AuthProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            fontSize: '14px',
          },
        }}
      />
      <Routes>
        {/* Layout wraps every route with shared Navbar/Footer chrome */}
        <Route element={<Layout />}>
          {/* --- Public routes --- */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/assets/:id" element={<AssetDetailPage />} />

          {/* --- Private routes (require authentication) --- */}
          <Route element={<ProtectedRoute />}>
            <Route path="/assets/new" element={<CreateAssetPage />} />
            <Route path="/my-assets" element={<MyAssetsPage />} />
            <Route path="/my-requests" element={<MyRequestsPage />} />
            <Route path="/incoming-requests" element={<IncomingRequestsPage />} />

            {/* --- Admin-only routes (require authentication AND admin role) --- */}
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminDashboardPage />} />
            </Route>
          </Route>

          {/* --- Catch-all 404 --- */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;