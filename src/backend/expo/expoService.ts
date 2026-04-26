import { supabaseClient, handleSupabaseError } from '../../lib/supabaseClient';
import {
  EXPO_SCENE_CONTRACT_VERSION,
  EXPO_SCENE_RELEASE_MODE,
} from '../../shared/expo/sceneContract.js';

export interface ExpoBooth {
  id?: string;
  company_name: string;
  industry_sector?: string;
  subscription_type?: string;
  assets_3d?: Record<string, any>;
  contact_info?: Record<string, any>;
  status?: string;
  created_at?: string;
  updated_at?: string;
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

function normalizeLegacyBooth(record: Record<string, any>) {
  return {
    ...record,
    company_name: record.company_name ?? record.title ?? `Booth ${record.id}`,
  };
}

export const expoService = {
  /**
   * Creates a new expo booth
   */
  async createBooth(boothData: Omit<ExpoBooth, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const pluralResult = await supabaseClient
        .from('expo_booths')
        .insert([boothData])
        .select()
        .single();

      if (!pluralResult.error) {
        return { data: pluralResult.data, error: null };
      }

      if (!isMissingTableError(pluralResult.error)) throw pluralResult.error;

      const legacyResult = await supabaseClient
        .from('expo_booth')
        .insert([boothData])
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
      const pluralResult = await supabaseClient
        .from('expo_booths')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (!pluralResult.error) {
        return { data: pluralResult.data, error: null };
      }

      if (!isMissingTableError(pluralResult.error)) throw pluralResult.error;

      const legacyResult = await supabaseClient
        .from('expo_booth')
        .update(updates)
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
      return { data: (legacyResult.data ?? []).map((record) => normalizeLegacyBooth(record)), error: null };
    } catch (error) {
      return handleSupabaseError(error, 'getBooths');
    }
  },

  /**
   * Retrieves a specific booth by its ID
   */
  async getBoothById(id: string) {
    try {
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
