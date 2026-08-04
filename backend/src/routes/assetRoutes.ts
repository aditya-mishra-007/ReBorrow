import { Router } from 'express';
import {
  createAsset,
  getAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
} from '../controllers/assetController';
import { protect, optionalAuth } from '../middleware/authMiddleware';

/**
 * Asset Routes
 * ------------------------------------------------------------------
 * Mounts under /api/assets in the main app (see app.ts / server.ts).
 *
 *   GET    /api/assets          -> Public (optionalAuth): list/search/filter assets,
 *                                   supports ?owner=me for logged-in users
 *   GET    /api/assets/:id      -> Public:  fetch a single asset
 *   POST   /api/assets          -> Private: create a new asset listing
 *   PUT    /api/assets/:id      -> Private: update an asset (owner-only, enforced in controller)
 *   DELETE /api/assets/:id      -> Private: delete an asset (owner-only, enforced in controller)
 *
 * Note: Ownership checks (e.g., "only the owner can update/delete")
 * are NOT done at the routing layer — they require fetching the asset
 * document first, so they're handled inside the controller functions
 * themselves.
 */
const router = Router();

// --- Public routes ---
// optionalAuth populates req.user if a valid token is present, but
// never blocks the request if it's missing — this lets getAssets()
// resolve `?owner=me` for logged-in callers while still allowing
// fully anonymous browsing.
router.get('/', optionalAuth, getAssets);
router.get('/:id', getAssetById);

// --- Private routes (require valid JWT via `protect` middleware) ---
router.post('/', protect, createAsset);
router.put('/:id', protect, updateAsset);
router.delete('/:id', protect, deleteAsset);

export default router;