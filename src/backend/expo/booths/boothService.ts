import { supabaseClient } from '../../../lib/supabaseClient.js';
import { logger } from '../../logging/logger.js';

export const boothService = {
  /**
   * Creates a new expo booth
   */
  async createBooth(data: any) {
    try {
      logger.info('BoothService', `Creating booth for ${data.company_name}`);
      const { data: booth, error } = await supabaseClient
        .from('expo_booths')
        .insert([data])
        .select()
        .single();

      if (error) throw error;
      return { data: booth, error: null };
    } catch (error) {
      logger.error('BoothService', 'Failed to create booth', error);
      return { data: null, error: String(error) };
    }
  },

  /**
   * Updates an existing booth
   */
  async updateBooth(id: string, updates: any) {
    try {
      logger.info('BoothService', `Updating booth ${id}`);
      const { data, error } = await supabaseClient
        .from('expo_booths')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('BoothService', 'Failed to update booth', error);
      return { data: null, error: String(error) };
    }
  },

  /**
   * Gets a single booth by ID
   */
  async getBooth(id: string) {
    try {
      const { data, error } = await supabaseClient
        .from('expo_booths')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('BoothService', 'Failed to get booth', error);
      return { data: null, error: String(error) };
    }
  },

  /**
   * Lists all booths
   */
  async listBooths() {
    try {
      const { data, error } = await supabaseClient
        .from('expo_booths')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('BoothService', 'Failed to list booths', error);
      return { data: null, error: String(error) };
    }
  }
};
