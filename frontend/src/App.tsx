import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import Layout from '@/components/Layout';

// Eager imports
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';

// Lazy imports — code split
const AssetDetailPage = lazy(() => import('@/pages/AssetDetailPage'));
const CreateAssetPage = lazy(() => import('@/pages/CreateAssetPage'));
const MyAssetsPage = lazy(() => import('@/pages/MyAssetsPage'));
const MyRequestsPage = lazy(() => import('@/pages/MyRequestsPage'));
const IncomingRequestsPage = lazy(() => import('@/pages/IncomingRequestsPage'));
const MessagesPage = lazy(() => import('@/pages/MessagesPage'));
const AdminDashboardPage = lazy(() => import('@/pages/AdminDashboardPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

const RouteFallback = (
  <div className="flex min-h-[50vh] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
  </div>
);

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
              {/* --- Public Auth Routes --- */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* --- Protected Routes (Login required before browsing or acting) --- */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/assets/:id" element={<AssetDetailPage />} />
                <Route path="/assets/new" element={<CreateAssetPage />} />
                <Route path="/my-assets" element={<MyAssetsPage />} />
                <Route path="/my-requests" element={<MyRequestsPage />} />
                <Route path="/incoming-requests" element={<IncomingRequestsPage />} />
                <Route path="/messages" element={<MessagesPage />} />

                {/* --- Admin-only routes --- */}
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
