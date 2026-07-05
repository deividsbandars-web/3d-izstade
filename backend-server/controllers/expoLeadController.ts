import { Request, Response } from 'express';
import { resolvePublicLeadAbuseConfig, type PublicLeadAbuseConfig } from '../config/publicLeadAbuse.js';
import { getSupabase } from '../services/supabase.js';
import {
  checkPublicLeadRateLimit,
  createPublicLeadAuditEvent,
  createPublicLeadProvenance,
  createPublicLeadSubmissionFingerprint,
  hasFilledPublicLeadHoneypot,
  logPublicLeadAuditEvent,
  verifyPublicLeadTurnstile,
  type PublicLeadAuditEvent,
} from '../services/publicLeadAbuse.js';
import type { RedisBackedRateLimitStore } from '../services/redisRateLimit.js';

type ExpoLeadRequestBody = {
  clientEmail?: unknown;
  clientName?: unknown;
  companyId?: unknown;
  companySlug?: unknown;
  message?: unknown;
  sourcePath?: unknown;
};

export type ValidExpoLeadRequest = {
  clientEmail: string;
  clientName: string;
  companyId: string;
  companySlug: string | null;
  message: string | null;
  sourcePath: string | null;
};

type ExpoLeadDependencies = {
  audit?: (event: PublicLeadAuditEvent) => void;
  config?: PublicLeadAbuseConfig;
  duplicateLookup?: typeof findDuplicateExpoLead;
  fetchImpl?: typeof fetch;
  nowMs?: () => number;
  rateLimitStore?: RedisBackedRateLimitStore;
  supabase?: ReturnType<typeof getSupabase>;
};

const MAX_EXPO_LEAD_COMPANY_LENGTH = 128;
const MAX_EXPO_LEAD_EMAIL_LENGTH = 320;
const MAX_EXPO_LEAD_MESSAGE_LENGTH = 2_400;
const MAX_EXPO_LEAD_NAME_LENGTH = 200;
const MAX_EXPO_LEAD_SOURCE_PATH_LENGTH = 2_048;

function normalizeRequiredText(value: unknown, code: string, maximumLength: number) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized) {
    throw new Error(code);
  }

  if (normalized.length > maximumLength) {
    throw new Error(`${code.replace(/_REQUIRED$/, '')}_TOO_LONG`);
  }

  return normalized;
}

function normalizeOptionalText(value: unknown, maximumLength: number) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  return normalized ? normalized.slice(0, maximumLength) : null;
}

function normalizeEmail(value: unknown) {
  const normalized = normalizeRequiredText(
    value,
    'EXPO_LEAD_EMAIL_REQUIRED',
    MAX_EXPO_LEAD_EMAIL_LENGTH,
  ).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error('EXPO_LEAD_EMAIL_INVALID');
  }

  return normalized;
}

export function validateExpoLeadRequest(body: ExpoLeadRequestBody): ValidExpoLeadRequest {
  return {
    clientEmail: normalizeEmail(body.clientEmail),
    clientName: normalizeRequiredText(body.clientName, 'EXPO_LEAD_NAME_REQUIRED', MAX_EXPO_LEAD_NAME_LENGTH),
    companyId: normalizeRequiredText(body.companyId, 'EXPO_LEAD_COMPANY_REQUIRED', MAX_EXPO_LEAD_COMPANY_LENGTH),
    companySlug: normalizeOptionalText(body.companySlug, MAX_EXPO_LEAD_COMPANY_LENGTH),
    message: normalizeOptionalText(body.message, MAX_EXPO_LEAD_MESSAGE_LENGTH),
    sourcePath: normalizeOptionalText(body.sourcePath, MAX_EXPO_LEAD_SOURCE_PATH_LENGTH),
  };
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function resolveCompanyIdForLead(
  supabase: ReturnType<typeof getSupabase>,
  payload: ValidExpoLeadRequest,
) {
  if (isUuid(payload.companyId)) {
    return payload.companyId;
  }

  const slug = payload.companySlug || payload.companyId;
  const { data, error } = await supabase
    .from('companies')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return typeof data?.id === 'string' ? data.id : null;
}

function getExpoLeadServiceName(payload: ValidExpoLeadRequest) {
  return payload.companySlug ? `expo_sponsor_lead:${payload.companySlug}` : 'expo_sponsor_lead';
}

export async function findDuplicateExpoLead(
  payload: ValidExpoLeadRequest,
  resolvedCompanyId: string | null,
  nowMs: number,
  config: PublicLeadAbuseConfig = resolvePublicLeadAbuseConfig(),
  supabase: ReturnType<typeof getSupabase> = getSupabase(),
) {
  let query = supabase
    .from('service_requests')
    .select('id')
    .eq('client_email', payload.clientEmail)
    .eq('service_name', getExpoLeadServiceName(payload))
    .gte('created_at', new Date(nowMs - config.duplicateWindowMs).toISOString());

  query = resolvedCompanyId
    ? query.eq('company_id', resolvedCompanyId)
    : query.is('company_id', null);

  const { data, error } = await query.limit(1).maybeSingle();
  if (error) {
    throw new Error('EXPO_LEAD_DUPLICATE_CHECK_FAILED');
  }

  return typeof data?.id === 'string' ? data.id : null;
}

function getExpoLeadFailureStatus(code: string) {
  if (code === 'EXPO_LEAD_DUPLICATE') {
    return 409;
  }
  if (code === 'EXPO_LEAD_TURNSTILE_FAILED' || code === 'EXPO_LEAD_TURNSTILE_REQUIRED') {
    return 403;
  }
  if (code === 'EXPO_LEAD_DUPLICATE_CHECK_FAILED' || code === 'EXPO_LEAD_STORAGE_FAILED') {
    return 500;
  }
  return 400;
}

function getExpoLeadFailureStage(code: string) {
  if (code === 'EXPO_LEAD_DUPLICATE') {
    return 'duplicate' as const;
  }
  if (code.startsWith('EXPO_LEAD_TURNSTILE_')) {
    return 'turnstile' as const;
  }
  if (code === 'EXPO_LEAD_SPAM_REJECTED') {
    return 'spam' as const;
  }
  if (code === 'EXPO_LEAD_DUPLICATE_CHECK_FAILED' || code === 'EXPO_LEAD_STORAGE_FAILED') {
    return 'storage' as const;
  }
  return 'validation' as const;
}

export async function captureExpoLeadWithDependencies(
  req: Request,
  res: Response,
  dependencies: ExpoLeadDependencies = {},
) {
  const config = dependencies.config ?? resolvePublicLeadAbuseConfig();
  const nowMs = dependencies.nowMs?.() ?? Date.now();
  const audit = dependencies.audit ?? logPublicLeadAuditEvent;
  const sourcePath = (req.body as ExpoLeadRequestBody | null)?.sourcePath;
  const rateLimit = await checkPublicLeadRateLimit('expo', req, config, {
    nowMs,
    store: dependencies.rateLimitStore,
  });

  if (rateLimit.unavailable) {
    const code = 'EXPO_LEAD_RATE_LIMIT_UNAVAILABLE';
    audit(createPublicLeadAuditEvent(req, sourcePath, {
      code,
      nowMs,
      rateLimitStore: rateLimit.store,
      route: 'expo',
      stage: 'rateLimit',
      status: 503,
    }));
    if (typeof res.setHeader === 'function') {
      res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
    }
    return res.status(503).json({ error: code, retryAfterSeconds: rateLimit.retryAfterSeconds });
  }

  if (!rateLimit.allowed) {
    const code = 'EXPO_LEAD_RATE_LIMITED';
    audit(createPublicLeadAuditEvent(req, sourcePath, {
      code,
      nowMs,
      rateLimitStore: rateLimit.store,
      route: 'expo',
      stage: 'rateLimit',
      status: 429,
    }));
    if (typeof res.setHeader === 'function') {
      res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
    }
    return res.status(429).json({ error: code, retryAfterSeconds: rateLimit.retryAfterSeconds });
  }

  let turnstileVerified = false;
  try {
    if (hasFilledPublicLeadHoneypot(req.body)) {
      throw new Error('EXPO_LEAD_SPAM_REJECTED');
    }

    const turnstile = await verifyPublicLeadTurnstile(
      req.body,
      req,
      config,
      dependencies.fetchImpl,
    );
    if (!turnstile.ok) {
      throw new Error(turnstile.code.replace('PUBLIC_LEAD_', 'EXPO_LEAD_'));
    }
    turnstileVerified = turnstile.verified;

    const payload = validateExpoLeadRequest(req.body);
    const supabase = dependencies.supabase ?? getSupabase();
    const resolvedCompanyId = await resolveCompanyIdForLead(supabase, payload);
    const duplicateId = await (dependencies.duplicateLookup ?? findDuplicateExpoLead)(
      payload,
      resolvedCompanyId,
      nowMs,
      config,
      supabase,
    );
    if (duplicateId) {
      throw new Error('EXPO_LEAD_DUPLICATE');
    }

    const serviceName = getExpoLeadServiceName(payload);
    const submissionFingerprint = createPublicLeadSubmissionFingerprint({
      duplicateWindowMs: config.duplicateWindowMs,
      email: payload.clientEmail,
      nowMs,
      route: 'expo',
      scope: resolvedCompanyId ?? serviceName,
    });
    const { error } = await supabase
      .from('service_requests')
      .insert([{
        client_email: payload.clientEmail,
        client_name: payload.clientName,
        company_id: resolvedCompanyId,
        message: payload.message,
        service_name: serviceName,
        submission_fingerprint: submissionFingerprint,
        submission_metadata: {
          controlVersion: '2026-07-02',
          duplicateWindowMs: config.duplicateWindowMs,
          provenance: createPublicLeadProvenance(req, payload.sourcePath, nowMs),
          rateLimitStore: rateLimit.store,
          turnstileVerified,
        },
      }]);

    if (error) {
      throw new Error(error.code === '23505' ? 'EXPO_LEAD_DUPLICATE' : 'EXPO_LEAD_STORAGE_FAILED');
    }

    audit(createPublicLeadAuditEvent(req, payload.sourcePath, {
      code: 'EXPO_LEAD_ACCEPTED',
      nowMs,
      rateLimitStore: rateLimit.store,
      route: 'expo',
      stage: 'accepted',
      status: 201,
      turnstileVerified,
    }));

    res.status(201).json({
      companyId: resolvedCompanyId,
      companySlug: payload.companySlug,
      sourcePath: payload.sourcePath,
      success: true,
    });
  } catch (error: any) {
    const rawCode = String(error?.message || 'EXPO_LEAD_STORAGE_FAILED');
    const code = rawCode.startsWith('EXPO_LEAD_') ? rawCode : 'EXPO_LEAD_STORAGE_FAILED';
    const status = getExpoLeadFailureStatus(code);
    audit(createPublicLeadAuditEvent(req, sourcePath, {
      code,
      nowMs,
      rateLimitStore: rateLimit.store,
      route: 'expo',
      stage: getExpoLeadFailureStage(code),
      status,
      turnstileVerified,
    }));
    res.status(status).json({ error: code });
  }
}

export async function captureExpoLead(req: Request, res: Response) {
  return captureExpoLeadWithDependencies(req, res);
}
