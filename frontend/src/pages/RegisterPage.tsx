import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/api';
import type { RegisterPayload } from '@/types';
import { Sparkles, ArrowRight, Lock, Mail, User } from 'lucide-react';

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterPayload>();

  const onSubmit = async (data: RegisterPayload) => {
    setIsSubmitting(true);
    try {
      await registerUser(data);
      toast.success('Account created! Welcome to ReBorrow.');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md py-6 sm:py-10">
      <div className="overflow-hidden rounded-3xl border border-gray-200/90 bg-white p-8 shadow-xl sm:p-10">
        <div className="text-center">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-sm">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="mt-4 text-2xl font-extrabold text-gray-900 tracking-tight">Create Account</h1>
          <p className="mt-1 text-xs text-gray-500">
            Join your local community borrowing network today.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-4" noValidate>
          <div>
            <label htmlFor="name" className="block text-xs font-semibold text-gray-700">
              Full Name
            </label>
            <div className="relative mt-1">
              <User className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="Priya Sharma"
                className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-3.5 text-xs font-medium text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                {...register('name', {
                  required: 'Name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' },
                  maxLength: { value: 50, message: 'Name cannot exceed 50 characters' },
                })}
              />
            </div>
            {errors.name && <p className="mt-1 text-[11px] text-red-600">{errors.name.message}</p>}
          </div>

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
                placeholder="priya@example.com"
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
                autoComplete="new-password"
                placeholder="At least 6 characters"
                className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-3.5 text-xs font-medium text-gray-900 placeholder-gray-400 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password must be at least 6 characters' },
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
            <span>{isSubmitting ? 'Creating account...' : 'Create Account'}</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="mt-6 border-t border-gray-100 pt-5 text-center text-xs text-gray-500">
          <span>Already have an account? </span>
          <Link to="/login" className="font-bold text-brand-600 hover:text-brand-800">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
