import { trafficAutomation } from '../../../growth/trafficAutomation.js';

export const marketingToolAdapters = {
  async generateMarketing(context: string, platform: 'twitter' | 'linkedin' | 'reddit') {
    const result = await trafficAutomation.generateSocialContent(context, platform);
    return result.data || 'Failed to generate marketing.';
  },
};

