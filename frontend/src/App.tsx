import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import Layout from '@/components/Layout';

import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import AssetDetailPage from '@/pages/AssetDetailPage';
import CreateAssetPage from '@/pages/CreateAssetPage';
import MyAssetsPage from '@/pages/MyAssetsPage';
import MyRequestsPage from '@/pages/MyRequestsPage';
import IncomingRequestsPage from '@/pages/IncomingRequestsPage';
import MessagesPage from '@/pages/MessagesPage';
import AdminDashboardPage from '@/pages/AdminDashboardPage';
import NotFoundPage from '@/pages/NotFoundPage';

/**
 * App.tsx
 * ------------------------------------------------------------------
 * Top-level route definitions and global providers.
 *
 * Provider nesting: AuthProvider wraps SocketProvider, since the
 * socket connection logic depends on knowing the current auth state
 * (see SocketContext.tsx) — AuthProvider must be the outer, already-
 * initialized context by the time SocketProvider's effect runs.
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
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;