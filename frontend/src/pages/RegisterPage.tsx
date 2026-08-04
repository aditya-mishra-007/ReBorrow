import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';
import { getErrorMessage } from '@/lib/api';
import type { RegisterPayload } from '@/types';

/**
 * RegisterPage.tsx
 * ------------------------------------------------------------------
 * Public route: /register
 *
 * Handles new user sign-up. On success, the backend's registerUser
 * controller immediately returns a valid JWT (see authController.ts),
 * so a successful registration logs the user straight in — no
 * separate "verify email then log in" step exists in this app.
 */

/**
 * RegisterFormValues
 * ------------------------------------------------------------------
 * Extends RegisterPayload with a client-only `confirmPassword` field.
 * This field is NEVER sent to the backend — it exists purely for
 * client-side validation (catching typos before submission) and is
 * stripped out before calling the register() API function.
 */
interface RegisterFormValues extends RegisterPayload {
  confirmPassword: string;
}

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<RegisterFormValues>();

  // Watched so the confirmPassword field's validation rule can compare
  // against the live value of the password field as the user types.
  const passwordValue = watch('password');

  const onSubmit = async (formValues: RegisterFormValues) => {
    setIsSubmitting(true);
    try {
      // Strip confirmPassword before sending — the backend has no
      // knowledge of or use for this field.
      const { name, email, password } = formValues;
      await registerUser({ name, email, password });
      toast.success('Account created! Welcome to ReBorrow.');
      navigate('/', { replace: true });
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-md">
      <div className="rounded-lg border border-gray-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-gray-900">Create your account</h1>
        <p className="mt-1 text-sm text-gray-500">
          Join ReBorrow to start lending and borrowing.
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5" noValidate>
          {/* --- Name field --- */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:border-brand-500"
              {...register('name', {
                required: 'Name is required',
                minLength: { value: 2, message: 'Name must be at least 2 characters' },
                maxLength: { value: 50, message: 'Name cannot exceed 50 characters' },
              })}
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
          </div>

          {/* --- Email field --- */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:border-brand-500"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Enter a valid email address',
                },
              })}
            />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
          </div>

          {/* --- Password field --- */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:border-brand-500"
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' },
              })}
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
          </div>

          {/* --- Confirm password field --- */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus-visible:border-brand-500"
              {...register('confirmPassword', {
                required: 'Please confirm your password',
                validate: (value) => value === passwordValue || 'Passwords do not match',
              })}
            />
            {errors.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-md bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-brand-600 hover:text-brand-700">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}