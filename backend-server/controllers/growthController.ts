import { Request, Response } from 'express';
import { nicheDiscovery } from '../../src/backend/growth/nicheDiscovery.js';
import { landingGenerator } from '../../src/backend/growth/landingGenerator.js';
import { seoEngine } from '../../src/backend/growth/seoEngine.js';
import { trafficAutomation } from '../../src/backend/growth/trafficAutomation.js';
import { leadCapture } from '../../src/backend/growth/leadCapture.js';
import { createHttpLlmMetering, requireAuthenticatedUserId, sendHttpLlmMeteringError } from '../lib/httpLlmMetering.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

function getString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : '';
}

export const findProfitableNiches = async (req: AuthRequest, res: Response) => {
  try {
    const industry = getString(req.body?.industry || req.body?.baseIndustry);
    if (!industry) {
      return res.status(400).json({ error: 'industry is required' });
    }

    const result = await nicheDiscovery.findProfitableNiches(
      industry,
      createHttpLlmMetering(req, '/api/growth/niches', 'growth-niche-discovery'),
    );
    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    return res.json(result.data);
  } catch (error) {
    const handled = sendHttpLlmMeteringError(res, error);
    if (handled) {
      return handled;
    }

    throw error;
  }
};

export const generateLandingPage = async (req: AuthRequest, res: Response) => {
  try {
    const projectId = getString(req.body?.projectId);
    const niche = getString(req.body?.niche);
    const productAngle = getString(req.body?.productAngle || req.body?.angle || req.body?.brief);

    if (!projectId || !niche || !productAngle) {
      return res.status(400).json({ error: 'projectId, niche, and productAngle are required' });
    }

    const result = await landingGenerator.generateLandingPage(
      projectId,
      niche,
      productAngle,
      createHttpLlmMetering(req, '/api/growth/landing-page', 'growth-landing-page'),
    );
    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    return res.json(result.data);
  } catch (error) {
    const handled = sendHttpLlmMeteringError(res, error);
    if (handled) {
      return handled;
    }

    throw error;
  }
};

export const generateKeywordClusters = async (req: AuthRequest, res: Response) => {
  try {
    const niche = getString(req.body?.niche || req.body?.topic);
    if (!niche) {
      return res.status(400).json({ error: 'niche is required' });
    }

    const result = await seoEngine.generateKeywordClusters(
      niche,
      createHttpLlmMetering(req, '/api/growth/keyword-clusters', 'growth-keyword-clusters'),
    );
    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    return res.json(result.data);
  } catch (error) {
    const handled = sendHttpLlmMeteringError(res, error);
    if (handled) {
      return handled;
    }

    throw error;
  }
};

export const generateBlogPost = async (req: AuthRequest, res: Response) => {
  try {
    const projectId = getString(req.body?.projectId);
    const topic = getString(req.body?.topic);
    const keywords = Array.isArray(req.body?.keywords)
      ? req.body.keywords.filter((keyword: unknown): keyword is string => typeof keyword === 'string')
      : [];
    const userId = requireAuthenticatedUserId(req);

    if (!projectId || !topic) {
      return res.status(400).json({ error: 'projectId and topic are required' });
    }

    const result = await seoEngine.generateBlogPost(
      projectId,
      topic,
      keywords,
      userId,
      createHttpLlmMetering(req, '/api/growth/blog-post', 'growth-blog-post'),
    );
    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    return res.json({ content: result.data });
  } catch (error) {
    const handled = sendHttpLlmMeteringError(res, error);
    if (handled) {
      return handled;
    }

    throw error;
  }
};

export const generateSocialContent = async (req: AuthRequest, res: Response) => {
  try {
    const context = getString(req.body?.context || req.body?.productContext);
    const platform = getString(req.body?.platform) as 'reddit' | 'twitter' | 'linkedin';
    if (!context || !platform) {
      return res.status(400).json({ error: 'context and platform are required' });
    }

    const result = await trafficAutomation.generateSocialContent(
      context,
      platform,
      createHttpLlmMetering(req, '/api/growth/social-content', 'growth-social-content'),
    );
    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    return res.json({ content: result.data });
  } catch (error) {
    const handled = sendHttpLlmMeteringError(res, error);
    if (handled) {
      return handled;
    }

    throw error;
  }
};

export const captureGrowthLead = async (req: Request, res: Response) => {
  const email = getString(req.body?.email);
  const sourcePageId = getString(req.body?.sourcePageId || req.body?.page_id);
  const metadata = req.body?.metadata && typeof req.body.metadata === 'object' ? req.body.metadata : {};

  if (!email || !sourcePageId) {
    return res.status(400).json({ error: 'email and sourcePageId are required' });
  }

  const result = await leadCapture.captureLead(email, sourcePageId, metadata);
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.status(201).json(result.data);
};
