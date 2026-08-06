import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import * as messageApi from '@/api/messageApi';

/**
 * Navbar.tsx
 * ------------------------------------------------------------------
 * Top navigation bar, rendered once via Layout.tsx for every route.
 * Conditionally renders different links based on authentication state:
 *   - Logged out: Browse, Login, Register
 *   - Logged in:  Browse, List an Item, My Assets, My Requests,
 *                 Incoming Requests, user's name + Logout
 *
 * Includes a responsive mobile menu (hamburger toggle) since this is
 * the one component that appears on literally every page, so it needs
 * to work cleanly across all viewport sizes from day one.
 */
export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  /**
   * Unread message badge
   * ------------------------------------------------------------------
   * Fetches the total unread count once on login, then increments
   * live whenever a 'new_message' socket event arrives — rather than
   * re-fetching the full conversation list on every message (which
   * MessagesPage does for its own more detailed needs), this just
   * bumps a simple counter for the nav badge, which is cheap and
   * avoids an unnecessary REST call on every single incoming message.
   */
  useEffect(() => {
    if (!isAuthenticated) {
      setUnreadCount(0);
      return;
    }

    (async () => {
      try {
        const { data } = await messageApi.getMyConversations();
        const total = data.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        setUnreadCount(total);
      } catch {
        // Non-critical — badge just won't show an initial count.
      }
    })();
  }, [isAuthenticated]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = () => {
      setUnreadCount((prev) => prev + 1);
    };

    socket.on('new_message', handleNewMessage);
    return () => {
      socket.off('new_message', handleNewMessage);
    };
  }, [socket]);

  /**
   * handleLogout
   * ------------------------------------------------------------------
   * Calls the context's logout() (clears token + user state), then
   * navigates to home. Navigation lives here (not in AuthContext)
   * since routing is a UI concern — AuthContext stays router-agnostic,
   * which also keeps it independently testable without a Router wrapper.
   */
  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* --- Logo / Home link --- */}
        <Link to="/" className="text-xl font-bold text-brand-700" onClick={closeMobileMenu}>
          ReBorrow
        </Link>

        {/* --- Desktop nav links --- */}
        <div className="hidden items-center gap-6 md:flex">
          <Link to="/" className="text-sm font-medium text-gray-700 hover:text-brand-600">
            Browse
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/assets/new"
                className="text-sm font-medium text-gray-700 hover:text-brand-600"
              >
                List an Item
              </Link>
              <Link
                to="/my-assets"
                className="text-sm font-medium text-gray-700 hover:text-brand-600"
              >
                My Assets
              </Link>
              <Link
                to="/my-requests"
                className="text-sm font-medium text-gray-700 hover:text-brand-600"
              >
                My Requests
              </Link>
              <Link
                to="/incoming-requests"
                className="text-sm font-medium text-gray-700 hover:text-brand-600"
              >
                Incoming
              </Link>

              <Link
                to="/messages"
                onClick={() => setUnreadCount(0)}
                className="relative text-sm font-medium text-gray-700 hover:text-brand-600"
              >
                Messages
                {unreadCount > 0 && (
                  <span className="absolute -right-3 -top-2 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className="text-sm font-medium text-purple-600 hover:text-purple-700"
                >
                  Admin
                </Link>
              )}

              <div className="ml-2 flex items-center gap-3 border-l border-gray-200 pl-6">
                <span className="text-sm text-gray-500">
                  Hi, <span className="font-medium text-gray-800">{user?.name}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                to="/login"
                className="text-sm font-medium text-gray-700 hover:text-brand-600"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-brand-600 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-brand-700"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* --- Mobile menu toggle button --- */}
        <button
          className="p-2 text-gray-700 md:hidden"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </nav>

      {/* --- Mobile menu panel --- */}
      {isMobileMenuOpen && (
        <div className="border-t border-gray-200 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-4">
            <Link to="/" className="text-sm font-medium text-gray-700" onClick={closeMobileMenu}>
              Browse
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/assets/new"
                  className="text-sm font-medium text-gray-700"
                  onClick={closeMobileMenu}
                >
                  List an Item
                </Link>
                <Link
                  to="/my-assets"
                  className="text-sm font-medium text-gray-700"
                  onClick={closeMobileMenu}
                >
                  My Assets
                </Link>
                <Link
                  to="/my-requests"
                  className="text-sm font-medium text-gray-700"
                  onClick={closeMobileMenu}
                >
                  My Requests
                </Link>
                <Link
                  to="/incoming-requests"
                  className="text-sm font-medium text-gray-700"
                  onClick={closeMobileMenu}
                >
                  Incoming Requests
                </Link>

                <Link
                  to="/messages"
                  className="flex items-center gap-2 text-sm font-medium text-gray-700"
                  onClick={() => {
                    closeMobileMenu();
                    setUnreadCount(0);
                  }}
                >
                  Messages
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="text-sm font-medium text-purple-600"
                    onClick={closeMobileMenu}
                  >
                    Admin Dashboard
                  </Link>
                )}

                <div className="flex items-center justify-between border-t border-gray-200 pt-4">
                  <span className="text-sm text-gray-500">
                    Hi, <span className="font-medium text-gray-800">{user?.name}</span>
                  </span>
                  <button
                    onClick={handleLogout}
                    className="rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-700"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-3 border-t border-gray-200 pt-4">
                <Link to="/login" className="text-sm font-medium text-gray-700" onClick={closeMobileMenu}>
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-md bg-brand-600 px-4 py-2 text-center text-sm font-medium text-white"
                  onClick={closeMobileMenu}
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}