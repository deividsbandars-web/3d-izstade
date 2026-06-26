import { logger } from '../../logging/logger.js';
import { sceneBuilder } from '../sceneBuilder.js';
import { EXPO_SCENE_CANONICAL_DISTRICTS } from '../../../shared/expo/sceneContract.js';
import { getExpoBoothById, listExpoBooths } from '../data/expoBoothStore.js';

export const expoSceneService = {
  /**
   * Returns canonical Expo scene contract data
   */
  async getSceneData() {
    logger.info('ExpoSceneService', 'Getting canonical Expo scene contract');
    return sceneBuilder.buildScene();
  },

  /**
   * Returns localized scene data for a specific booth level
   */
  async getBoothScene(boothId: string) {
    try {
      logger.info('ExpoSceneService', `Getting Booth Scene for ${boothId}`);
      const boothResult = await getExpoBoothById(boothId);
      if (boothResult.error) throw boothResult.error;
      const booth = boothResult.data;
      if (!booth) {
        throw new Error(`Booth ${boothId} not found`);
      }

      const ue5Booth = {
        booth_id: booth.id,
        streamingLevel: `Level_Booth_${booth.id}`,
        model_url: booth['3d_model_url'],
        metadata: {
           company: booth.company_name,
           colors: booth.contact_info?.brand_colors || ['#ffffff'],
           interactiveElements: booth.assets_3d?.interactives || []
        }
      };

      return { data: ue5Booth, error: null };
    } catch (error) {
      logger.error('ExpoSceneService', 'Failed to get booth scene', error);
      return { data: null, error: String(error) };
    }
  },

  /**
   * Returns the macro layout for the City level
   */
  async getCityScene() {
    try {
      logger.info('ExpoSceneService', 'Getting City Map structural data');
      const boothResult = await listExpoBooths();
      if (boothResult.error) throw boothResult.error;
      const booths = boothResult.data ?? [];

      const boothDistricts = [...new Set(booths.map((b: any) => b.district).filter(Boolean))];
      const districts = boothDistricts.length > 0 ? boothDistricts : [...EXPO_SCENE_CANONICAL_DISTRICTS];

      const cityMapData = {
        navMeshReady: true,
        zones: districts.map(d => ({
          name: d,
          waypoint: `WP_Dist_${d}`
        }))
      };

      return { data: cityMapData, error: null };
    } catch (error) {
      logger.error('ExpoSceneService', 'Failed to get city scene', error);
      return { data: null, error: String(error) };
    }
  }
};
