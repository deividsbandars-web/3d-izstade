import { logger } from '../../logging/logger.js';

export const templateService = {
  /**
   * Returns a list of available structural templates
   */
  async getAvailableTemplates(category?: string) {
    try {
      logger.info('TemplateService', `Fetching templates${category ? ` for category: ${category}` : ''}`);
      
      // Static registry of templates for now (could be moved to DB)
      const allTemplates = [
        { id: 'tpl_booth_tech', name: 'Cyberpunk Tech Booth', category: 'expo_booths', config: { mesh: 'tech_booth.uasset', colors: ['#0ff'] } },
        { id: 'tpl_landing_saas', name: 'SaaS High-Converting Landing', category: 'landing_pages', config: { sections: ['hero', 'features', 'pricing'] } },
        { id: 'tpl_campaign_bfcm', name: 'Black Friday Campaign', category: 'marketing_campaigns', config: { ad_sets: 3, budget_distribution: 'aggressive' } }
      ];

      const filtered = category 
        ? allTemplates.filter(t => t.category === category)
        : allTemplates;

      return { data: filtered, error: null };
    } catch (error) {
      logger.error('TemplateService', 'Failed to fetch templates', error);
      return { data: null, error: String(error) };
    }
  }
};
