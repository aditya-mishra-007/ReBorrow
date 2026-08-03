// backend/src/routes/assetRoutes.ts
import { Router } from 'express';
import { getAssets, createAsset } from '../controllers/assetController';
import { protect } from '../middleware/authMiddleware'; // Make sure your auth middleware attaches req.user

const router = Router();

router.get('/', getAssets);
router.post('/', protect, createAsset);

export default router;