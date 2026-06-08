import { Request, Response, NextFunction } from 'express';
import { logger } from '../../src/backend/logging/logger.js';

const rateLimits = new Map<string, { count: number, resetAt: number }>();

const STREAMING_BOOTSTRAP_PATHS = new Set([
  '/pixel-streaming/status',
  '/pixel-streaming/session',
]);

/**
 * Enhanced Rate Limiter Middleware for Production.
 * Prevents API abuse and dDoS attacks.
 */
export const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
  if (STREAMING_BOOTSTRAP_PATHS.has(req.path)) {
    next();
    return;
  }

  const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
  const now = Date.now();
  
  // Settings: 60 requests per minute
  const LIMIT = 60;
  const WINDOW_MS = 60000;

  let userLimit = rateLimits.get(ip);

  if (!userLimit || userLimit.resetAt < now) {
    userLimit = { count: 1, resetAt: now + WINDOW_MS };
  } else {
    userLimit.count++;
  }

  rateLimits.set(ip, userLimit);

  if (userLimit.count > LIMIT) {
    logger.warn('Security', `Rate limit exceeded by IP: ${ip}`);
    return res.status(429).json({ 
      error: 'Too many requests', 
      retryAfter: Math.ceil((userLimit.resetAt - now) / 1000) 
    });
  }

  next();
};
