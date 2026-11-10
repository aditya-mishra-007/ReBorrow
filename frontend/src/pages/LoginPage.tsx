import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/api';
import type { LoginPayload } from '@/types';
import { Sparkles, ArrowRight, Lock, Mail } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const fillDemoCredentials = () => {
    setValue('email', 'priya@demo.com');
    setValue('password', 'Demo1234!');
  };

  return (
    <div className="mx-auto max-w-md py-6 sm:py-10">
      <div className="overflow-hidden rounded-3xl border border-gray-200/90 bg-white p-8 shadow-xl sm:p-10">
        <div className="text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-gray-900 tracking-tight">Welcome Back</h1>
          <p className="mt-1 text-xs text-gray-500">
            Sign in to access community items, borrow requests, and chats.
          </p>
        </div>

        {/* Demo Account Quick-Fill Card */}
        <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50/60 p-3.5 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-brand-900">Demo User Available</p>
              <p className="text-brand-700/80 text-[11px]">priya@demo.com / Demo1234!</p>
            </div>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-xs hover:bg-brand-700 active:scale-95 transition-all"
            >
              Fill Demo
            </button>
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
