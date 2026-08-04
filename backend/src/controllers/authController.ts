import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User, { IUser } from '../models/User';
import { AuthRequest } from '../middleware/authMiddleware';

/**
 * generateToken
 * ------------------------------------------------------------------
 * Signs a JWT containing the user's ID. Expiry is configurable via
 * env (defaults to 30 days) to balance security vs. UX friction.
 *
 * Kept as a private helper in this file rather than a shared util,
 * since token issuance is exclusively an auth-controller concern.
 */
const generateToken = (userId: string): string => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    // This should never happen in a correctly configured environment,
    // but we fail loudly rather than signing with `undefined`.
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  return jwt.sign({ id: userId }, jwtSecret, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 *
 * Flow:
 * 1. Validate presence of required fields.
 * 2. Check for existing user with the same email (case-insensitive,
 *    since the schema lowercases email on save).
 * 3. Create the user — password hashing happens automatically via the
 *    pre-save hook defined on the User model.
 * 4. Issue a JWT and return it alongside sanitized user data.
 */
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // --- Input validation ---
    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide name, email, and password',
      });
      return;
    }

    if (password.length < 8) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
      return;
    }

    // --- Duplicate check ---
    const normalizedEmail = String(email).toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'An account with this email already exists',
      });
      return;
    }

    // --- Create user (password hashed via pre-save hook) ---
    const user: IUser = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password,
    });

    const token = generateToken(user._id.toString());

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    // Handle Mongoose validation errors distinctly for clearer client feedback
    if (error instanceof Error && error.name === 'ValidationError') {
      res.status(400).json({
        success: false,
        message: error.message,
      });
      return;
    }

    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
    });
  }
};

/**
 * @desc    Authenticate a user and return a JWT
 * @route   POST /api/auth/login
 * @access  Public
 *
 * Flow:
 * 1. Validate presence of email/password.
 * 2. Fetch the user WITH the password field explicitly selected
 *    (schema has select: false by default).
 * 3. Use the `matchPassword` instance method to compare credentials.
 * 4. Issue a JWT on success.
 *
 * Security note: We return the same generic "Invalid credentials"
 * message whether the email doesn't exist OR the password is wrong.
 * This prevents user-enumeration attacks via differing error messages.
 */
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
      return;
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    // Explicitly select password since it's excluded by default
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
      return;
    }

    const token = generateToken(user._id.toString());

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
    });
  }
};

/**
 * @desc    Get the currently authenticated user's profile
 * @route   GET /api/auth/me
 * @access  Private (requires `protect` middleware)
 *
 * Relies on `req.user` being populated by the `protect` middleware
 * from authMiddleware.ts. Since that middleware fetches the user via
 * `User.findById` (password excluded by default), it's already safe
 * to return directly.
 */
export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        _id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        createdAt: req.user.createdAt,
      },
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching profile',
    });
  }
};