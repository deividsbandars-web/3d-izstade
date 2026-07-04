import { Request, Response, NextFunction } from 'express';
import { logger } from '../../src/backend/logging/logger.js';
import { getClientIpRateLimitKey } from './clientIp.js';
import { checkRedisBackedRateLimit, type RedisBackedRateLimitStore } from '../services/redisRateLimit.js';

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

export type RateLimitMiddlewareOptions = {
  nowMs?: () => number;
  requireRedis?: boolean;
  store?: RedisBackedRateLimitStore;
};

export function getGlobalRateLimitClientKey(req: Request) {
  return getClientIpRateLimitKey(req);
}

/**
 * Enhanced Rate Limiter Middleware for Production.
 * Prevents API abuse and dDoS attacks.
 */
export function createRateLimitMiddleware(options: RateLimitMiddlewareOptions = {}) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (STREAMING_BOOTSTRAP_PATHS.has(req.path)) {
      next();
      return;
    }

    const ip = getGlobalRateLimitClientKey(req);
    const rateLimit = await checkRedisBackedRateLimit({
      key: String(ip).slice(0, 96),
      limit: GLOBAL_API_RATE_LIMIT,
      namespace: 'backend-api-global',
      nowMs: options.nowMs?.(),
      requireRedis: options.requireRedis ?? isProductionRuntime(),
      store: options.store,
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
}

export const rateLimitMiddleware = createRateLimitMiddleware();
