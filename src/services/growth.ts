import { serverApiPost } from './serverApi.js';

export const GrowthAPI = {
  findProfitableNiches: async (payload: unknown) => serverApiPost('/api/growth/niches', payload),
  generateLandingPage: async (payload: unknown) => serverApiPost('/api/growth/landing-page', payload),
  generateKeywordClusters: async (payload: unknown) => serverApiPost('/api/growth/keyword-clusters', payload),
  generateBlogPost: async (payload: unknown) => serverApiPost('/api/growth/blog-post', payload),
  generateSocialContent: async (payload: unknown) => serverApiPost('/api/growth/social-content', payload),
  captureLead: async (payload: unknown) => serverApiPost('/api/growth/capture-lead', payload),
};
