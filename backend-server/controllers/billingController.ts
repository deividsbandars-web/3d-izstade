import { Request, Response } from 'express';
import { billingApplicationService } from '../../src/backend/billing/billingApplicationService.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

type BillingControllerError = Error & {
  code?: string;
  status?: number;
};

function getRequiredParam(value: unknown, name: string) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized) {
    throw new Error(`${name} is required`);
  }

  return normalized;
}

function createBillingControllerError(message: string, status = 400, code = 'BILLING_REQUEST_INVALID') {
  const error = new Error(message) as BillingControllerError;
  error.status = status;
  error.code = code;
  return error;
}

function getErrorStatus(error: unknown) {
  if (typeof error === 'object' && error && 'status' in error) {
    const status = Number((error as BillingControllerError).status);
    if (Number.isInteger(status) && status >= 400 && status < 600) {
      return status;
    }
  }

  return 400;
}

function getErrorBody(error: unknown) {
  if (typeof error === 'object' && error) {
    const billingError = error as BillingControllerError;
    return {
      code: billingError.code || 'BILLING_REQUEST_INVALID',
      error: billingError.message || 'Billing request failed',
    };
  }

  return {
    code: 'BILLING_REQUEST_INVALID',
    error: String(error || 'Billing request failed'),
  };
}

function requireAuthenticatedUserId(req: AuthRequest) {
  const authenticatedUserId = typeof req.user?.id === 'string' ? req.user.id.trim() : '';
  if (!authenticatedUserId) {
    throw createBillingControllerError('Authenticated user id is required', 401, 'AUTHENTICATED_USER_REQUIRED');
  }

  return authenticatedUserId;
}

function resolveSelfServiceUserId(req: AuthRequest, requestedUserId: unknown) {
  const authenticatedUserId = requireAuthenticatedUserId(req);
  const normalizedRequestedUserId = typeof requestedUserId === 'string' ? requestedUserId.trim() : '';
  if (
    normalizedRequestedUserId
    && normalizedRequestedUserId !== authenticatedUserId
    && req.user?.role !== 'admin'
  ) {
    throw createBillingControllerError('Cannot access billing resources for another user', 403, 'BILLING_USER_FORBIDDEN');
  }

  return normalizedRequestedUserId || authenticatedUserId;
}

function requireAdminUser(req: AuthRequest) {
  requireAuthenticatedUserId(req);
  if (req.user?.role !== 'admin') {
    throw createBillingControllerError('Admin access required for direct plan upgrades', 403, 'BILLING_PLAN_UPGRADE_FORBIDDEN');
  }
}

function sendBillingControllerError(res: Response, error: unknown) {
  return res.status(getErrorStatus(error)).json(getErrorBody(error));
}

export const getPlanLimits = async (req: Request, res: Response) => {
  try {
    const planId = getRequiredParam(req.params.planId, 'planId');
    res.json(billingApplicationService.getPlanLimits(planId));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getUserPlan = async (req: AuthRequest, res: Response) => {
  try {
    const userId = resolveSelfServiceUserId(req, req.params.userId);
    const result = await billingApplicationService.getUserPlan(userId);
    if (result.error) {
      return res.status(500).json({ error: result.error });
    }
    return res.json(result.data);
  } catch (error) {
    return sendBillingControllerError(res, error);
  }
};

export const upgradePlan = async (req: AuthRequest, res: Response) => {
  try {
    requireAdminUser(req);
    const userId = getRequiredParam(req.body?.userId, 'userId');
    const newPlan = getRequiredParam(req.body?.newPlan, 'newPlan');
    const result = await billingApplicationService.upgradePlan(userId, newPlan);
    if (result.error) {
      return res.status(500).json({ error: result.error });
    }
    return res.json(result.data);
  } catch (error) {
    return sendBillingControllerError(res, error);
  }
};

export const getCreditBalance = async (req: AuthRequest, res: Response) => {
  try {
    const userId = resolveSelfServiceUserId(req, req.params.userId);
    const result = await billingApplicationService.getCreditBalance(userId);
    if (result.error) {
      return res.status(500).json({ error: result.error });
    }
    return res.json({ credits: result.data });
  } catch (error) {
    return sendBillingControllerError(res, error);
  }
};

export const buyCredits = async (req: AuthRequest, res: Response) => {
  try {
    const userId = resolveSelfServiceUserId(req, req.body?.userId);
    const packageId = getRequiredParam(req.body?.packageId, 'packageId');
    const result = await billingApplicationService.buyCredits(userId, packageId);
    if (result.error) {
      return res.status(500).json({ error: result.error });
    }
    return res.json(result.data);
  } catch (error) {
    return sendBillingControllerError(res, error);
  }
};

export const createCheckoutSession = async (req: AuthRequest, res: Response) => {
  try {
    const userId = resolveSelfServiceUserId(req, req.body?.userId);
    const productId = getRequiredParam(req.body?.productId, 'productId');
    const kind = getRequiredParam(req.body?.kind, 'kind') as 'plan' | 'credits';
    const result = await billingApplicationService.createCheckoutSession(userId, productId, kind);
    if (result.error) {
      return res.status(500).json({ error: result.error });
    }
    return res.json(result.data);
  } catch (error) {
    return sendBillingControllerError(res, error);
  }
};
