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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function resolveCompanyIdForLead(
  supabase: ReturnType<typeof getSupabase>,
  payload: ValidExpoLeadRequest,
) {
  if (isUuid(payload.companyId)) {
    return payload.companyId;
  }

  const slug = payload.companySlug || payload.companyId;
  const { data, error } = await supabase
    .from('companies')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return typeof data?.id === 'string' ? data.id : null;
}

export async function captureExpoLead(req: Request, res: Response) {
  try {
    const payload = validateExpoLeadRequest(req.body);
    const supabase = getSupabase();
    const resolvedCompanyId = await resolveCompanyIdForLead(supabase, payload);
    const { error } = await supabase
      .from('service_requests')
      .insert([{
        client_email: payload.clientEmail,
        client_name: payload.clientName,
        company_id: resolvedCompanyId,
        message: payload.message,
        service_name: payload.companySlug ? `expo_sponsor_lead:${payload.companySlug}` : 'expo_sponsor_lead',
      }]);

    if (error) {
      throw error;
    }

    res.status(201).json({
      companyId: resolvedCompanyId,
      companySlug: payload.companySlug,
      sourcePath: payload.sourcePath,
      success: true,
    });
  } catch (error: any) {
    const code = String(error?.message || 'EXPO_LEAD_UNKNOWN');
    const status = code.startsWith('EXPO_LEAD_') ? 400 : 500;
    res.status(status).json({ error: code });
  }
}
