import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import authRoutes from './routes/authRoutes';
import assetRoutes from './routes/assetRoutes';
import borrowRequestRoutes from './routes/borrowRequestRoutes';

/**
 * app.ts
 * ------------------------------------------------------------------
 * Configures the Express application: global middleware stack, route
 * mounting, and centralized error handling. Deliberately separated
 * from server.ts (which handles DB connection + HTTP listening) so
 * this file can be imported directly in tests (e.g., with supertest)
 * without spinning up a real network listener or DB connection.
 */
const app: Express = express();

// ------------------------------------------------------------------
// Security middleware
// ------------------------------------------------------------------

// Sets a range of secure HTTP headers (X-Content-Type-Options,
// Strict-Transport-Security, X-Frame-Options, etc.) with sane defaults.
app.use(helmet());

// CORS configuration: restricts which origins may call this API.
// In production, CLIENT_URL should be set to the exact deployed
// frontend origin (e.g., https://reborrow.app) — falling back to
// permissive localhost only for local development convenience.
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true, // Allows cookies/Authorization headers to be sent cross-origin
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ------------------------------------------------------------------
// Body parsing middleware
// ------------------------------------------------------------------

// Limits set explicitly to guard against oversized payload attacks
// (this app has no file uploads yet, so 100kb is generous headroom
// for typical JSON request bodies like asset descriptions).
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// ------------------------------------------------------------------
// Logging middleware
// ------------------------------------------------------------------

// 'dev' format is concise and colorized — ideal for local development.
// In production, you'd typically swap this for 'combined' format piped
// to a log aggregation service, but keeping 'dev' here for simplicity
// until that infrastructure decision is made.
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// ------------------------------------------------------------------
// Health check endpoint
// ------------------------------------------------------------------

// Useful for uptime monitoring, load balancer health checks, and
// container orchestration (e.g., Kubernetes liveness probes).
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'ReBorrow API is running',
    timestamp: new Date().toISOString(),
  });
});

// ------------------------------------------------------------------
// Route mounting
// ------------------------------------------------------------------

app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/borrow-requests', borrowRequestRoutes);

// ------------------------------------------------------------------
// 404 handler
// ------------------------------------------------------------------

// Catches any request that didn't match a defined route above.
// Must be placed AFTER all route mounting but BEFORE the error handler.
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });
});

// ------------------------------------------------------------------
// Global error handler
// ------------------------------------------------------------------

/**
 * Centralized fallback error handler. Catches any error passed via
 * `next(error)` that wasn't already handled by a controller's own
 * try-catch block (controllers in this app handle their own errors
 * directly, so this primarily serves as a safety net for:
 *   - Errors thrown in middleware outside of a controller's try-catch
 *   - Unexpected synchronous errors in route matching
 *   - Malformed JSON in request bodies (thrown by express.json())
 *
 * Must be declared with exactly 4 parameters (err, req, res, next) —
 * Express identifies error-handling middleware specifically by this
 * arity, even though `next` is unused here.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: Error, req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled error:', err);

  // express.json() throws a SyntaxError with a `body` property when
  // it fails to parse malformed JSON — worth a specific, friendly message.
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      message: 'Malformed JSON in request body',
    });
    return;
  }

  res.status(500).json({
    success: false,
    message: 'An unexpected server error occurred',
  });
});

export default app;