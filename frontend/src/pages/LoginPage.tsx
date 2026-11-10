import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/api';
import type { LoginPayload } from '@/types';
import ReBorrowLogo from '@/components/ReBorrowLogo';
import { ArrowRight, Lock, Mail, UserCheck } from 'lucide-react';

const COMMUNITY_USERS = [
  { label: 'Priya Sharma', email: 'priya.sharma@gmail.com' },
  { label: 'Aarav Mehta', email: 'aarav.mehta@gmail.com' },
  { label: 'Neha Verma', email: 'neha.verma@gmail.com' },
  { label: 'Rohan Gupta', email: 'rohan.gupta@gmail.com' },
];

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginPayload>();

  const from = (location.state as { from?: Location })?.from?.pathname || '/';

  const onSubmit = async (data: LoginPayload) => {
    setIsSubmitting(true);
    try {
      await login(data);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectUser = (email: string) => {
    setValue('email', email);
    setValue('password', 'Password123!');
  };

  return (
    <div className="mx-auto max-w-md py-6 sm:py-10">
      <div className="overflow-hidden rounded-3xl border border-gray-200/90 bg-white p-8 shadow-xl sm:p-10">
        <div className="text-center">
          <div className="flex justify-center">
            <ReBorrowLogo size={44} className="h-11 w-11 shadow-sm transition-transform hover:scale-105" />
          </div>
          <h1 className="mt-4 text-2xl font-black text-gray-900 tracking-tight">Sign In to ReBorrow</h1>
          <p className="mt-1 text-xs text-gray-500">
            Access community items, borrow requests, and real-time neighborhood chats.
          </p>
        </div>

        {/* Community Members Quick Selector */}
        <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50/50 p-3.5 text-xs space-y-2">
          <div className="flex items-center gap-1.5 text-brand-900 font-bold">
            <UserCheck className="h-3.5 w-3.5 text-brand-600" />
            <span>Select Community Account:</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {COMMUNITY_USERS.map((u) => (
              <button
                key={u.email}
                type="button"
                onClick={() => selectUser(u.email)}
                className="truncate rounded-xl border border-brand-200 bg-white px-2.5 py-1.5 text-left text-[11px] font-semibold text-brand-900 shadow-2xs hover:bg-brand-50 hover:border-brand-300 transition-colors"
              >
                {u.label}
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4" noValidate>
          <div>
            <label htmlFor="email" className="block text-xs font-semibold text-gray-700">
              Email Address
            </label>
            <div className="relative mt-1">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-3.5 text-xs font-medium text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Please enter a valid email address',
                  },
                })}
              />
            </div>
            {errors.email && (
              <p className="mt-1 text-[11px] text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-xs font-semibold text-gray-700">
              Password
            </label>
            <div className="relative mt-1">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-3.5 text-xs font-medium text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                {...register('password', {
                  required: 'Password is required',
                })}
              />
            </div>
            {errors.password && (
              <p className="mt-1 text-[11px] text-red-600">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-xs font-bold text-white shadow-md transition-all hover:bg-brand-700 active:scale-98 disabled:opacity-50"
          >
            <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 border-t border-gray-100 pt-5 text-center text-xs text-gray-500">
          <span>Don't have an account? </span>
          <Link to="/register" className="font-bold text-brand-600 hover:text-brand-800">
            Sign up now
          </Link>
        </div>
      </div>
    </div>
  );
}
