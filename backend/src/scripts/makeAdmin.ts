import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import User from '../models/User';

/**
 * makeAdmin.ts
 * ------------------------------------------------------------------
 * One-off CLI script to promote an existing user to the 'admin' role
 * by email. This is intentionally NOT exposed via any API route —
 * granting admin access should always be a deliberate, out-of-band
 * action (direct DB/script access), never something reachable over
 * HTTP, even behind auth.
 *
 * Usage: npm run make-admin -- your-email@example.com
 */
async function makeAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error('Usage: npm run make-admin -- <email>');
    process.exit(1);
  }

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('MONGO_URI not set in .env');
    process.exit(1);
  }

  await mongoose.connect(mongoUri);

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user) {
    console.error(`No user found with email: ${email}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  user.role = 'admin';
  await user.save();

  console.log(`✅ ${user.name} (${user.email}) is now an admin.`);

  await mongoose.disconnect();
  process.exit(0);
}

makeAdmin().catch((error) => {
  console.error('Failed to promote user:', error);
  process.exit(1);
});