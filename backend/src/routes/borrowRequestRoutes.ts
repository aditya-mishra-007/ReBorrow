import { Router } from 'express';
import {
  createBorrowRequest,
  getMyBorrowRequests,
  getIncomingBorrowRequests,
  approveBorrowRequest,
  rejectBorrowRequest,
  cancelBorrowRequest,
} from '../controllers/borrowRequestController';
import { protect } from '../middleware/authMiddleware';

/**
 * BorrowRequest Routes
 * ------------------------------------------------------------------
 * Mounts under /api/borrow-requests in the main app (see app.ts / server.ts).
 * ALL routes in this file are private.
 *
 *   POST    /api/borrow-requests               -> Create a new request (requester)
 *   GET     /api/borrow-requests/my-requests    -> Requests I've made (requester view)
 *   GET     /api/borrow-requests/incoming       -> Requests on my assets (owner view)
 *   PATCH   /api/borrow-requests/:id/approve    -> Approve a request (owner only, enforced in controller)
 *   PATCH   /api/borrow-requests/:id/reject     -> Reject a request (owner only, enforced in controller)
 *   PATCH   /api/borrow-requests/:id/cancel     -> Cancel a request (requester only, enforced in controller)
 */
const router = Router();

router.use(protect);

router.post('/', createBorrowRequest);
router.get('/my-requests', getMyBorrowRequests);
router.get('/incoming', getIncomingBorrowRequests);
router.patch('/:id/approve', approveBorrowRequest);
router.patch('/:id/reject', rejectBorrowRequest);
router.patch('/:id/cancel', cancelBorrowRequest);

export default router;