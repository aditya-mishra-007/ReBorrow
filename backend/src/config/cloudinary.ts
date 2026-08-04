import { v2 as cloudinary } from 'cloudinary';

/**
 * cloudinary.ts
 * ------------------------------------------------------------------
 * Configures the Cloudinary SDK using credentials from environment
 * variables. Imported once here and reused everywhere else that
 * needs to upload or delete images — never re-configured per-request.
 *
 * Fails fast and loudly at startup if credentials are missing, same
 * fail-safe pattern as db.ts's MONGO_URI check — better to crash on
 * boot than silently fail on the first image upload attempt.
 */

const requiredEnvVars = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];

for (const key of requiredEnvVars) {
  if (!process.env[key]) {
    console.error(`FATAL: ${key} is not defined in environment variables`);
    process.exit(1);
  }
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // always return https URLs
});

export default cloudinary;