import { Outlet } from 'react-router-dom';
import Navbar from '@/components/Navbar';

/**
 * Layout.tsx
 * ------------------------------------------------------------------
 * Outermost layout route (see App.tsx) — wraps EVERY route in the
 * app, public and private alike, with shared page chrome (Navbar).
 * <Outlet /> renders whichever matched child route (HomePage,
 * LoginPage, AssetDetailPage, etc.) into the content area below it.
 *
 * Kept intentionally minimal: a sticky Navbar up top, a constrained
 * max-width content container, and a simple Footer. No sidebar or
 * complex dashboard chrome — ReBorrow's page-level components handle
 * their own internal layout.
 */
export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

/**
 * Footer
 * ------------------------------------------------------------------
 * Simple, static footer. Kept as a local component within this file
 * rather than its own separate file since it has no independent logic
 * or reuse outside of this layout — splitting it out would be
 * premature abstraction for a handful of static lines.
 */
function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 text-center text-sm text-gray-500 sm:px-6 lg:px-8">
        <p>© {new Date().getFullYear()} ReBorrow. Lend what you own, borrow what you need.</p>
      </div>
    </footer>
  );
}