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
import {
  validateCalculatorLeadRequest,
  type ValidCalculatorLeadRequest,
} from './calculatorLeadValidation.js';

const MAX_CALCULATOR_LEADS_LIMIT = 100;
const MAX_CALCULATOR_LEAD_SALES_NOTES_LENGTH = 2000;
const CALCULATOR_LEAD_PRIORITIES = new Set(['low', 'medium', 'high', 'urgent']);
const CALCULATOR_LEAD_QUALITIES = new Set(['unreviewed', 'low', 'medium', 'high']);
const CALCULATOR_LEAD_STATUSES = new Set(['new', 'contacted', 'qualified', 'rejected']);

type CalculatorLeadDependencies = {
  audit?: (event: PublicLeadAuditEvent) => void;
  config?: PublicLeadAbuseConfig;
  duplicateLookup?: typeof findDuplicateCalculatorLead;
  fetchImpl?: typeof fetch;
  nowMs?: () => number;
  rateLimitStore?: RedisBackedRateLimitStore;
  supabase?: ReturnType<typeof getSupabase>;
};

export async function findDuplicateCalculatorLead(
  payload: ValidCalculatorLeadRequest,
  nowMs: number,
  config: PublicLeadAbuseConfig = resolvePublicLeadAbuseConfig(),
  supabase: ReturnType<typeof getSupabase> = getSupabase(),
) {
  const { data, error } = await supabase
    .from('leads')
    .select('id')
    .eq('source', payload.source)
    .eq('contact_info->>email', payload.contact_info.email)
    .gte('created_at', new Date(nowMs - config.duplicateWindowMs).toISOString())
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error('CALCULATOR_LEAD_DUPLICATE_CHECK_FAILED');
  }

  return typeof data?.id === 'string' ? data.id : null;
}

function getCalculatorLeadFailureStatus(code: string) {
  if (code === 'CALCULATOR_LEAD_DUPLICATE') {
    return 409;
  }
  if (code === 'CALCULATOR_LEAD_TURNSTILE_FAILED' || code === 'CALCULATOR_LEAD_TURNSTILE_REQUIRED') {
    return 403;
  }
  if (code === 'CALCULATOR_LEAD_DUPLICATE_CHECK_FAILED' || code === 'CALCULATOR_LEAD_STORAGE_FAILED') {
    return 500;
  }
  return 400;
}

function getCalculatorLeadFailureStage(code: string) {
  if (code === 'CALCULATOR_LEAD_DUPLICATE') {
    return 'duplicate' as const;
  }
  if (code.startsWith('CALCULATOR_LEAD_TURNSTILE_')) {
    return 'turnstile' as const;
  }
  if (code === 'CALCULATOR_LEAD_SPAM_REJECTED') {
    return 'spam' as const;
  }
  if (code === 'CALCULATOR_LEAD_DUPLICATE_CHECK_FAILED' || code === 'CALCULATOR_LEAD_STORAGE_FAILED') {
    return 'storage' as const;
  }
  return 'validation' as const;
}

function normalizeCalculatorLeadStatus(value: unknown) {
  const status = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!CALCULATOR_LEAD_STATUSES.has(status)) {
    throw new Error('CALCULATOR_LEAD_STATUS_INVALID');
  }

  return status;
}

function hasOwnRecordValue(record: Record<string, unknown>, key: string) {
  return Object.prototype.hasOwnProperty.call(record, key);
}

function normalizeCalculatorLeadPriority(value: unknown) {
  const priority = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!CALCULATOR_LEAD_PRIORITIES.has(priority)) {
    throw new Error('CALCULATOR_LEAD_PRIORITY_INVALID');
  }

  return priority;
}

function normalizeCalculatorLeadQuality(value: unknown) {
  const quality = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (!CALCULATOR_LEAD_QUALITIES.has(quality)) {
    throw new Error('CALCULATOR_LEAD_QUALITY_INVALID');
  }

  return quality;
}

function normalizeCalculatorLeadSalesNotes(value: unknown) {
  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value !== 'string') {
    throw new Error('CALCULATOR_LEAD_SALES_NOTES_INVALID');
  }

  const notes = value.trim();
  if (notes.length > MAX_CALCULATOR_LEAD_SALES_NOTES_LENGTH) {
    throw new Error('CALCULATOR_LEAD_SALES_NOTES_TOO_LONG');
  }

  return notes;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

export function normalizeCalculatorLeadOpsUpdate(body: unknown) {
  const record = asRecord(body);
  const update: {
    leadQuality?: string;
    salesNotes?: string;
    salesPriority?: string;
    status?: string;
  } = {};

  if (hasOwnRecordValue(record, 'status')) {
    update.status = normalizeCalculatorLeadStatus(record.status);
  }

  if (hasOwnRecordValue(record, 'salesPriority')) {
    update.salesPriority = normalizeCalculatorLeadPriority(record.salesPriority);
  } else if (hasOwnRecordValue(record, 'priority')) {
    update.salesPriority = normalizeCalculatorLeadPriority(record.priority);
  }

  if (hasOwnRecordValue(record, 'leadQuality')) {
    update.leadQuality = normalizeCalculatorLeadQuality(record.leadQuality);
  } else if (hasOwnRecordValue(record, 'quality')) {
    update.leadQuality = normalizeCalculatorLeadQuality(record.quality);
  }

  if (hasOwnRecordValue(record, 'salesNotes')) {
    update.salesNotes = normalizeCalculatorLeadSalesNotes(record.salesNotes);
  }

  if (Object.keys(update).length === 0) {
    throw new Error('CALCULATOR_LEAD_UPDATE_EMPTY');
  }

  return update;
}

export async function captureCalculatorLeadWithDependencies(
  req: Request,
  res: Response,
  dependencies: CalculatorLeadDependencies = {},
) {
  const config = dependencies.config ?? resolvePublicLeadAbuseConfig();
  const nowMs = dependencies.nowMs?.() ?? Date.now();
  const audit = dependencies.audit ?? logPublicLeadAuditEvent;
  const rawBody = asRecord(req.body);
  const sourcePath = asRecord(rawBody.contact_info).sourcePath;
  const rateLimit = await checkPublicLeadRateLimit('calculator', req, config, {
    nowMs,
    store: dependencies.rateLimitStore,
  });

  if (rateLimit.unavailable) {
    const code = 'CALCULATOR_LEAD_RATE_LIMIT_UNAVAILABLE';
    audit(createPublicLeadAuditEvent(req, sourcePath, {
      code,
      nowMs,
      rateLimitStore: rateLimit.store,
      route: 'calculator',
      stage: 'rateLimit',
      status: 503,
    }));
    if (typeof res.setHeader === 'function') {
      res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
    }
    return res.status(503).json({ error: code, retryAfterSeconds: rateLimit.retryAfterSeconds });
  }

  if (!rateLimit.allowed) {
    const code = 'CALCULATOR_LEAD_RATE_LIMITED';
    audit(createPublicLeadAuditEvent(req, sourcePath, {
      code,
      nowMs,
      rateLimitStore: rateLimit.store,
      route: 'calculator',
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
      throw new Error('CALCULATOR_LEAD_SPAM_REJECTED');
    }

    const turnstile = await verifyPublicLeadTurnstile(
      req.body,
      req,
      config,
      dependencies.fetchImpl,
    );
    if (!turnstile.ok) {
      throw new Error(turnstile.code.replace('PUBLIC_LEAD_', 'CALCULATOR_LEAD_'));
    }
    turnstileVerified = turnstile.verified;

    const payload = validateCalculatorLeadRequest(req.body);
    const supabase = dependencies.supabase ?? getSupabase();
    const duplicateId = await (dependencies.duplicateLookup ?? findDuplicateCalculatorLead)(
      payload,
      nowMs,
      config,
      supabase,
    );
    if (duplicateId) {
      throw new Error('CALCULATOR_LEAD_DUPLICATE');
    }

    const submissionFingerprint = createPublicLeadSubmissionFingerprint({
      duplicateWindowMs: config.duplicateWindowMs,
      email: payload.contact_info.email,
      nowMs,
      route: 'calculator',
      scope: payload.source,
    });
    const { data, error } = await supabase
      .from('leads')
      .insert([{
        contact_info: {
          ...payload.contact_info,
          message: payload.message,
          score: payload.score,
        },
        notes: payload.message,
        source: payload.source,
        status: payload.status,
        submission_fingerprint: submissionFingerprint,
        submission_metadata: {
          controlVersion: '2026-07-02',
          duplicateWindowMs: config.duplicateWindowMs,
          provenance: createPublicLeadProvenance(req, payload.contact_info.sourcePath, nowMs),
          rateLimitStore: rateLimit.store,
          turnstileVerified,
        },
        value: payload.contact_info.estimateTotal,
      }])
      .select('id')
      .single();

    if (error) {
      throw new Error(error.code === '23505' ? 'CALCULATOR_LEAD_DUPLICATE' : 'CALCULATOR_LEAD_STORAGE_FAILED');
    }

    audit(createPublicLeadAuditEvent(req, payload.contact_info.sourcePath, {
      code: 'CALCULATOR_LEAD_ACCEPTED',
      nowMs,
      rateLimitStore: rateLimit.store,
      route: 'calculator',
      stage: 'accepted',
      status: 201,
      turnstileVerified,
    }));

    res.status(201).json({
      calculatorId: payload.contact_info.calculatorId,
      id: data?.id ?? null,
      source: payload.source,
      success: true,
    });
  } catch (error: any) {
    const rawCode = String(error?.message || 'CALCULATOR_LEAD_STORAGE_FAILED');
    const code = rawCode.startsWith('CALCULATOR_LEAD_') ? rawCode : 'CALCULATOR_LEAD_STORAGE_FAILED';
    const status = getCalculatorLeadFailureStatus(code);
    audit(createPublicLeadAuditEvent(req, sourcePath, {
      code,
      nowMs,
      rateLimitStore: rateLimit.store,
      route: 'calculator',
      stage: getCalculatorLeadFailureStage(code),
      status,
      turnstileVerified,
    }));
    res.status(status).json({ error: code });
  }
}

export async function captureCalculatorLead(req: Request, res: Response) {
  return captureCalculatorLeadWithDependencies(req, res);
}

export async function getCalculatorLeads(req: Request, res: Response) {
  try {
    const requestedLimit = Number(req.query.limit);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(Math.round(requestedLimit), 1), MAX_CALCULATOR_LEADS_LIMIT)
      : 50;

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('leads')
      .select('id, source, status, value, notes, contact_info, created_at')
      .ilike('source', 'calculator:%')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    res.json(data ?? []);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'CALCULATOR_LEADS_UNKNOWN' });
  }
}

export async function updateCalculatorLeadStatus(req: Request, res: Response) {
  try {
    const leadId = typeof req.params.leadId === 'string' ? req.params.leadId.trim() : '';
    if (!leadId) {
      return res.status(400).json({ error: 'CALCULATOR_LEAD_ID_REQUIRED' });
    }

    const opsUpdate = normalizeCalculatorLeadOpsUpdate(req.body);
    const supabase = getSupabase();

    const { data: existingLead, error: existingError } = await supabase
      .from('leads')
      .select('contact_info')
      .eq('id', leadId)
      .ilike('source', 'calculator:%')
      .single();

    if (existingError) {
      throw existingError;
    }

    const existingContactInfo = asRecord(existingLead?.contact_info);
    const nextContactInfo = { ...existingContactInfo };
    const updatePayload: Record<string, unknown> = {};

    if (opsUpdate.status) {
      updatePayload.status = opsUpdate.status;
    }

    if (opsUpdate.salesPriority !== undefined) {
      nextContactInfo.salesPriority = opsUpdate.salesPriority;
    }

    if (opsUpdate.leadQuality !== undefined) {
      nextContactInfo.leadQuality = opsUpdate.leadQuality;
    }

    if (opsUpdate.salesNotes !== undefined) {
      nextContactInfo.salesNotes = opsUpdate.salesNotes;
    }

    if (
      opsUpdate.salesPriority !== undefined
      || opsUpdate.leadQuality !== undefined
      || opsUpdate.salesNotes !== undefined
    ) {
      nextContactInfo.salesOpsUpdatedAt = new Date().toISOString();
      updatePayload.contact_info = nextContactInfo;
    }

    const { data, error } = await supabase
      .from('leads')
      .update(updatePayload)
      .eq('id', leadId)
      .ilike('source', 'calculator:%')
      .select('id, source, status, value, notes, contact_info, created_at')
      .single();

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (error: any) {
    const code = String(error?.message || 'CALCULATOR_LEAD_STATUS_UPDATE_UNKNOWN');
    const status = code.startsWith('CALCULATOR_LEAD_') ? 400 : 500;
    res.status(status).json({ error: code });
  }
}
