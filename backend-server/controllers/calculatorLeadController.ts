import { Request, Response } from 'express';
import { leadsApplicationService } from '../../src/backend/leads/leadsApplicationService.js';
import { validateCalculatorLeadRequest } from './calculatorLeadValidation.js';

export async function captureCalculatorLead(req: Request, res: Response) {
  try {
    const payload = validateCalculatorLeadRequest(req.body);
    const { data, error } = await leadsApplicationService.createLeadForUser(undefined, payload);

    if (error) {
      throw error;
    }

    res.status(201).json({
      calculatorId: payload.contact_info.calculatorId,
      id: data?.id ?? null,
      source: payload.source,
      success: true,
    });
  } catch (error: any) {
    const code = String(error?.message || 'CALCULATOR_LEAD_UNKNOWN');
    const status = code.startsWith('CALCULATOR_LEAD_') ? 400 : 500;
    res.status(status).json({ error: code });
  }
}
