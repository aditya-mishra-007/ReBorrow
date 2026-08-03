// backend/src/routes/borrowRoutes.ts
import { Router } from 'express';
import {
  createBorrowRequest,
  getUserRequests,
  updateRequestStatus,
} from '../controllers/borrowController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.use(protect); // Protect all borrowing routes

router.post('/', createBorrowRequest);
router.get('/', getUserRequests);
router.patch('/:id/status', updateRequestStatus);

export default router;