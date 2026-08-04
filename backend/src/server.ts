import dotenv from 'dotenv';

// Load environment variables FIRST, before importing anything that
// depends on them (e.g., app.ts references process.env.CLIENT_URL at
// module-load time for CORS config). Order matters here.
dotenv.config();

import app from './app';
import connectDB from './config/db';

/**
 * server.ts
 * ------------------------------------------------------------------
 * Application entry point. Responsibilities:
 *   1. Load environment variables (.env)
 *   2. Connect to MongoDB
 *   3. Start the HTTP server, listening on the configured port
 *   4. Register process-level safety nets for uncaught errors
 *
 * Deliberately separated from app.ts so the Express app itself stays
 * side-effect-free and testable (see app.ts notes).
 */

const PORT = process.env.PORT || 5000;

/**
 * startServer
 * ------------------------------------------------------------------
 * Async bootstrap function. Connects to the database BEFORE binding
 * the HTTP listener — this guarantees the server never accepts
 * traffic while the DB connection is still pending or has failed
 * (connectDB() itself calls process.exit(1) on failure, so reaching
 * app.listen() implies a healthy DB connection).
 */
const startServer = async (): Promise<void> => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log(
        `ReBorrow API server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`
      );
    });

    // --- Graceful shutdown for the HTTP server itself ---
    // Complements the MongoDB connection shutdown handlers already
    // registered in db.ts. Ensures in-flight HTTP requests are allowed
    // to complete before the process exits, rather than being dropped
    // abruptly mid-response.
    const gracefulShutdown = (signal: string) => {
      console.log(`${signal} received: closing HTTP server gracefully`);
      server.close(() => {
        console.log('HTTP server closed');
        // Note: mongoose.connection.close() is already handled by the
        // SIGINT/SIGTERM listeners registered in db.ts — we don't
        // duplicate that here to avoid double-closing the connection.
      });
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

/**
 * Process-level safety nets
 * ------------------------------------------------------------------
 * Catches errors that fall completely outside Express's request/
 * response cycle — e.g., an unhandled Promise rejection from a
 * fire-and-forget async call, or a synchronous exception thrown
 * outside any try-catch. Without these, Node would either crash
 * silently or (in older versions) continue running in a corrupted
 * state. We log clearly and exit deliberately so process managers
 * (PM2, Docker, Kubernetes) can restart the process cleanly.
 */
process.on('unhandledRejection', (reason: unknown) => {
  console.error('Unhandled Promise Rejection:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error: Error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();