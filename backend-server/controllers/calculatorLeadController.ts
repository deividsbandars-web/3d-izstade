import { Request, Response } from 'express';
import { getSupabase } from '../services/supabase.js';
import { validateCalculatorLeadRequest } from './calculatorLeadValidation.js';

export async function captureCalculatorLead(req: Request, res: Response) {
  try {
    const payload = validateCalculatorLeadRequest(req.body);
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('leads')
      .insert([{
        contact_info: {
          ...payload.contact_info,
          message: payload.message,
          score: payload.score,
        },
        notes: payload.message,
        source: payload.source,
        status: payload.status,
        value: payload.contact_info.estimateTotal,
      }])
      .select('id')
      .single();

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
