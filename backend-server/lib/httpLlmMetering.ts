import type { Response } from 'express';
import type { LlmMeteringContext } from '../../src/backend/ai/llmService.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

export class HttpLlmMeteringError extends Error {
  statusCode = 401;
  code = 'AUTHENTICATED_USER_REQUIRED';
}

function getNonEmptyString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : '';
}

export function requireAuthenticatedUserId(req: AuthRequest) {
  const userId = getNonEmptyString(req.user?.id);
  if (!userId) {
    throw new HttpLlmMeteringError('Authenticated user id is required');
  }

  return userId;
}

export function createHttpLlmMetering(req: AuthRequest, route: string, action: string): LlmMeteringContext {
  return {
    source: 'http',
    userId: requireAuthenticatedUserId(req),
    route,
    action,
  };
}

export function sendHttpLlmMeteringError(res: Response, error: unknown) {
  if (error instanceof HttpLlmMeteringError) {
    return res.status(error.statusCode).json({
      code: error.code,
      error: error.message,
    });
  }

  return null;
}
