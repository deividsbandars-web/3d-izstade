import { Request, Response } from 'express';
import { agentRegistry } from '../../src/backend/marketplace/agents/agentRegistry.js';
import { installService } from '../../src/backend/marketplace/installService.js';
import { workflowMarketplace } from '../../src/backend/marketplace/workflows/workflowMarketplace.js';
import { templateService } from '../../src/backend/marketplace/templates/templateService.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

type MarketplaceControllerError = Error & {
  code?: string;
  status?: number;
};

function createMarketplaceError(message: string, status = 400, code = 'MARKETPLACE_REQUEST_INVALID') {
  const error = new Error(message) as MarketplaceControllerError;
  error.status = status;
  error.code = code;
  return error;
}

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function requireAuthenticatedMarketplaceUserId(req: AuthRequest) {
  const userId = normalizeString(req.user?.id);
  if (!userId) {
    throw createMarketplaceError('Authenticated user id is required', 401, 'AUTHENTICATED_USER_REQUIRED');
  }

  return userId;
}

function resolveInstallUserId(req: AuthRequest) {
  const authenticatedUserId = requireAuthenticatedMarketplaceUserId(req);
  const requestedUserId = normalizeString(req.body?.userId);
  if (requestedUserId && requestedUserId !== authenticatedUserId) {
    throw createMarketplaceError('Cannot install marketplace items for another user', 403, 'MARKETPLACE_USER_FORBIDDEN');
  }

  return authenticatedUserId;
}

function sendMarketplaceError(res: Response, error: unknown) {
  if (typeof error === 'object' && error) {
    const marketplaceError = error as MarketplaceControllerError;
    const status = Number(marketplaceError.status);
    return res.status(Number.isInteger(status) && status >= 400 && status < 600 ? status : 500).json({
      code: marketplaceError.code || 'MARKETPLACE_REQUEST_FAILED',
      error: marketplaceError.message || 'Marketplace request failed',
    });
  }

  return res.status(500).json({
    code: 'MARKETPLACE_REQUEST_FAILED',
    error: String(error || 'Marketplace request failed'),
  });
}

export const getMarketplaceAgents = async (req: Request, res: Response) => {
  try {
    const agents = await agentRegistry.getAvailableAgents();
    res.json(agents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const installAgent = async (req: AuthRequest, res: Response) => {
  const agentId = normalizeString(req.body?.agentId);

  if (!agentId) {
    return res.status(400).json({ error: 'agentId is required' });
  }

  try {
    const userId = resolveInstallUserId(req);
    const result = await installService.installAgent(userId, agentId);
    return res.json(result);
  } catch (error) {
    return sendMarketplaceError(res, error);
  }
};

export const getMarketplaceWorkflows = async (_req: Request, res: Response) => {
  try {
    const result = await workflowMarketplace.getAvailableWorkflows();
    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    res.json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getMarketplaceTemplates = async (req: Request, res: Response) => {
  try {
    const category = typeof req.query.category === 'string' ? req.query.category.trim() : undefined;
    const result = await templateService.getAvailableTemplates(category);
    if (result.error) {
      return res.status(500).json({ error: result.error });
    }

    res.json(result.data);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const installWorkflow = async (req: AuthRequest, res: Response) => {
  const workflowId = normalizeString(req.body?.workflowId);

  if (!workflowId) {
    return res.status(400).json({ error: 'workflowId is required' });
  }

  try {
    const userId = resolveInstallUserId(req);
    const result = await installService.installWorkflow(userId, workflowId);
    return res.json(result);
  } catch (error) {
    return sendMarketplaceError(res, error);
  }
};

export const installTemplate = async (req: AuthRequest, res: Response) => {
  const templateId = normalizeString(req.body?.templateId);

  if (!templateId) {
    return res.status(400).json({ error: 'templateId is required' });
  }

  try {
    const userId = resolveInstallUserId(req);
    const result = await installService.installTemplate(userId, templateId);
    return res.json(result);
  } catch (error) {
    return sendMarketplaceError(res, error);
  }
};
