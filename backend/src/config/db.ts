import mongoose from 'mongoose';

/**
 * connectDB
 * ------------------------------------------------------------------
 * Establishes a connection to MongoDB using the URI supplied via
 * environment variables. Designed to be called once at server startup
 * (see server.ts).
 *
 * Production considerations:
 * - Fails fast and loudly if MONGO_URI is missing — we never want the
 *   app to silently run without a database connection.
 * - Exits the process on connection failure (process.exit(1)) rather
 *   than letting the server start in a broken state, since every
 *   route in this app depends on DB access.
 * - Registers listeners for post-initial-connection events
 *   (disconnection, reconnection, runtime errors) so operational
 *   issues are visible in logs rather than failing silently.
 *
 * Note on transactions: As flagged in borrowRequestController.ts,
 * this app relies on MongoDB transactions (multi-document ACID
 * sessions) for the borrow-request approve/reject/create workflows.
 * Transactions REQUIRE the target MongoDB deployment to be a replica
 * set (MongoDB Atlas clusters satisfy this by default, including the
 * free M0 tier). A standalone local `mongod` instance will throw a
 * runtime error the first time a transaction is attempted, even
 * though the initial connection here will succeed without complaint.
 */
const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('FATAL: MONGO_URI is not defined in environment variables');
    process.exit(1);
  }

  try {
    // Mongoose 7+ no longer requires useNewUrlParser/useUnifiedTopology
    // (they're the default behavior now), so we omit deprecated options.
    const conn = await mongoose.connect(mongoUri);

    console.log(`MongoDB connected: ${conn.connection.host}`);

    // --- Runtime connection event listeners ---
    mongoose.connection.on('error', (err) => {
      console.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect is handled by the driver.');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected successfully');
    });

    // --- Graceful shutdown handling ---
    // Ensures the connection is closed cleanly on process termination
    // (e.g., during deploys, container restarts, or manual Ctrl+C),
    // preventing dangling connections or corrupted in-flight writes.
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination (SIGINT)');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to app termination (SIGTERM)');
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

export default connectDB;