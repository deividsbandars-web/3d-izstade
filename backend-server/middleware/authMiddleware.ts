import { Request, Response, NextFunction } from 'express';
import { getSupabase } from '../services/supabase.js';
import { logger } from '../../src/backend/logging/logger.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
    role?: string;
  };
}

/**
 * Middleware to validate Supabase JWT tokens and protect routes.
 */
export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
  console.log(`[AUTH] Checking request: ${req.method} ${req.url}`);
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    logger.warn('AuthMiddleware', 'Unauthorized access attempt: Missing token');
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not configured");

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
    logger.error('AuthMiddleware', 'Token validation failed', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

/**
 * Middleware to restrict access to Admins only.
 */
export const adminOnly = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    logger.warn('AuthMiddleware', `Access denied for user ${req.user?.id}: Not an admin`);
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};
