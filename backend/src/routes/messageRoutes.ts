import { Router } from 'express';
import {
  startConversation,
  getMyConversations,
  getMessages,
  sendMessage,
} from '../controllers/messageController';
import { protect } from '../middleware/authMiddleware';

/**
 * Message Routes
 * ------------------------------------------------------------------
 * Mounts under /api/messages. All routes require authentication.
 *
 *   POST   /api/messages/conversations                 -> Start/resume a conversation
 *   GET    /api/messages/conversations                  -> List my conversations
 *   GET    /api/messages/conversations/:id/messages      -> Get message history
 *   POST   /api/messages/conversations/:id/messages      -> Send a message
 */
const router = Router();

router.use(protect);

router.post('/conversations', startConversation);
router.get('/conversations', getMyConversations);
router.get('/conversations/:id/messages', getMessages);
router.post('/conversations/:id/messages', sendMessage);

export default router;