import type { NextFunction, Request, Response } from 'express';
import {
  logger,
  resolveBackendLogMode,
  type BackendLogger,
  type BackendLogMode,
} from '../lib/logger.js';
import { getRequestCorrelationId } from './requestContext.js';

type HttpAccessLogOptions = {
  log?: BackendLogger;
  mode?: BackendLogMode;
  nowMs?: () => number;
};

export function createHttpAccessLogMiddleware(options: HttpAccessLogOptions = {}) {
  const log = options.log ?? logger;
  const mode = options.mode ?? resolveBackendLogMode();
  const nowMs = options.nowMs ?? Date.now;

  return (req: Request, res: Response, next: NextFunction) => {
    const startedAt = nowMs();

    res.once('finish', () => {
      if (mode === 'production' && req.path === '/health' && res.statusCode < 400) {
        return;
      }

      const requestLog = log.withContext({ requestId: getRequestCorrelationId(req) });
      const metadata = {
        durationMs: Math.max(0, nowMs() - startedAt),
        method: req.method,
        path: req.path,
        status: res.statusCode,
      };

      if (res.statusCode >= 500) {
        requestLog.error('HttpAccess', 'Request completed', metadata);
      } else if (res.statusCode >= 400) {
        requestLog.warn('HttpAccess', 'Request completed', metadata);
      } else {
        requestLog.info('HttpAccess', 'Request completed', metadata);
      }
    });

    next();
  };
}
