import type { Request, Response } from 'express';
import { billingApplicationService } from '../../src/backend/billing/billingApplicationService.js';
import { paymentService, type CheckoutKind } from '../../src/backend/billing/payments/paymentService.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

type BillingError = {
  code?: string;
  message?: string;
  status?: number;
};

type CheckoutRequestBody = {
  kind?: unknown;
  packageId?: unknown;
  productId?: unknown;
  userId?: unknown;
};

type RawBodyRequest = Request & {
  rawBody?: Buffer;
};

function normalizeString(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function createRequestError(message: string, status = 400) {
  const error = new Error(message);
  (error as Error & { status?: number }).status = status;
  return error;
}

function normalizeCheckoutKind(value: unknown): CheckoutKind {
  const normalized = normalizeString(value);
  if (normalized !== 'plan' && normalized !== 'credits') {
    throw createRequestError('kind must be plan or credits');
  }
  return normalized;
}

function resolveAuthenticatedUserId(req: AuthRequest, requestedUserId: string) {
  const authenticatedUserId = normalizeString(req.user?.id);
  if (!authenticatedUserId) {
    throw createRequestError('Authenticated user id is required', 401);
  }
  if (requestedUserId && requestedUserId !== authenticatedUserId && req.user?.role !== 'admin') {
    throw createRequestError('Cannot create checkout for another user', 403);
  }
  return requestedUserId || authenticatedUserId;
}

function getErrorStatus(error: unknown) {
  if (typeof error === 'object' && error && 'status' in error) {
    const status = Number((error as BillingError).status);
    if (Number.isInteger(status) && status >= 400 && status < 600) {
      return status;
    }
  }

  return 500;
}

function getErrorResponse(error: unknown) {
  if (typeof error === 'object' && error) {
    const billingError = error as BillingError;
    return {
      code: billingError.code || 'BILLING_ERROR',
      error: billingError.message || 'Billing request failed.',
    };
  }

  return {
    code: 'BILLING_ERROR',
    error: String(error || 'Billing request failed.'),
  };
}

function sendBillingError(res: Response, error: unknown) {
  return res.status(getErrorStatus(error)).json(getErrorResponse(error));
}

export const createBillingCheckoutSession = async (req: AuthRequest, res: Response) => {
  try {
    const body = (req.body ?? {}) as CheckoutRequestBody;
    const userId = resolveAuthenticatedUserId(req, normalizeString(body.userId));
    const productId = normalizeString(body.productId);
    const kind = normalizeCheckoutKind(body.kind);
    const result = await billingApplicationService.createCheckoutSession(userId, productId, kind);
    if (result.error) {
      return sendBillingError(res, result.error);
    }

    return res.status(201).json(result.data);
  } catch (error) {
    return sendBillingError(res, error);
  }
};

export const createBillingCreditCheckoutSession = async (req: AuthRequest, res: Response) => {
  try {
    const body = (req.body ?? {}) as CheckoutRequestBody;
    const userId = resolveAuthenticatedUserId(req, normalizeString(body.userId));
    const packageId = normalizeString(body.packageId || body.productId);
    const result = await billingApplicationService.buyCredits(userId, packageId);
    if (result.error) {
      return sendBillingError(res, result.error);
    }

    return res.status(201).json(result.data);
  } catch (error) {
    return sendBillingError(res, error);
  }
};

export const handleBillingWebhook = async (req: RawBodyRequest, res: Response) => {
  const payload = req.rawBody ?? (Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body ?? {})));
  const signature = typeof req.headers['stripe-signature'] === 'string'
    ? req.headers['stripe-signature']
    : undefined;
  const result = await paymentService.handleWebhook(payload, signature);

  if (!result.success) {
    return sendBillingError(res, result.error);
  }

  return res.status(200).json({ received: true });
};
