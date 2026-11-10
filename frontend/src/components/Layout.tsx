import { Outlet, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Sparkles, Shield, HeartHandshake, Zap } from 'lucide-react';

export default function Layout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#F9FAFB] text-gray-900 selection:bg-brand-100 selection:text-brand-900">
      <Navbar />

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t border-gray-200/80 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-3 md:col-span-1">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <span className="text-lg font-bold tracking-tight text-gray-900">ReBorrow</span>
            </div>
            <p className="text-xs leading-relaxed text-gray-500">
              A peer-to-peer neighborhood sharing network. Borrow high-end gear, tools, and essentials affordably from trusted locals.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-900">Platform</h4>
            <ul className="mt-3 space-y-2 text-xs text-gray-500">
              <li>
                <Link to="/" className="hover:text-brand-600 transition-colors">
                  Browse Catalog
                </Link>
              </li>
              <li>
                <Link to="/assets/new" className="hover:text-brand-600 transition-colors">
                  List an Item
                </Link>
              </li>
              <li>
                <Link to="/messages" className="hover:text-brand-600 transition-colors">
                  Direct Messaging
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-900">Trust & Safety</h4>
            <ul className="mt-3 space-y-2 text-xs text-gray-500">
              <li className="flex items-center gap-1.5">
                <Shield className="h-3.5 w-3.5 text-brand-600" />
                <span>Verified Lenders</span>
              </li>
              <li className="flex items-center gap-1.5">
                <HeartHandshake className="h-3.5 w-3.5 text-brand-600" />
                <span>Security Deposit Protection</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-brand-600" />
                <span>Instant Real-Time Chat</span>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-900">Community</h4>
            <p className="mt-3 text-xs leading-relaxed text-gray-500">
              Share what you own, borrow what you need. Save money, reduce waste, and build neighborhood connections.
            </p>
            <div className="mt-4 flex items-center gap-2 text-xs text-brand-600 font-medium">
              <span>Made with care for circular communities</span>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-gray-100 pt-6 flex flex-col items-center justify-between gap-4 sm:flex-row text-xs text-gray-400">
          <p>© {new Date().getFullYear()} ReBorrow Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-gray-600 cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-gray-600 cursor-pointer">Terms of Service</span>
            <span>•</span>
            <span className="hover:text-gray-600 cursor-pointer">Safety Guidelines</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
