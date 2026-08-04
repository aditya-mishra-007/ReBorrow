import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';
import User, { IUser } from '../models/User';

/**
 * AuthRequest
 * ------------------------------------------------------------------
 * Extends Express's Request to carry an authenticated user document.
 * Controllers downstream of `protect` middleware can safely assume
 * `req.user` is populated and typed as IUser (minus the password field,
 * which is never selected during this lookup).
 */
export interface AuthRequest extends Request {
  user?: IUser;
}

/**
 * DecodedToken
 * ------------------------------------------------------------------
 * Shape of the payload we expect after verifying our own JWTs.
 * We only ever sign `{ id: <userId> }` at login/register time, so
 * this interface stays intentionally minimal.
 */
interface DecodedToken extends JwtPayload {
  id: string;
}

/**
 * protect
 * ------------------------------------------------------------------
 * Authentication middleware. Verifies a Bearer JWT from the
 * `Authorization` header, resolves the corresponding user from the
 * database, and attaches it to `req.user` for downstream handlers.
 *
 * Security considerations:
 * - Rejects requests with missing/malformed Authorization headers.
 * - Verifies token signature & expiry via jwt.verify (throws on tampering).
 * - Re-fetches the user from DB on every request (rather than trusting
 *   the JWT payload alone) so that deleted/deactivated users are
 *   immediately locked out, even with a still-valid token.
 * - Never leaks internal error details (e.g., JWT secret issues) to the client.
 */
export const protect = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  let token: string | undefined;

  try {
    const authHeader = req.headers.authorization;

    // Expecting format: "Bearer <token>"
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Not authorized, no token provided',
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      // Fail safely rather than verifying against `undefined`, which
      // would be a critical security hole if it ever fell through.
      console.error('FATAL: JWT_SECRET is not defined in environment variables');
      res.status(500).json({
        success: false,
        message: 'Server configuration error',
      });
      return;
    }

    // Throws JsonWebTokenError / TokenExpiredError on failure — caught below.
    const decoded = jwt.verify(token, jwtSecret) as DecodedToken;

    // Re-fetch the user to ensure they still exist and to get fresh data.
    // Password is excluded by default schema config (select: false).
    const user = await User.findById(decoded.id);

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Not authorized, user no longer exists',
      });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    // Covers invalid signature, malformed token, and expired token cases.
    // We deliberately return a generic message to avoid leaking whether
    // the failure was due to expiry vs. tampering vs. malformed input.
    res.status(401).json({
      success: false,
      message: 'Not authorized, token failed verification',
    });
  }
};

/**
 * authorizeRoles
 * ------------------------------------------------------------------
 * Authorization middleware factory. Restricts access to users whose
 * `role` matches one of the allowed roles passed in.
 *
 * Must be used AFTER `protect`, since it depends on `req.user` being
 * populated. Usage example:
 *
 *   router.delete('/assets/:id', protect, authorizeRoles('admin'), deleteAsset);
 *
 * @param allowedRoles - list of roles permitted to access the route
 */
export const authorizeRoles = (...allowedRoles: Array<'user' | 'admin'>) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      // Defensive guard in case this middleware is mistakenly used
      // without `protect` running first.
      res.status(401).json({
        success: false,
        message: 'Not authorized, no authenticated user found',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not permitted to perform this action`,
      });
      return;
    }

    next();
  };
};


/**
 * optionalAuth
 * ------------------------------------------------------------------
 * Like `protect`, but never blocks the request. If a valid Bearer
 * token is present, `req.user` is populated exactly as `protect`
 * would. If the token is missing, malformed, expired, or belongs to
 * a deleted user, the request simply proceeds with `req.user`
 * left undefined — no 401 is ever returned by this middleware.
 *
 * Use this on PUBLIC routes that want to behave differently for
 * logged-in users without requiring login (e.g., GET /api/assets
 * supporting an `owner=me` filter for authenticated callers while
 * still allowing anonymous browsing).
 */
export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token) {
      next();
      return;
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      // Same fail-safe as `protect`, but we still let the request
      // through unauthenticated rather than 500ing a public route.
      console.error('FATAL: JWT_SECRET is not defined in environment variables');
      next();
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as DecodedToken;
    const user = await User.findById(decoded.id);

    if (user) {
      req.user = user;
    }

    next();
  } catch {
    // Invalid/expired token on a PUBLIC route — proceed as anonymous
    // rather than blocking. Unlike `protect`, this is not an error
    // condition here.
    next();
  }
};