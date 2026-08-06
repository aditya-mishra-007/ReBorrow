import 'dotenv/config';

import http from 'http';
import app from './app';
import connectDB from './config/db';
import { initializeSocket } from './socket';

/**
 * server.ts
 * ------------------------------------------------------------------
 * Application entry point. Responsibilities:
 *   1. Load environment variables (via 'dotenv/config' side-effect import)
 *   2. Connect to MongoDB
 *   3. Create a raw HTTP server wrapping the Express app, and attach
 *      Socket.io to that SAME server — this is why we now import
 *      Node's `http` module directly instead of calling app.listen()
 *      as before: Socket.io needs to intercept the underlying HTTP
 *      server's upgrade requests (for the WebSocket handshake), which
 *      app.listen() would otherwise handle in a way Socket.io can't
 *      hook into.
 *   4. Start the HTTP server, listening on the configured port
 *   5. Register process-level safety nets for uncaught errors
 */

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    // Create the raw HTTP server explicitly (rather than app.listen())
    // so Socket.io can attach to it.
    const httpServer = http.createServer(app);

    // Initialize Socket.io on the same server/port — no separate port
    // or process needed.
    initializeSocket(httpServer);

    httpServer.listen(PORT, () => {
      console.log(
        `ReBorrow API server (HTTP + WebSocket) running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
      );
    });

    const gracefulShutdown = (signal: string) => {
      console.log(`${signal} received: closing HTTP server gracefully`);
      httpServer.close(() => {
        console.log('HTTP server closed');
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason: unknown) => {
  console.error('Unhandled Promise Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();