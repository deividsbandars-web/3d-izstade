import snoowrap from 'snoowrap';
import { logger } from '../logging/logger.js';
/**
 * Handles publishing to community-driven platforms like Reddit.
 */
export const communityPublisher = {
    /**
     * Publishes a post to a specific subreddit.
     */
    async publishRedditPost(params) {
        const { subreddit, title, text, url } = params;
        try {
            logger.info('CommunityPublisher', `Publishing to Reddit: r/${subreddit}`);
            const r = new snoowrap({
                userAgent: 'Warpala-OS/1.0',
                clientId: process.env.REDDIT_CLIENT_ID,
                clientSecret: process.env.REDDIT_CLIENT_SECRET,
                username: process.env.REDDIT_USERNAME,
                password: process.env.REDDIT_PASSWORD
            });
            let submissionId = '';
            if (url) {
                // @ts-expect-error - snoowrap types are cyclic here
                const sub = await r.submitLink({ subredditName: subreddit, title, url });
                submissionId = sub.id;
            }
            else {
                // @ts-expect-error - snoowrap types are cyclic here
                const sub = await r.submitSelfpost({ subredditName: subreddit, title, text: text || '' });
                submissionId = sub.id;
            }
            return { success: true, id: submissionId };
        }
        catch (error) {
            logger.error('CommunityPublisher', `Failed to post to Reddit r/${subreddit}`, error);
            return { success: false, error: String(error) };
        }
    }
};
