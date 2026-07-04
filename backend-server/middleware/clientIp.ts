import type { Request } from 'express';

function normalizeIp(value: unknown) {
  if (typeof value !== 'string') {
    return '';
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }

  return trimmed;
}

export function getClientIp(req: Request) {
  return normalizeIp(req.ip)
    || normalizeIp(req.socket?.remoteAddress)
    || 'unknown';
}

export function getClientIpRateLimitKey(req: Request) {
  return getClientIp(req).slice(0, 96);
}
