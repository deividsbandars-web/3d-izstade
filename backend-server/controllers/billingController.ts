import { Request, Response } from 'express';
import { planService } from '../../src/backend/billing/plans/planService.js';
import { creditService } from '../../src/backend/billing/credits/creditService.js';
import { paymentService } from '../../src/backend/billing/payments/paymentService.js';

function getRequiredParam(value: unknown, name: string) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized) {
    throw new Error(`${name} is required`);
  }

  return normalized;
}

export const getPlanLimits = async (req: Request, res: Response) => {
  try {
    const planId = getRequiredParam(req.params.planId, 'planId');
    res.json(planService.getPlanLimits(planId));
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getUserPlan = async (req: Request, res: Response) => {
  try {
    const userId = getRequiredParam(req.params.userId, 'userId');
    const result = await planService.getUserPlan(userId);
    if (result.error) {
      return res.status(500).json({ error: result.error });
    }
    res.json(result.data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const upgradePlan = async (req: Request, res: Response) => {
  try {
    const userId = getRequiredParam(req.body?.userId, 'userId');
    const newPlan = getRequiredParam(req.body?.newPlan, 'newPlan');
    const result = await paymentService.upgradePlan(userId, newPlan);
    if (result.error) {
      return res.status(500).json({ error: result.error });
    }
    res.json(result.data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getCreditBalance = async (req: Request, res: Response) => {
  try {
    const userId = getRequiredParam(req.params.userId, 'userId');
    const result = await creditService.getCreditBalance(userId);
    if (result.error) {
      return res.status(500).json({ error: result.error });
    }
    res.json({ credits: result.data });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const buyCredits = async (req: Request, res: Response) => {
  try {
    const userId = getRequiredParam(req.body?.userId, 'userId');
    const packageId = getRequiredParam(req.body?.packageId, 'packageId');
    const amount = Number.parseInt(packageId, 10);
    const creditsToAdd = Number.isFinite(amount) && amount > 0 ? amount : 100;
    const result = await creditService.addCredits(userId, creditsToAdd);
    if (result.error) {
      return res.status(500).json({ error: result.error });
    }
    res.json({ credits: result.data, packageId, creditedAmount: creditsToAdd });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const createCheckoutSession = async (req: Request, res: Response) => {
  try {
    const userId = getRequiredParam(req.body?.userId, 'userId');
    const productId = getRequiredParam(req.body?.productId, 'productId');
    const kind = getRequiredParam(req.body?.kind, 'kind') as 'plan' | 'credits';
    const result = await paymentService.createCheckoutSession(userId, productId, kind);
    if (result.error) {
      return res.status(500).json({ error: result.error });
    }
    res.json(result.data);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
