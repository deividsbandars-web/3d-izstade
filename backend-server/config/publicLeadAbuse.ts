export type PublicLeadRoute = 'calculator' | 'expo';

export type PublicLeadAbuseConfig = {
  duplicateWindowMs: number;
  rateLimit: {
    maxRequests: Record<PublicLeadRoute, number>;
    requireRedis: boolean;
    windowMs: number;
  };
  turnstile: {
    required: boolean;
    secretKey: string | null;
    timeoutMs: number;
  };
};

type RawPublicLeadEnv = Record<string, string | undefined>;

export const DEFAULT_PUBLIC_LEAD_DUPLICATE_WINDOW_MS = 30 * 60 * 1000;
export const DEFAULT_PUBLIC_LEAD_RATE_LIMIT_MAX_REQUESTS = 5;
export const DEFAULT_PUBLIC_LEAD_RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
export const DEFAULT_PUBLIC_LEAD_TURNSTILE_TIMEOUT_MS = 5_000;

function normalizeBooleanFlag(rawEnv: RawPublicLeadEnv, key: string) {
  const normalized = rawEnv[key]?.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes' || normalized === 'on';
}

function normalizePositiveInteger(
  rawEnv: RawPublicLeadEnv,
  key: string,
  fallback: number,
  maximum: number,
) {
  const rawValue = rawEnv[key]?.trim();
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number(rawValue);
  if (!Number.isInteger(parsed) || parsed <= 0 || parsed > maximum) {
    throw new Error(`BACKEND_ENV_INVALID_NUMBER:${key}`);
  }

  return parsed;
}

function isProductionRuntime(rawEnv: RawPublicLeadEnv) {
  return [rawEnv.NODE_ENV, rawEnv.APP_ENV, rawEnv.VERCEL_ENV]
    .some((value) => value?.trim().toLowerCase() === 'production');
}

export function resolvePublicLeadAbuseConfig(
  rawEnv: RawPublicLeadEnv = process.env,
): PublicLeadAbuseConfig {
  const secretKey = rawEnv.PUBLIC_LEAD_TURNSTILE_SECRET_KEY?.trim() || null;
  const required = normalizeBooleanFlag(rawEnv, 'PUBLIC_LEAD_TURNSTILE_REQUIRED');
  if (required && !secretKey) {
    throw new Error('BACKEND_ENV_MISSING:PUBLIC_LEAD_TURNSTILE_SECRET_KEY');
  }

  return {
    duplicateWindowMs: normalizePositiveInteger(
      rawEnv,
      'PUBLIC_LEAD_DUPLICATE_WINDOW_MS',
      DEFAULT_PUBLIC_LEAD_DUPLICATE_WINDOW_MS,
      24 * 60 * 60 * 1000,
    ),
    rateLimit: {
      maxRequests: {
        calculator: normalizePositiveInteger(
          rawEnv,
          'PUBLIC_CALCULATOR_LEAD_RATE_LIMIT_MAX_REQUESTS',
          DEFAULT_PUBLIC_LEAD_RATE_LIMIT_MAX_REQUESTS,
          100,
        ),
        expo: normalizePositiveInteger(
          rawEnv,
          'PUBLIC_EXPO_LEAD_RATE_LIMIT_MAX_REQUESTS',
          DEFAULT_PUBLIC_LEAD_RATE_LIMIT_MAX_REQUESTS,
          100,
        ),
      },
      requireRedis: isProductionRuntime(rawEnv),
      windowMs: normalizePositiveInteger(
        rawEnv,
        'PUBLIC_LEAD_RATE_LIMIT_WINDOW_MS',
        DEFAULT_PUBLIC_LEAD_RATE_LIMIT_WINDOW_MS,
        24 * 60 * 60 * 1000,
      ),
    },
    turnstile: {
      required,
      secretKey,
      timeoutMs: normalizePositiveInteger(
        rawEnv,
        'PUBLIC_LEAD_TURNSTILE_TIMEOUT_MS',
        DEFAULT_PUBLIC_LEAD_TURNSTILE_TIMEOUT_MS,
        30_000,
      ),
    },
  };
}
