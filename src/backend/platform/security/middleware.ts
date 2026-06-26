import { prodLogger } from '../../logging/prodLogger.js';

interface RateLimitBucket {
  count: number;
  resetAt: number;
  blockedUntil?: number;
}

interface SecurityRequest {
  ip?: string;
  path?: string;
  method?: string;
  headers: Record<string, string | string[] | undefined>;
  user?: { id?: string; role?: string };
}

interface SecurityResponse {
  setHeader?: (name: string, value: string) => void;
  status: (code: number) => { json: (body: unknown) => unknown };
}

type Next = () => void;

interface RateLimiterOptions {
  limit: number;
  windowMs: number;
  blockDurationMs: number;
  keyPrefix: string;
}

const RATE_LIMIT_BUCKETS = new Map<string, RateLimitBucket>();
const DEFAULT_RATE_LIMIT: RateLimiterOptions = {
  limit: 100,
  windowMs: 60_000,
  blockDurationMs: 5 * 60_000,
  keyPrefix: 'default'
};

function normalizeHeaderValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function resolveClientIp(req: SecurityRequest) {
  const forwardedFor = normalizeHeaderValue(req.headers['x-forwarded-for']);
  if (forwardedFor) {
    return forwardedFor.split(',')[0]?.trim() || 'unknown';
  }

  return req.ip || 'unknown';
}

function cleanupExpiredBuckets(now: number) {
  for (const [key, bucket] of RATE_LIMIT_BUCKETS.entries()) {
    const expired = bucket.resetAt <= now && (!bucket.blockedUntil || bucket.blockedUntil <= now);
    if (expired) {
      RATE_LIMIT_BUCKETS.delete(key);
    }
  }
}

function enforceRateLimit(req: SecurityRequest, res: SecurityResponse, next: Next, options: RateLimiterOptions) {
  const now = Date.now();
  cleanupExpiredBuckets(now);

  const key = `${options.keyPrefix}:${resolveClientIp(req)}:${req.method || 'GET'}:${req.path || 'unknown'}`;
  let bucket = RATE_LIMIT_BUCKETS.get(key);

  if (!bucket || bucket.resetAt <= now) {
    bucket = {
      count: 0,
      resetAt: now + options.windowMs
    };
  }

  if (bucket.blockedUntil && bucket.blockedUntil > now) {
    const retryAfterSeconds = Math.ceil((bucket.blockedUntil - now) / 1000);
    prodLogger.warn('Blocked request due to active rate-limit penalty.', { key, retryAfterSeconds });
    res.setHeader?.('Retry-After', String(retryAfterSeconds));
    return res.status(429).json({ error: 'Too many requests', retryAfter: retryAfterSeconds });
  }

  bucket.count += 1;
  if (bucket.count > options.limit) {
    bucket.blockedUntil = now + options.blockDurationMs;
    RATE_LIMIT_BUCKETS.set(key, bucket);
    const retryAfterSeconds = Math.ceil((bucket.blockedUntil - now) / 1000);
    prodLogger.warn('Rate limit exceeded.', { key, retryAfterSeconds });
    res.setHeader?.('Retry-After', String(retryAfterSeconds));
    return res.status(429).json({ error: 'Too many requests', retryAfter: retryAfterSeconds });
  }

  RATE_LIMIT_BUCKETS.set(key, bucket);
  res.setHeader?.('X-RateLimit-Limit', String(options.limit));
  res.setHeader?.('X-RateLimit-Remaining', String(Math.max(options.limit - bucket.count, 0)));
  res.setHeader?.('X-RateLimit-Reset', String(Math.ceil(bucket.resetAt / 1000)));
  next();
}

function requireBearerToken(req: SecurityRequest, res: SecurityResponse, next: Next) {
  const authHeader = normalizeHeaderValue(req.headers.authorization);
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    prodLogger.warn('Rejected request without bearer token.', { path: req.path, method: req.method });
    return res.status(401).json({ error: 'Unauthorized' });
  }

  next();
}

export const securityMiddleware = {
  rateLimiter(req: SecurityRequest, res: SecurityResponse, next: Next) {
    return enforceRateLimit(req, res, next, DEFAULT_RATE_LIMIT);
  },

  createRateLimiter(options: Partial<RateLimiterOptions>) {
    const merged = { ...DEFAULT_RATE_LIMIT, ...options };
    return (req: SecurityRequest, res: SecurityResponse, next: Next) =>
      enforceRateLimit(req, res, next, merged);
  },

  apiValidator(req: SecurityRequest, res: SecurityResponse, next: Next) {
    return requireBearerToken(req, res, next);
  },

  requireRole(roles: string[]) {
    return (req: SecurityRequest, res: SecurityResponse, next: Next) => {
      if (!req.user?.role || !roles.includes(req.user.role)) {
        prodLogger.warn('Rejected request without required role.', {
          path: req.path,
          method: req.method,
          role: req.user?.role ?? 'anonymous'
        });
        return res.status(403).json({ error: 'Forbidden' });
      }

      next();
    };
  }
};
