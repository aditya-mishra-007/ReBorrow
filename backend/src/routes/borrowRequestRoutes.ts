import { Router } from 'express';
import {
  createBorrowRequest,
  getMyBorrowRequests,
  getIncomingBorrowRequests,
  approveBorrowRequest,
  rejectBorrowRequest,
} from '../controllers/borrowRequestController';
import { protect } from '../middleware/authMiddleware';

/**
 * BorrowRequest Routes
 * ------------------------------------------------------------------
 * Mounts under /api/borrow-requests in the main app (see app.ts / server.ts).
 * ALL routes in this file are private — borrowing activity is never
 * exposed publicly, since it reveals user-to-user relationships and
 * asset ownership intent.
 *
 *   POST    /api/borrow-requests               -> Create a new request (requester)
 *   GET     /api/borrow-requests/my-requests    -> Requests I've made (requester view)
 *   GET     /api/borrow-requests/incoming       -> Requests on my assets (owner view)
 *   PATCH   /api/borrow-requests/:id/approve    -> Approve a request (owner only, enforced in controller)
 *   PATCH   /api/borrow-requests/:id/reject     -> Reject a request (owner only, enforced in controller)
 *
 * Route ordering note: '/my-requests' and '/incoming' are static
 * segments placed BEFORE any dynamic '/:id' pattern would be declared.
 * This file has no top-level '/:id' route, so there's no actual
 * collision risk here — but the ordering is kept deliberately in case
 * a future 'GET /:id' (single request detail) route is added, so it
 * doesn't accidentally swallow these static paths.
 */
const router = Router();

// All borrow request routes require authentication
router.use(protect);

router.post('/', createBorrowRequest);
router.get('/my-requests', getMyBorrowRequests);
router.get('/incoming', getIncomingBorrowRequests);
router.patch('/:id/approve', approveBorrowRequest);
router.patch('/:id/reject', rejectBorrowRequest);

export default router;