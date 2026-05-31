import { getSupabaseAdminClient } from '../lib/supabaseAdmin.js';
import {
  EXPO_SCENE_CONTRACT_VERSION,
  EXPO_SCENE_RELEASE_MODE,
} from '../../shared/expo/sceneContract.js';

export interface ExpoBooth {
  id?: string;
  booth_type?: string;
  company_name: string;
  contact_email?: string;
  description?: string;
  district?: string;
  industry_sector?: string;
  logo?: string;
  subscription_type?: string;
  assets_3d?: Record<string, any>;
  contact_info?: Record<string, any>;
  status?: string;
  created_at?: string;
  updated_at?: string;
  ['3d_model_url']?: string;
}

export const EXPO_BACKEND_SERVICE_META = {
  contractVersion: EXPO_SCENE_CONTRACT_VERSION,
  releaseMode: EXPO_SCENE_RELEASE_MODE,
} as const;

type SupabaseLikeError = {
  code?: string;
  message?: string;
};

function isMissingTableError(error: unknown) {
  const candidate = error as SupabaseLikeError | null;
  return candidate?.code === 'PGRST205';
}

function handleSupabaseError(error: any, context: string) {
  console.error(`[Supabase Error - ${context}]:`, error?.message || error);
  return { data: null, error: error?.message || 'Unknown database error' };
}

function normalizeLegacyBooth(record: Record<string, any>) {
  return {
    ...record,
    company_name: record.company_name ?? record.title ?? `Booth ${record.id}`,
  };
}

function pickDefined(source: Record<string, any>, keys: string[]) {
  return keys.reduce<Record<string, any>>((next, key) => {
    if (source[key] !== undefined) {
      next[key] = source[key];
    }

    return next;
  }, {});
}

function normalizePluralBoothPayload(payload: Record<string, any>) {
  return pickDefined(payload, [
    'company_name',
    'industry_sector',
    'subscription_type',
    'assets_3d',
    'contact_info',
    'status',
    'description',
    'booth_type',
    '3d_model_url',
    'logo',
    'contact_email',
    'district',
  ]);
}

function normalizeLegacyBoothPayload(payload: Record<string, any>, options: { requireTitle: boolean }) {
  const companyName = String(payload.company_name || payload.title || '').trim();
  const normalized = pickDefined(payload, [
    'company_name',
    'industry_sector',
    'subscription_type',
    'assets_3d',
    'contact_info',
    'status',
    'district',
    'logo_url',
    'color',
    'position_z',
    'side',
  ]);

  if (options.requireTitle || payload.title !== undefined || payload.company_name !== undefined) {
    normalized.title = String(payload.title || companyName || 'Managed Expo Booth').trim();
  }

  if (options.requireTitle || payload.plan_type !== undefined || payload.subscription_type !== undefined) {
    normalized.plan_type = String(payload.plan_type || payload.subscription_type || 'standard').trim();
  }

  return normalized;
}

export const expoService = {
  /**
   * Creates a new expo booth
   */
  async createBooth(boothData: Omit<ExpoBooth, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const supabaseClient = getSupabaseAdminClient();
      const normalizedPluralPayload = normalizePluralBoothPayload(boothData as Record<string, any>);
      const pluralResult = await supabaseClient
        .from('expo_booths')
        .insert([normalizedPluralPayload])
        .select()
        .single();

      if (!pluralResult.error) {
        return { data: pluralResult.data, error: null };
      }

      if (!isMissingTableError(pluralResult.error)) throw pluralResult.error;

      const normalizedLegacyPayload = normalizeLegacyBoothPayload(boothData as Record<string, any>, { requireTitle: true });
      const legacyResult = await supabaseClient
        .from('expo_booth')
        .insert([normalizedLegacyPayload])
        .select()
        .single();

      if (legacyResult.error) throw legacyResult.error;
      return { data: normalizeLegacyBooth(legacyResult.data), error: null };
    } catch (error) {
      return handleSupabaseError(error, 'createBooth');
    }
  },

  /**
   * Updates an existing expo booth
   */
  async updateBooth(id: string, updates: Partial<ExpoBooth>) {
    try {
      const supabaseClient = getSupabaseAdminClient();
      const normalizedPluralPayload = normalizePluralBoothPayload(updates as Record<string, any>);
      const pluralResult = await supabaseClient
        .from('expo_booths')
        .update(normalizedPluralPayload)
        .eq('id', id)
        .select()
        .single();

      if (!pluralResult.error) {
        return { data: pluralResult.data, error: null };
      }

      if (!isMissingTableError(pluralResult.error)) throw pluralResult.error;

      const normalizedLegacyPayload = normalizeLegacyBoothPayload(updates as Record<string, any>, { requireTitle: false });
      const legacyResult = await supabaseClient
        .from('expo_booth')
        .update(normalizedLegacyPayload)
        .eq('id', id)
        .select()
        .single();

      if (legacyResult.error) throw legacyResult.error;
      return { data: normalizeLegacyBooth(legacyResult.data), error: null };
    } catch (error) {
      return handleSupabaseError(error, 'updateBooth');
    }
  },

  /**
   * Retrieves all active expo booths
   */
  async getBooths() {
    try {
      const supabaseClient = getSupabaseAdminClient();
      const pluralResult = await supabaseClient
        .from('expo_booths')
        .select('*')
        .order('created_at', { ascending: false });

      if (!pluralResult.error) {
        return { data: pluralResult.data, error: null };
      }

      if (!isMissingTableError(pluralResult.error)) throw pluralResult.error;

      const legacyResult = await supabaseClient
        .from('expo_booth')
        .select('*')
        .order('id', { ascending: true });

      if (legacyResult.error) throw legacyResult.error;
      return {
        data: (legacyResult.data ?? []).map((record: Record<string, any>) => normalizeLegacyBooth(record)),
        error: null,
      };
    } catch (error) {
      return handleSupabaseError(error, 'getBooths');
    }
  },

  /**
   * Retrieves a specific booth by its ID
   */
  async getBoothById(id: string) {
    try {
      const supabaseClient = getSupabaseAdminClient();
      const pluralResult = await supabaseClient
        .from('expo_booths')
        .select('*')
        .eq('id', id)
        .single();

      if (!pluralResult.error) {
        return { data: pluralResult.data, error: null };
      }

      if (!isMissingTableError(pluralResult.error)) throw pluralResult.error;

      const legacyResult = await supabaseClient
        .from('expo_booth')
        .select('*')
        .eq('id', id)
        .single();

      if (legacyResult.error) throw legacyResult.error;
      return { data: normalizeLegacyBooth(legacyResult.data), error: null };
    } catch (error) {
      return handleSupabaseError(error, 'getBoothById');
    }
  }
};
