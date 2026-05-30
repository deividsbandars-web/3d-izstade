import { Request, Response } from 'express';
import { getSupabase } from '../services/supabase.js';
import { validateCalculatorLeadRequest } from './calculatorLeadValidation.js';

const MAX_CALCULATOR_LEADS_LIMIT = 100;

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

export async function getCalculatorLeads(req: Request, res: Response) {
  try {
    const requestedLimit = Number(req.query.limit);
    const limit = Number.isFinite(requestedLimit)
      ? Math.min(Math.max(Math.round(requestedLimit), 1), MAX_CALCULATOR_LEADS_LIMIT)
      : 50;

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('leads')
      .select('id, source, status, value, notes, contact_info, created_at')
      .ilike('source', 'calculator:%')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    res.json(data ?? []);
  } catch (error: any) {
    res.status(500).json({ error: error?.message || 'CALCULATOR_LEADS_UNKNOWN' });
  }
}
