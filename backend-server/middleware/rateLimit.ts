import { Request, Response, NextFunction } from 'express';
import { logger } from '../../src/backend/logging/logger.js';
import { checkRedisBackedRateLimit } from '../services/redisRateLimit.js';

const STREAMING_BOOTSTRAP_PATHS = new Set([
  '/pixel-streaming/status',
  '/pixel-streaming/session',
]);
const GLOBAL_API_RATE_LIMIT = 60;
const GLOBAL_API_RATE_LIMIT_WINDOW_MS = 60_000;

function isProductionRuntime() {
  return process.env.NODE_ENV === 'production'
    || process.env.APP_ENV === 'production'
    || process.env.VERCEL_ENV === 'production';
}

/**
 * Enhanced Rate Limiter Middleware for Production.
 * Prevents API abuse and dDoS attacks.
 */
export const rateLimitMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  if (STREAMING_BOOTSTRAP_PATHS.has(req.path)) {
    next();
    return;
  }

  const ip = (req.headers['x-forwarded-for'] as string) || req.ip || 'unknown';
  const rateLimit = await checkRedisBackedRateLimit({
    key: String(ip).slice(0, 96),
    limit: GLOBAL_API_RATE_LIMIT,
    namespace: 'backend-api-global',
    requireRedis: isProductionRuntime(),
    windowMs: GLOBAL_API_RATE_LIMIT_WINDOW_MS,
  });

  if (rateLimit.unavailable) {
    logger.warn('Security', 'Redis-backed API rate limiter is unavailable.');
    return res.status(503).json({
      error: 'RATE_LIMIT_UNAVAILABLE',
      retryAfter: rateLimit.retryAfterSeconds,
    });
  }

  if (!rateLimit.allowed) {
    logger.warn('Security', `Rate limit exceeded by IP: ${ip}`);
    return res.status(429).json({ 
      error: 'Too many requests', 
      retryAfter: rateLimit.retryAfterSeconds,
    });
  }

  next();
};
