import express from 'express';
import { getAssets, createAsset } from '../controllers/assetController';
import { protect } from '../middleware/authMiddleware';

const router = express.Router();

router.route('/').get(getAssets).post(protect, createAsset);

export default router;