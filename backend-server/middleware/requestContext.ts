import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { runWithLogContext } from '../lib/logger.js';

export type CorrelatedRequest = Request & { correlationId?: string };

function firstHeaderValue(value: unknown) {
  return Array.isArray(value) ? value[0] : value;
}

export function isValidCorrelationId(value: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  const isTraceId = /^[0-9a-f]{16,32}$/i.test(value);
  return isUuid || isTraceId;
}

export function resolveCorrelationId(value: unknown, createId: () => string = randomUUID) {
  const candidate = typeof firstHeaderValue(value) === 'string'
    ? String(firstHeaderValue(value)).trim()
    : '';
  return candidate && isValidCorrelationId(candidate) ? candidate : createId();
}

export function getRequestCorrelationId(req: Request) {
  const value = (req as CorrelatedRequest).correlationId;
  return typeof value === 'string' && isValidCorrelationId(value) ? value : null;
}

export function requestContext(req: Request, res: Response, next: NextFunction) {
  const correlationId = resolveCorrelationId(req.headers['x-correlation-id']);
  (req as CorrelatedRequest).correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  runWithLogContext({ requestId: correlationId }, next);
}
