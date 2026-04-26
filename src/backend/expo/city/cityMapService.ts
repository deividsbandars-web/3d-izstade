import { supabaseClient } from '../../../lib/supabaseClient';
import { logger } from '../../logging/logger';
import { EXPO_SCENE_CANONICAL_DISTRICTS } from '../../../shared/expo/sceneContract.js';
import { listExpoBooths } from '../data/expoBoothStore';

export const cityMapService = {
  /**
   * Gets the overall layout of the City Map including districts and booths
   */
  async getCityMap() {
    try {
      logger.info('CityMapService', 'Fetching City Map layout');
      const districts = await this.getDistricts();
      const boothResult = await listExpoBooths();
      if (boothResult.error) throw boothResult.error;
      const booths = boothResult.data ?? [];

      // Group booths by district
      const mapLayout = districts.data?.map((district: string) => ({
        district,
        booths: booths?.filter(b => b.district === district) || []
      }));

      return { data: mapLayout, error: null };
    } catch (error) {
      logger.error('CityMapService', 'Failed to get city map', error);
      return { data: null, error: String(error) };
    }
  },

  /**
   * Gets all available districts in the Expo City
   */
  async getDistricts() {
    try {
      return { data: [...EXPO_SCENE_CANONICAL_DISTRICTS], error: null };
    } catch (error) {
      logger.error('CityMapService', 'Failed to get districts', error);
      return { data: null, error: String(error) };
    }
  },

  /**
   * Assigns a booth to a specific district
   */
  async assignBoothToDistrict(boothId: string, districtName: string) {
    try {
      logger.info('CityMapService', `Assigning booth ${boothId} to ${districtName}`);
      const { data, error } = await supabaseClient
        .from('expo_booths')
        .update({ district: districtName })
        .eq('id', boothId)
        .select()
        .single();

      if (error?.code === 'PGRST205') {
        return {
          data: {
            id: boothId,
            district: districtName,
            compatibilityMode: 'legacy-expo_booth',
            updated: false,
          },
          error: null,
        };
      }

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      logger.error('CityMapService', 'Failed to assign booth to district', error);
      return { data: null, error: String(error) };
    }
  }
};
