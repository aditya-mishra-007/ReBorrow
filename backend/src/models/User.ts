import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcrypt';

/**
 * IUser
 * ------------------------------------------------------------------
 * TypeScript interface describing the shape of a User document.
 * Extends Mongoose's Document to inherit _id, timestamps helpers, etc.
 *
 * Note: `password` is intentionally typed as a string here even though
 * it is excluded from queries by default (select: false) at the schema
 * level. When we explicitly `.select('+password')` during login, this
 * type remains accurate.
 */
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
  matchPassword(enteredPassword: string): Promise<boolean>;
}

/**
 * UserSchema
 * ------------------------------------------------------------------
 * Defines validation rules, indexing, and storage behavior for the
 * User collection.
 */
const UserSchema: Schema<IUser> = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      // Basic RFC-5322-ish email validation. Keeps false positives low
      // without pulling in a full validator dependency at the schema level.
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false, // Never returned in queries unless explicitly requested
    },
    role: {
      type: String,
      enum: {
        values: ['user', 'admin'],
        message: '{VALUE} is not a supported role',
      },
      default: 'user',
    },
  },
  {
    timestamps: true, // Automatically manages createdAt / updatedAt
  }
);

/**
 * Pre-save hook: Password Hashing
 * ------------------------------------------------------------------
 * Runs before every save operation. Only re-hashes the password if it
 * has been newly set or modified — this prevents re-hashing an already
 *-hashed password on unrelated updates (e.g., updating `name`).
 *
 * Uses bcrypt with a cost factor (salt rounds) of 12, which is a strong
 * balance between security and performance for production use.
 */
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const SALT_ROUNDS = 12;
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    // Pass any hashing errors to Mongoose's error handling pipeline
    next(error as Error);
  }
});

/**
 * Instance Method: matchPassword
 * ------------------------------------------------------------------
 * Compares a plaintext password (e.g., from a login request) against
 * the hashed password stored on this user document.
 *
 * IMPORTANT: Since `password` has `select: false`, the calling code
 * (e.g., the auth controller) MUST explicitly fetch the password field
 * via `.select('+password')` when querying the user for login,
 * otherwise `this.password` will be undefined here.
 *
 * @param enteredPassword - The raw, plaintext password submitted by the user
 * @returns Promise<boolean> - true if passwords match, false otherwise
 */
UserSchema.methods.matchPassword = async function (
  enteredPassword: string
): Promise<boolean> {
  // Defensive check: if password wasn't selected on this document instance,
  // fail closed rather than throwing an obscure bcrypt error.
  if (!this.password) {
    throw new Error(
      'Password field not selected on this User document. Use .select("+password") when querying.'
    );
  }
  return bcrypt.compare(enteredPassword, this.password);
};

/**
 * User Model
 * ------------------------------------------------------------------
 * Exported as the default. Named `User` and mapped to the `users`
 * collection in MongoDB by Mongoose's pluralization convention.
 */
const User: Model<IUser> = mongoose.model<IUser>('User', UserSchema);

export default User;