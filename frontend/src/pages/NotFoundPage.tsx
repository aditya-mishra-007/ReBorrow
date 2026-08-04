import { Link } from 'react-router-dom';

/**
 * NotFoundPage.tsx
 * ------------------------------------------------------------------
 * Catch-all route (path="*" in App.tsx) — renders for any URL that
 * doesn't match a defined route. Public, requires no auth check.
 */
export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <p className="text-sm font-semibold text-brand-600">404</p>
      <h1 className="mt-2 text-3xl font-bold text-gray-900">Page not found</h1>
      <p className="mt-3 max-w-sm text-gray-500">
        The page you're looking for doesn't exist or may have been moved.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-md bg-brand-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-brand-700"
      >
        Back to Browsing
      </Link>
    </div>
  );
}