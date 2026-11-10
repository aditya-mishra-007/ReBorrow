import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import * as messageApi from '@/api/messageApi';
import {
  Menu,
  X,
  MessageSquare,
  PlusCircle,
  Package,
  ArrowUpRight,
  Inbox,
  ShieldCheck,
  LogOut,
  User as UserIcon,
  Sparkles,
} from 'lucide-react';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const { socket } = useSocket();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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
        // Non-critical
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

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
    navigate('/');
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur-md transition-all">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        {/* --- Logo --- */}
        <Link
          to="/"
          className="group flex items-center gap-2.5 text-xl font-bold tracking-tight text-gray-900 transition-colors"
          onClick={closeMobileMenu}
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm transition-transform group-hover:scale-105">
            <Sparkles className="h-5 w-5" />
          </div>
          <span className="bg-gradient-to-r from-gray-900 via-brand-900 to-brand-700 bg-clip-text text-transparent font-extrabold">
            ReBorrow
          </span>
        </Link>

        {/* --- Desktop Navigation --- */}
        <div className="hidden items-center gap-1 lg:gap-2 md:flex">
          <Link
            to="/"
            className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive('/')
                ? 'bg-brand-50 text-brand-700'
                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            Browse
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                to="/my-assets"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive('/my-assets')
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                My Assets
              </Link>
              <Link
                to="/my-requests"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive('/my-requests')
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                My Requests
              </Link>
              <Link
                to="/incoming-requests"
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive('/incoming-requests')
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                Incoming
              </Link>

              <Link
                to="/messages"
                onClick={() => setUnreadCount(0)}
                className={`relative rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive('/messages')
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="h-4 w-4" />
                  Messages
                </span>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>

              {user?.role === 'admin' && (
                <Link
                  to="/admin"
                  className={`flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-purple-700 transition-colors ${
                    isActive('/admin') ? 'bg-purple-50' : 'hover:bg-purple-50/60'
                  }`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Admin
                </Link>
              )}

              <div className="ml-2 flex items-center gap-3 border-l border-gray-200 pl-4">
                <Link
                  to="/assets/new"
                  className="flex items-center gap-1.5 rounded-lg bg-brand-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-700 active:scale-98"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>List Item</span>
                </Link>

                <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50/80 py-1 pl-2.5 pr-1.5">
                  <span className="max-w-[120px] truncate text-xs font-semibold text-gray-800">
                    {user?.name}
                  </span>
                  <button
                    onClick={handleLogout}
                    title="Sign out"
                    className="flex h-7 w-7 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-gray-200 hover:text-gray-900"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 pl-2">
              <Link
                to="/login"
                className="rounded-lg px-3.5 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-700 active:scale-98"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>

        {/* --- Mobile Menu Button --- */}
        <button
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 p-1.5 text-gray-700 hover:bg-gray-100 md:hidden"
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
        >
          {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {/* --- Mobile Dropdown Menu --- */}
      {isMobileMenuOpen && (
        <div className="border-b border-gray-200 bg-white px-4 py-4 md:hidden">
          <div className="flex flex-col gap-2">
            <Link
              to="/"
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium ${
                isActive('/') ? 'bg-brand-50 text-brand-700' : 'text-gray-700 hover:bg-gray-50'
              }`}
              onClick={closeMobileMenu}
            >
              <Package className="h-4 w-4" />
              Browse Items
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to="/assets/new"
                  className="flex items-center gap-2.5 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white"
                  onClick={closeMobileMenu}
                >
                  <PlusCircle className="h-4 w-4" />
                  List an Item
                </Link>
                <Link
                  to="/my-assets"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={closeMobileMenu}
                >
                  <Package className="h-4 w-4" />
                  My Assets
                </Link>
                <Link
                  to="/my-requests"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={closeMobileMenu}
                >
                  <ArrowUpRight className="h-4 w-4" />
                  My Requests
                </Link>
                <Link
                  to="/incoming-requests"
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={closeMobileMenu}
                >
                  <Inbox className="h-4 w-4" />
                  Incoming Requests
                </Link>
                <Link
                  to="/messages"
                  className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => {
                    closeMobileMenu();
                    setUnreadCount(0);
                  }}
                >
                  <span className="flex items-center gap-2.5">
                    <MessageSquare className="h-4 w-4" />
                    Messages
                  </span>
                  {unreadCount > 0 && (
                    <span className="rounded-full bg-brand-600 px-2 py-0.5 text-xs font-bold text-white">
                      {unreadCount}
                    </span>
                  )}
                </Link>

                {user?.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-purple-700 hover:bg-purple-50"
                    onClick={closeMobileMenu}
                  >
                    <ShieldCheck className="h-4 w-4" />
                    Admin Dashboard
                  </Link>
                )}

                <div className="mt-2 flex items-center justify-between border-t border-gray-100 pt-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700">
                      {user?.name?.charAt(0) || <UserIcon className="h-4 w-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{user?.name}</p>
                      <p className="text-xs text-gray-400">{user?.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-2 flex flex-col gap-2 border-t border-gray-100 pt-3">
                <Link
                  to="/login"
                  className="rounded-lg border border-gray-200 px-3 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={closeMobileMenu}
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-brand-600 px-3 py-2 text-center text-sm font-medium text-white shadow-sm hover:bg-brand-700"
                  onClick={closeMobileMenu}
                >
                  Create an account
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
