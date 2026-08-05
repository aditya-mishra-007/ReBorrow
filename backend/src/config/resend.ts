import { Resend } from 'resend';

/**
 * resend.ts
 * ------------------------------------------------------------------
 * Configures the Resend email client using credentials from
 * environment variables. Same fail-safe pattern as cloudinary.ts and
 * db.ts — crash loudly at startup rather than fail silently on the
 * first email send attempt.
 */

if (!process.env.RESEND_API_KEY) {
  console.error('FATAL: RESEND_API_KEY is not defined in environment variables');
  process.exit(1);
}

if (!process.env.EMAIL_FROM) {
  console.error('FATAL: EMAIL_FROM is not defined in environment variables');
  process.exit(1);
}

export const resend = new Resend(process.env.RESEND_API_KEY);
export const EMAIL_FROM = process.env.EMAIL_FROM;