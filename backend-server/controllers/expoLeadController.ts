import { Request, Response } from 'express';
import { getSupabase } from '../services/supabase.js';

type ExpoLeadRequestBody = {
  clientEmail?: unknown;
  clientName?: unknown;
  companyId?: unknown;
  companySlug?: unknown;
  message?: unknown;
  sourcePath?: unknown;
};

export type ValidExpoLeadRequest = {
  clientEmail: string;
  clientName: string;
  companyId: string;
  companySlug: string | null;
  message: string | null;
  sourcePath: string | null;
};

function normalizeRequiredText(value: unknown, code: string) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  if (!normalized) {
    throw new Error(code);
  }

  return normalized;
}

function normalizeOptionalText(value: unknown) {
  const normalized = typeof value === 'string' ? value.trim() : '';
  return normalized ? normalized : null;
}

function normalizeEmail(value: unknown) {
  const normalized = normalizeRequiredText(value, 'EXPO_LEAD_EMAIL_REQUIRED');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
    throw new Error('EXPO_LEAD_EMAIL_INVALID');
  }

  return normalized;
}

export function validateExpoLeadRequest(body: ExpoLeadRequestBody): ValidExpoLeadRequest {
  return {
    clientEmail: normalizeEmail(body.clientEmail),
    clientName: normalizeRequiredText(body.clientName, 'EXPO_LEAD_NAME_REQUIRED'),
    companyId: normalizeRequiredText(body.companyId, 'EXPO_LEAD_COMPANY_REQUIRED'),
    companySlug: normalizeOptionalText(body.companySlug),
    message: normalizeOptionalText(body.message),
    sourcePath: normalizeOptionalText(body.sourcePath),
  };
}

export async function captureExpoLead(req: Request, res: Response) {
  try {
    const payload = validateExpoLeadRequest(req.body);
    const supabase = getSupabase();
    const { error } = await supabase
      .from('service_requests')
      .insert([{
        client_email: payload.clientEmail,
        client_name: payload.clientName,
        company_id: payload.companyId,
        message: payload.message,
        service_name: payload.companySlug ? `expo_sponsor_lead:${payload.companySlug}` : 'expo_sponsor_lead',
      }]);

    if (error) {
      throw error;
    }

    res.status(201).json({
      sourcePath: payload.sourcePath,
      success: true,
    });
  } catch (error: any) {
    const code = String(error?.message || 'EXPO_LEAD_UNKNOWN');
    const status = code.startsWith('EXPO_LEAD_') ? 400 : 500;
    res.status(status).json({ error: code });
  }
}
