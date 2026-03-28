import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

export function requestContext(req: Request, res: Response, next: NextFunction) {
  const correlationId = String(req.headers['x-correlation-id'] || randomUUID());
  (req as Request & { correlationId?: string }).correlationId = correlationId;
  res.setHeader('x-correlation-id', correlationId);
  next();
}
