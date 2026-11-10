import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './models/User';
import Conversation from './models/Conversation';

/**
 * socket.ts
 * ------------------------------------------------------------------
 * Initializes and configures the Socket.io server, layered on top of
 * the same underlying HTTP server Express uses (see server.ts) — this
 * is the standard way to run both a REST API and WebSocket server
 * from a single Node process/port, rather than needing two separate
 * servers.
 *
 * Authentication model:
 *   - Every socket connection must present the same JWT used for REST
 *     auth, via the `auth.token` field in the client's connection
 *     handshake (see SocketContext.tsx on the frontend).
 *   - On successful auth, the socket automatically joins a "room"
 *     named after the user's own MongoDB _id. This means any REST
 *     controller (see messageController.ts's sendMessage) can emit an
 *     event directly to `io.to(userId).emit(...)` without needing to
 *     track which raw socket ID belongs to which user — Socket.io's
 *     room mechanism handles that mapping for us, including correctly
 *     delivering to a user with MULTIPLE open tabs/devices at once,
 *     since all of them join the same room.
 *
 * A module-level `io` variable holds the single Socket.io server
 * instance once initialized, retrieved elsewhere via getIO() — this
 * avoids needing to pass the io instance through every controller's
 * function signature.
 */

let io: SocketIOServer | null = null;

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export function initializeSocket(httpServer: HTTPServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  // --- Authentication middleware for every incoming socket connection ---
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        next(new Error('Authentication token required'));
        return;
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        next(new Error('Server configuration error'));
        return;
      }

      const decoded = jwt.verify(token, jwtSecret) as { id: string };
      const user = await User.findById(decoded.id);

      if (!user) {
        next(new Error('User no longer exists'));
        return;
      }

      socket.userId = user._id.toString();
      next();
    } catch {
      next(new Error('Invalid or expired token'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    if (socket.userId) {
      // Each user joins a room named after their own ID — this is the
      // mechanism that lets messageController.ts target a specific
      // user with io.to(userId).emit(...) regardless of how many
      // devices/tabs that user has open simultaneously.
      socket.join(socket.userId);
      console.log(`Socket connected: user ${socket.userId}`);
    }

    socket.on('disconnect', () => {
      if (socket.userId) {
        console.log(`Socket disconnected: user ${socket.userId}`);
      }
    });

    /**
     * join_conversation
     * ------------------------------------------------------------------
     * Client emits this to subscribe to a conversation-specific room,
     * enabling conversation-scoped typing events. After joining, any
     * participant in the same conversation can receive 'typing' events
     * targeted to that room rather than the user's personal room.
     */
    socket.on('join_conversation', (conversationId: string) => {
      if (typeof conversationId === 'string' && conversationId.length > 0) {
        socket.join(`conv:${conversationId}`);
      }
    });

    /**
     * typing
     * ------------------------------------------------------------------
     * Client emits { conversationId, isTyping } when the user starts or
     * stops typing. We look up the Conversation to find the other
     * participant and emit the event directly to their user room — this
     * works even if the other user hasn't called join_conversation,
     * since every user always joins their own userId room on connect.
     */
    socket.on('typing', async ({ conversationId, isTyping }: { conversationId: string; isTyping: boolean }) => {
      if (!socket.userId || typeof conversationId !== 'string') return;

      try {
        const conversation = await Conversation.findById(conversationId).select('participants').lean();
        if (!conversation) return;

        // Find the other participant (not the sender)
        const otherParticipantId = conversation.participants
          .find((p) => p.toString() !== socket.userId)
          ?.toString();

        if (!otherParticipantId) return;

        // Emit to the other user's personal room — always works regardless
        // of whether they've joined the conversation room explicitly.
        io!.to(otherParticipantId).emit('typing', {
          conversationId,
          userId: socket.userId,
          isTyping,
        });
      } catch (err) {
        // Non-critical — typing indicators failing silently is acceptable
        console.error('Typing event error:', err);
      }
    });
  });

  return io;
}

/**
 * getIO
 * ------------------------------------------------------------------
 * Accessor for the initialized Socket.io server instance. Throws if
 * called before initializeSocket() has run — this should only happen
 * if a controller somehow executes before server.ts's startup
 * sequence completes, which shouldn't occur in normal operation, but
 * fails loudly rather than silently if it ever does.
 */
export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.io has not been initialized yet');
  }
  return io;
}