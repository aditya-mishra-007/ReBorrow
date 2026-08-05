import { Router } from 'express';
import {
  getStats,
  getAllUsers,
  deleteUser,
  updateUserRole,
  getAllAssetsAdmin,
  deleteAssetAdmin,
} from '../controllers/adminController';
import { protect, authorizeRoles } from '../middleware/authMiddleware';

/**
 * Admin Routes
 * ------------------------------------------------------------------
 * Mounts under /api/admin in the main app (see app.ts / server.ts).
 * EVERY route here requires both a valid JWT AND the 'admin' role —
 * applied once at the router level so no individual route can
 * accidentally be left unprotected.
 *
 *   GET    /api/admin/stats           -> Platform summary stats
 *   GET    /api/admin/users           -> List all users (paginated)
 *   DELETE /api/admin/users/:id       -> Delete a user + cascade their data
 *   PATCH  /api/admin/users/:id/role  -> Promote/demote a user's role
 *   GET    /api/admin/assets          -> List all assets platform-wide (paginated)
 *   DELETE /api/admin/assets/:id      -> Delete any asset (moderation, bypasses owner check)
 */
const router = Router();

router.use(protect, authorizeRoles('admin'));

router.get('/stats', getStats);
router.get('/users', getAllUsers);
router.delete('/users/:id', deleteUser);
router.patch('/users/:id/role', updateUserRole);
router.get('/assets', getAllAssetsAdmin);
router.delete('/assets/:id', deleteAssetAdmin);

export default router;