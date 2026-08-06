import { Response } from 'express';
import mongoose from 'mongoose';
import Conversation from '../models/Conversation';
import Message from '../models/Message';
import Asset from '../models/Asset';
import { AuthRequest } from '../middleware/authMiddleware';
import { getIO } from '../socket';

/**
 * messageController.ts
 * ------------------------------------------------------------------
 * REST endpoints for chat persistence and history. Real-time delivery
 * of new messages to an online recipient happens via Socket.io (see
 * socket.ts) — this controller both saves to the database AND emits
 * the socket event, so a message is never delivered live without
 * also being durably persisted first.
 */

/**
 * @desc    Start (or resume) a conversation with another user about an asset
 * @route   POST /api/messages/conversations
 * @access  Private
 *
 * Idempotent: if a conversation already exists between these two
 * users for this asset, returns the existing one rather than creating
 * a duplicate (enforced by Conversation's unique compound index as a
 * safety net, but we check first for a clean response either way).
 */
export const startConversation = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }

    const { recipientId, assetId } = req.body;

    if (!recipientId || typeof recipientId !== 'string' || !mongoose.Types.ObjectId.isValid(recipientId)) {
      res.status(400).json({ success: false, message: 'Valid recipientId is required' });
      return;
    }

    if (recipientId === req.user._id.toString()) {
      res.status(400).json({ success: false, message: 'You cannot start a conversation with yourself' });
      return;
    }

    if (assetId && (typeof assetId !== 'string' || !mongoose.Types.ObjectId.isValid(assetId))) {
      res.status(400).json({ success: false, message: 'Invalid asset ID' });
      return;
    }

    if (assetId) {
      const asset = await Asset.findById(assetId);
      if (!asset) {
        res.status(404).json({ success: false, message: 'Asset not found' });
        return;
      }
    }

    const participants = [req.user._id, new mongoose.Types.ObjectId(recipientId)].sort((a, b) =>
      a.toString().localeCompare(b.toString())
    );

    let conversation = await Conversation.findOne({
      participants,
      asset: assetId || { $exists: false },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants,
        asset: assetId || undefined,
      });
    }

    const populated = await Conversation.findById(conversation._id)
      .populate('participants', 'name email')
      .populate('asset', 'name images');

    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    console.error('Start conversation error:', error);
    res.status(500).json({ success: false, message: 'Server error while starting conversation' });
  }
};

/**
 * @desc    Get all conversations for the current user, sorted by most recent activity
 * @route   GET /api/messages/conversations
 * @access  Private
 */
export const getMyConversations = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }

    const conversations = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'name email')
      .populate('asset', 'name images')
      .sort({ lastMessageAt: -1 });

    // Compute an unread count per conversation — the number of
    // messages in each thread not sent by the current user AND not
    // yet in that message's readBy array.
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (convo) => {
        const unreadCount = await Message.countDocuments({
          conversation: convo._id,
          sender: { $ne: req.user!._id },
          readBy: { $ne: req.user!._id },
        });
        return { ...convo.toObject(), unreadCount };
      })
    );

    res.status(200).json({ success: true, data: conversationsWithUnread });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching conversations' });
  }
};

/**
 * @desc    Get message history for a conversation (paginated, newest last)
 * @route   GET /api/messages/conversations/:id/messages
 * @access  Private (must be a participant)
 */
export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }

    const { id } = req.params;

    if (typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid conversation ID' });
      return;
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      res.status(404).json({ success: false, message: 'Conversation not found' });
      return;
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user!._id.toString()
    );
    if (!isParticipant) {
      res.status(403).json({ success: false, message: 'You are not part of this conversation' });
      return;
    }

    const page = Math.max(1, parseInt(String(req.query.page), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit), 10) || 50));
    const skip = (page - 1) * limit;

    const [totalCount, messages] = await Promise.all([
      Message.countDocuments({ conversation: id }),
      Message.find({ conversation: id })
        .populate('sender', 'name email')
        .sort({ createdAt: -1 }) // newest first for pagination...
        .skip(skip)
        .limit(limit),
    ]);

    // ...then reverse to chronological order for display (oldest at
    // top, newest at bottom) — matches a normal chat UI's reading order.
    messages.reverse();

    // Mark all messages not sent by this user as read.
    await Message.updateMany(
      { conversation: id, sender: { $ne: req.user._id }, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    );

    res.status(200).json({
      success: true,
      data: messages,
      pagination: {
        currentPage: page,
        totalPages: Math.max(1, Math.ceil(totalCount / limit)),
        totalCount,
        limit,
      },
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching messages' });
  }
};

/**
 * @desc    Send a message in a conversation
 * @route   POST /api/messages/conversations/:id/messages
 * @access  Private (must be a participant)
 *
 * Persists the message AND emits it live via Socket.io to the
 * recipient if they're currently connected — see socket.ts for the
 * room-join convention (each user joins a room named after their own
 * user ID on connection, so we can emit directly to `recipientId`
 * without needing to track socket IDs ourselves).
 */
export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Not authorized' });
      return;
    }

    const { id } = req.params;
    const { text } = req.body;

    if (typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ success: false, message: 'Invalid conversation ID' });
      return;
    }

    if (!text || typeof text !== 'string' || !text.trim()) {
      res.status(400).json({ success: false, message: 'Message text is required' });
      return;
    }

    const conversation = await Conversation.findById(id);
    if (!conversation) {
      res.status(404).json({ success: false, message: 'Conversation not found' });
      return;
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user!._id.toString()
    );
    if (!isParticipant) {
      res.status(403).json({ success: false, message: 'You are not part of this conversation' });
      return;
    }

    const trimmedText = text.trim();

    const message = await Message.create({
      conversation: id,
      sender: req.user._id,
      text: trimmedText,
      readBy: [req.user._id],
    });

    conversation.lastMessageAt = new Date();
    conversation.lastMessageText = trimmedText;
    await conversation.save();

    const populatedMessage = await Message.findById(message._id).populate('sender', 'name email');

    res.status(201).json({ success: true, data: populatedMessage });

    // --- Real-time delivery via Socket.io ---
    // Wrapped defensively: if Socket.io hasn't initialized for any
    // reason, chat still works via REST + polling/refresh — real-time
    // delivery is an enhancement, not the only way messages arrive.
    try {
      const io = getIO();
      const recipientId = conversation.participants.find(
        (p) => p.toString() !== req.user!._id.toString()
      );
      if (recipientId) {
        io.to(recipientId.toString()).emit('new_message', {
          conversationId: id,
          message: populatedMessage,
        });
      }
    } catch (socketError) {
      console.error('Socket emit failed (non-fatal):', socketError);
    }
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ success: false, message: 'Server error while sending message' });
  }
};