import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Engineer';
}

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

export const JWT_SECRET = process.env.JWT_SECRET || 'energyops-dev-secret-key-32chars!!';

/**
 * Generates a signed JWT token for a given user
 */
export function generateToken(user: AuthUser, expiresIn = '8h'): string {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: expiresIn as any }
  );
}

/**
 * Authentication middleware that verifies JWT bearer tokens
 * or development header-based credentials (for testing and Streamlit secrets compatibility).
 */
export function authenticate(req: Request, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;
    const apiKeyHeader = req.headers['x-api-key'] as string;
    // 1. Bearer JWT Token
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
        req.user = decoded;
        return next();
      } catch (jwtErr: any) {
        const err: AppError = new Error(
          jwtErr.name === 'TokenExpiredError' ? 'Token expired. Please re-authenticate.' : 'Invalid authentication token.'
        );
        err.statusCode = 401;
        err.code = 'INVALID_TOKEN';
        return next(err);
      }
    }

    // 2. Streamlit / Service API Key authentication (starts with AQ.Ab...)
    if (apiKeyHeader) {
      if (apiKeyHeader.startsWith('AQ.Ab') || apiKeyHeader === process.env.ENERGYOPS_API_KEY) {
        req.user = {
          id: 'SYS-SERVICE-1',
          name: 'Streamlit Cloud Executive',
          email: 'streamlit@energyops.internal',
          role: 'Admin'
        };
        return next();
      } else {
        const err: AppError = new Error('Invalid API Key provided.');
        err.statusCode = 401;
        err.code = 'INVALID_API_KEY';
        return next(err);
      }
    }

    // Unauthenticated (no valid JWT bearer token or API key provided)
    req.user = undefined;
    return next();
  } catch (err) {
    next(err);
  }
}

/**
 * Strict authentication guard: rejects request if no valid user credentials are present
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    const err: AppError = new Error('Authentication required. Provide a valid Bearer JWT token or API Key.');
    err.statusCode = 401;
    err.code = 'UNAUTHORIZED';
    return next(err);
  }
  next();
}

/**
 * Role-based authorization guard: requires user to have one of the allowed roles
 */
export function requireRole(...allowedRoles: Array<'Admin' | 'Manager' | 'Engineer'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      const err: AppError = new Error('Authentication required.');
      err.statusCode = 401;
      err.code = 'UNAUTHORIZED';
      return next(err);
    }

    if (!allowedRoles.includes(req.user.role)) {
      const err: AppError = new Error(
        `Access denied. Role "${req.user.role}" does not have permission. Required: [${allowedRoles.join(', ')}]`
      );
      err.statusCode = 403;
      err.code = 'FORBIDDEN_ROLE';
      return next(err);
    }

    next();
  };
}
