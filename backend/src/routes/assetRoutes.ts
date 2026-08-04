import { Router } from 'express';
import {
  createAsset,
  getAssets,
  getAssetById,
  updateAsset,
  deleteAsset,
  deleteAssetImage,
} from '../controllers/assetController';
import { protect, optionalAuth } from '../middleware/authMiddleware';
import { uploadAssetImages } from '../middleware/uploadMiddleware';

/**
 * Asset Routes
 * ------------------------------------------------------------------
 * Mounts under /api/assets in the main app (see app.ts / server.ts).
 *
 *   GET    /api/assets            -> Public (optionalAuth): list/search/filter/paginate assets
 *   GET    /api/assets/:id        -> Public:  fetch a single asset
 *   POST   /api/assets            -> Private: create a new asset listing (multipart/form-data, up to 5 images)
 *   PUT    /api/assets/:id        -> Private: update an asset (owner-only, enforced in controller)
 *   DELETE /api/assets/:id        -> Private: delete an asset (owner-only, enforced in controller)
 *   DELETE /api/assets/:id/images -> Private: remove a single image from an asset (owner-only)
 */
const router = Router();

router.get('/', optionalAuth, getAssets);
router.get('/:id', getAssetById);

router.post('/', protect, uploadAssetImages, createAsset);
router.put('/:id', protect, updateAsset);
router.delete('/:id', protect, deleteAsset);
router.delete('/:id/images', protect, deleteAssetImage);

export default router;