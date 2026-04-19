import { Request, Response } from 'express';
import { nicheDiscovery } from '../../src/backend/growth/nicheDiscovery.js';
import { landingGenerator } from '../../src/backend/growth/landingGenerator.js';
import { seoEngine } from '../../src/backend/growth/seoEngine.js';
import { trafficAutomation } from '../../src/backend/growth/trafficAutomation.js';
import { leadCapture } from '../../src/backend/growth/leadCapture.js';

function getString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : '';
}

export const findProfitableNiches = async (req: Request, res: Response) => {
  const industry = getString(req.body?.industry || req.body?.baseIndustry);
  if (!industry) {
    return res.status(400).json({ error: 'industry is required' });
  }

  const result = await nicheDiscovery.findProfitableNiches(industry);
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.json(result.data);
};

export const generateLandingPage = async (req: Request, res: Response) => {
  const projectId = getString(req.body?.projectId);
  const niche = getString(req.body?.niche);
  const productAngle = getString(req.body?.productAngle || req.body?.angle || req.body?.brief);

  if (!projectId || !niche || !productAngle) {
    return res.status(400).json({ error: 'projectId, niche, and productAngle are required' });
  }

  const result = await landingGenerator.generateLandingPage(projectId, niche, productAngle);
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.json(result.data);
};

export const generateKeywordClusters = async (req: Request, res: Response) => {
  const niche = getString(req.body?.niche || req.body?.topic);
  if (!niche) {
    return res.status(400).json({ error: 'niche is required' });
  }

  const result = await seoEngine.generateKeywordClusters(niche);
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.json(result.data);
};

export const generateBlogPost = async (req: Request, res: Response) => {
  const projectId = getString(req.body?.projectId);
  const topic = getString(req.body?.topic);
  const keywords = Array.isArray(req.body?.keywords)
    ? req.body.keywords.filter((keyword: unknown): keyword is string => typeof keyword === 'string')
    : [];
  const userId = getString(req.body?.userId) || undefined;

  if (!projectId || !topic) {
    return res.status(400).json({ error: 'projectId and topic are required' });
  }

  const result = await seoEngine.generateBlogPost(projectId, topic, keywords, userId);
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.json({ content: result.data });
};

export const generateSocialContent = async (req: Request, res: Response) => {
  const context = getString(req.body?.context || req.body?.productContext);
  const platform = getString(req.body?.platform) as 'reddit' | 'twitter' | 'linkedin';
  if (!context || !platform) {
    return res.status(400).json({ error: 'context and platform are required' });
  }

  const result = await trafficAutomation.generateSocialContent(context, platform);
  if (result.error) {
    return res.status(500).json({ error: result.error });
  }

  res.json({ content: result.data });
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
