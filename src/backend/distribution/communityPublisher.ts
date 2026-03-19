// @ts-ignore - tsraw package.json does not export types properly
import { TSRAW } from 'tsraw';
import { logger } from '../logging/logger.js';

/**
 * Handles publishing to community-driven platforms like Reddit.
 */
export const communityPublisher = {
  /**
   * Publishes a post to a specific subreddit.
   */
  async publishRedditPost(params: {
    subreddit: string;
    title: string;
    text?: string;
    url?: string;
  }) {
    const { subreddit, title, text, url } = params;

    try {
      logger.info('CommunityPublisher', `Publishing to Reddit: r/${subreddit}`);

      const r = await TSRAW.init({
        user_agent: 'Warpala-OS/1.0',
        client_id: process.env.REDDIT_CLIENT_ID || '',
        client_secret: process.env.REDDIT_CLIENT_SECRET || '',
        username: process.env.REDDIT_USERNAME || '',
        password: process.env.REDDIT_PASSWORD || ''
      });

      let submissionId = '';
      if (url) {
        const res = await r.submit({
          sr: subreddit,
          title,
          url,
          kind: 'link'
        });
        submissionId = res.name || res.id || '';
      } else {
        const res = await r.submit({
          sr: subreddit,
          title,
          text: text || '',
          kind: 'self'
        });
        submissionId = res.name || res.id || '';
      }

      return { success: true, id: submissionId };
    } catch (error) {
      logger.error('CommunityPublisher', `Failed to post to Reddit r/${subreddit}`, error);
      return { success: false, error: String(error) };
    }
  }
};
