import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import User from './models/User';

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