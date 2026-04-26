import { Request, Response } from 'express';
import { distributionApplicationService } from '../../src/backend/distribution/distributionApplicationService.js';

function getScalarQueryValue(value: unknown, fallback: string) {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  if (Array.isArray(value)) {
    const first = value.find((entry) => typeof entry === 'string' && entry.trim().length > 0);
    if (typeof first === 'string') {
      return first.trim();
    }
  }
  return fallback;
}

function getScalarParamValue(value: unknown, fallback = '') {
  if (typeof value === 'string' && value.trim().length > 0) {
    return value.trim();
  }
  if (Array.isArray(value)) {
    const first = value.find((entry) => typeof entry === 'string' && entry.trim().length > 0);
    if (typeof first === 'string') {
      return first.trim();
    }
  }
  return fallback;
}

export const getLandingPage = async (req: Request, res: Response) => {
  const slug = getScalarParamValue(req.params.slug);
  const source = getScalarQueryValue(req.query.s, 'direct');
  const campaign = getScalarQueryValue(req.query.c, 'default');
  const userAgent = Array.isArray(req.headers['user-agent'])
    ? req.headers['user-agent'][0]
    : req.headers['user-agent'];
  const response = await distributionApplicationService.getLandingPageResponse({
    campaign,
    slug,
    source,
    userAgent,
  });
  res.type(response.contentType).status(response.status).send(response.body);
};
