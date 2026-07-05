import { Request, Response, NextFunction } from 'express';
import { getSupabase } from '../services/supabase.js';
import { logger, type BackendLogger } from '../lib/logger.js';
import { getRequestCorrelationId } from './requestContext.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

type AuthMiddlewareDependencies = {
  getSupabaseClient?: typeof getSupabase;
  log?: BackendLogger;
};

/**
 * Middleware to validate Supabase JWT tokens and protect routes.
 */
export function createAuthMiddleware(dependencies: AuthMiddlewareDependencies = {}) {
  const baseLogger = dependencies.log ?? logger;
  const getSupabaseClient = dependencies.getSupabaseClient ?? getSupabase;

  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const requestLogger = baseLogger.withContext({ requestId: getRequestCorrelationId(req) });
    requestLogger.debug('AuthMiddleware', 'Checking protected request', {
      method: req.method,
      path: req.path,
    });
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      requestLogger.warn('AuthMiddleware', 'Unauthorized access attempt: Missing token', {
        method: req.method,
        path: req.path,
      });
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error('Supabase not configured');

      // Validate token with Supabase Auth
      const { data: { user }, error } = await supabase.auth.getUser(token);

      if (error || !user) {
        throw new Error(error?.message || 'Invalid user');
      }

      // Attach user info to request
      req.user = {
        id: user.id,
        email: user.email,
        role: (user.app_metadata?.role as string) || 'user'
      };

      next();
    } catch (error: any) {
      requestLogger.error('AuthMiddleware', 'Token validation failed', error);
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };
}

export const authMiddleware = createAuthMiddleware();

/**
 * Middleware to restrict access to Admins only.
 */
export function createAdminOnly(log: BackendLogger = logger) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (req.user?.role !== 'admin') {
      log.withContext({ requestId: getRequestCorrelationId(req) }).warn(
        'AuthMiddleware',
        'Access denied: Admin role required',
        { actorId: req.user?.id ?? null, method: req.method, path: req.path },
      );
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  };
}

export const adminOnly = createAdminOnly();
