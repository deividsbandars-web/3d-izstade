import { supabaseClient } from '../../lib/supabaseClient.js';
import { logger } from '../logging/logger.js';
import {
  EXPO_SCENE_CONTRACT_VERSION,
  EXPO_SCENE_RELEASE_MODE,
  type ExpoSceneContract,
} from '../../modules/expo/types/scene.js';

export const sceneBuilder = {
  /**
   * Compiles the entire 3D scene data into a single structured payload for the frontend / Unreal Engine.
   */
  async buildScene() {
    try {
      logger.info('SceneBuilder', 'Building Expo Scene...');

      const [sectorsResult, companiesResult, boothsResult] = await Promise.all([
        supabaseClient.from('sectors').select('*'),
        supabaseClient.from('companies').select('*').eq('is_active', true),
        supabaseClient.from('booths').select('*')
      ]);

      if (sectorsResult.error) throw new Error(`Failed to load sectors: ${sectorsResult.error.message}`);
      if (companiesResult.error) throw new Error(`Failed to load companies: ${companiesResult.error.message}`);
      if (boothsResult.error) throw new Error(`Failed to load booths: ${boothsResult.error.message}`);

      const booths = boothsResult.data || [];
      const sectors = sectorsResult.data || [];
      const companies = (companiesResult.data || []).map(company => {
        const companyBooth = booths.find(b => b.company_id === company.id);
        return {
          ...company,
          booth: companyBooth || {}
        };
      });
      const sceneData: ExpoSceneContract = {
        authPolicy: 'public-readonly',
        booths: booths.map((booth: any) => ({
          ...booth,
          companyId: String(booth.companyId || booth.company_id || ''),
        })),
        cityInfo: {
          globalLocation: null,
          id: 'warpala-expo-city',
          name: 'Warpala Expo',
          style: 0,
        },
        companies,
        generatedAt: new Date().toISOString(),
        releaseMode: EXPO_SCENE_RELEASE_MODE,
        sceneVersion: EXPO_SCENE_CONTRACT_VERSION,
        sectors,
      };

      logger.info('SceneBuilder', `Scene built with ${sectors.length} sectors and ${companies.length} companies.`);
      return { data: sceneData, error: null };
    } catch (error) {
      logger.error('SceneBuilder', 'Failed to build scene', error);
      return { data: null, error: String(error) };
    }
  }
};
