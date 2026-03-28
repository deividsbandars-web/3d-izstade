import { supabaseClient } from '../../../lib/supabaseClient.js';
import { logger } from '../../logging/logger.js';
import fs from 'fs';
import path from 'path';

const RELEASE_FALLBACK_MODEL_PATH = path.resolve(process.cwd(), 'public/models/construction_assets.glb');
const RELEASE_FALLBACK_MODEL_URL = '/models/construction_assets.glb';

export const assetPipeline = {
  /**
   * Pipeline to generate or copy a GLB model for a specific company,
   * optionally attaching branding, and storing it in Supabase Storage.
   */
  async generateGLBModel(params: { companyName: string, logoUrl?: string, colorTheme: string }): Promise<string> {
    try {
      logger.info('AssetPipeline', `Generating GLB for ${params.companyName}`);

      const { companyName } = params;
      const safeName = companyName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      const fileName = `${safeName}_booth_${Date.now()}.glb`;

      // 1. Read the base fallback model from public directory
      const baseModelPath = RELEASE_FALLBACK_MODEL_PATH;
      
      let fileBuffer: Buffer;
      if (fs.existsSync(baseModelPath)) {
        fileBuffer = fs.readFileSync(baseModelPath);
      } else {
        // If no base model exists, we create an empty buffer (or ideally fetch one)
        // In a true headless setup, we would use a library like 'glTF-Transform' to 
        // inject the logo texture and color theme into the binary buffer here.
        fileBuffer = Buffer.from(''); 
        logger.warn('AssetPipeline', 'release fallback GLB not found, uploading empty buffer');
      }

      // 2. Upload to Supabase Storage
      const { error } = await supabaseClient
        .storage
        .from('expo_assets')
        .upload(fileName, fileBuffer, {
          contentType: 'model/gltf-binary',
          upsert: true
        });

      if (error) {
        throw error;
      }

      // 3. Get Public URL
      const { data: urlData } = supabaseClient
        .storage
        .from('expo_assets')
        .getPublicUrl(fileName);

      logger.info('AssetPipeline', `Model uploaded to Supabase: ${urlData.publicUrl}`);
      return urlData.publicUrl;

    } catch (error) {
      logger.error('AssetPipeline', 'Failed to process asset', error);
      // Fallback to the local default model if storage upload fails
      return RELEASE_FALLBACK_MODEL_URL;
    }
  }
};
