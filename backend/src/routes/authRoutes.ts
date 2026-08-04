import { Router } from 'express';
import { registerUser, loginUser, getCurrentUser } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

/**
 * Auth Routes
 * ------------------------------------------------------------------
 * Mounts under /api/auth in the main app (see app.ts / server.ts).
 *
 *   POST   /api/auth/register   -> Public: create a new account
 *   POST   /api/auth/login      -> Public: authenticate & receive JWT
 *   GET    /api/auth/me         -> Private: fetch the logged-in user's profile
 */
const router = Router();

// --- Public routes ---
router.post('/register', registerUser);
router.post('/login', loginUser);

// --- Private routes (require valid JWT via `protect` middleware) ---
router.get('/me', protect, getCurrentUser);

export default router;