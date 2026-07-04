import cors from 'cors';
import type { NextFunction, Request, Response } from 'express';

function readRequestOrigin(req: Request) {
  const origin = req.headers.origin;
  return typeof origin === 'string' ? origin.trim() : '';
}

export function createBackendCorsMiddleware(allowedOrigins: string[]) {
  const allowedOriginSet = new Set(allowedOrigins);
  const corsMiddleware = cors({
    optionsSuccessStatus: 204,
    origin(origin, callback) {
      if (!origin) {
        callback(null, false);
        return;
      }

      callback(null, allowedOriginSet.has(origin));
    },
  });

  return (req: Request, res: Response, next: NextFunction) => {
    res.vary('Origin');

    const origin = readRequestOrigin(req);
    if (origin && !allowedOriginSet.has(origin)) {
      return res.status(403).json({
        code: 'CORS_ORIGIN_DENIED',
        error: 'Origin is not allowed',
      });
    }

    return corsMiddleware(req, res, next);
  };
}
