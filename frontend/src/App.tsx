// frontend/src/App.tsx
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDashboard from './components/AdminDashboard';

const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav style={{ padding: '15px', background: '#333', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        <Link to="/" style={{ color: '#fff', textDecoration: 'none', fontWeight: 'bold' }}>ReBorrow</Link>
        {isAuthenticated && (
          <Link to="/" style={{ color: '#fff', textDecoration: 'none' }}>Dashboard</Link>
        )}
        {/* Only show Admin panel link to admin users */}
        {isAuthenticated && user?.role === 'admin' && (
          <Link to="/admin" style={{ color: '#ffc107', textDecoration: 'none', fontWeight: 'bold' }}>Admin Panel</Link>
        )}
      </div>

      <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
        {!isAuthenticated ? (
          <>
            <Link to="/login" style={{ color: '#fff', textDecoration: 'none' }}>Login</Link>
            <Link to="/register" style={{ color: '#fff', textDecoration: 'none' }}>Register</Link>
          </>
        ) : (
          <>
            <span>Welcome, <strong>{user?.name}</strong> ({user?.role})</span>
            <button 
              onClick={logout} 
              style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '6px 12px', borderRadius: '4px', cursor: 'pointer' }}
            >
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navbar />
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected User Route */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Dashboard />} />
          </Route>

          {/* Protected Admin Route */}
          <Route element={<ProtectedRoute requiredRole="admin" />}>
            <Route path="/admin" element={<AdminDashboard />} />
          </Route>

          {/* Fallback Route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;