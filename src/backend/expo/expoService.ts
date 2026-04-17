import { supabaseClient, handleSupabaseError } from '../../lib/supabaseClient';
import {
  EXPO_SCENE_CONTRACT_VERSION,
  EXPO_SCENE_RELEASE_MODE,
} from '../../modules/expo/types/scene';

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

export const expoService = {
  /**
   * Creates a new expo booth
   */
  async createBooth(boothData: Omit<ExpoBooth, 'id' | 'created_at' | 'updated_at'>) {
    try {
      const { data, error } = await supabaseClient
        .from('expo_booths')
        .insert([boothData])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return handleSupabaseError(error, 'createBooth');
    }
  },

  /**
   * Updates an existing expo booth
   */
  async updateBooth(id: string, updates: Partial<ExpoBooth>) {
    try {
      const { data, error } = await supabaseClient
        .from('expo_booths')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return handleSupabaseError(error, 'updateBooth');
    }
  },

  /**
   * Retrieves all active expo booths
   */
  async getBooths() {
    try {
      const { data, error } = await supabaseClient
        .from('expo_booths')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return handleSupabaseError(error, 'getBooths');
    }
  },

  /**
   * Retrieves a specific booth by its ID
   */
  async getBoothById(id: string) {
    try {
      const { data, error } = await supabaseClient
        .from('expo_booths')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      return handleSupabaseError(error, 'getBoothById');
    }
  }
};
