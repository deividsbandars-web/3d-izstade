import { TwitterApi } from 'twitter-api-v2';
import { logger } from '../logging/logger.js';
/**
 * Handles publishing to mainstream social media platforms.
 * Requires API credentials in environment variables.
 */
export const socialPublisher = {
    /**
     * Publishes a tweet to Twitter/X
     */
    async publishTweet(content) {
        try {
            logger.info('SocialPublisher', 'Publishing to Twitter/X');
            const client = new TwitterApi({
                appKey: process.env.TWITTER_APP_KEY,
                appSecret: process.env.TWITTER_APP_SECRET,
                accessToken: process.env.TWITTER_ACCESS_TOKEN,
                accessSecret: process.env.TWITTER_ACCESS_SECRET,
            });
            const tweet = await client.v2.tweet(content);
            return { success: true, id: tweet.data.id };
        }
        catch (error) {
            logger.error('SocialPublisher', 'Failed to publish tweet', error);
            return { success: false, error: String(error) };
        }
    },
    /**
     * Publishes a post to LinkedIn.
     * Note: Requires LinkedIn OAuth token with 'w_member_social' scope.
     */
    async publishLinkedInPost(userId, content) {
        try {
            logger.info('SocialPublisher', `Publishing to LinkedIn for user ${userId}`);
            const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${process.env.LINKEDIN_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json',
                    'X-Restli-Protocol-Version': '2.0.0'
                },
                body: JSON.stringify({
                    author: `urn:li:person:${userId}`,
                    lifecycleState: 'PUBLISHED',
                    specificContent: {
                        'com.linkedin.ugc.ShareContent': {
                            shareCommentary: { text: content },
                            shareMediaCategory: 'NONE'
                        }
                    },
                    visibility: { 'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC' }
                })
            });
            if (!response.ok)
                throw new Error(`LinkedIn API error: ${response.statusText}`);
            const data = await response.json();
            return { success: true, id: data.id };
        }
        catch (error) {
            logger.error('SocialPublisher', 'Failed to publish to LinkedIn', error);
            return { success: false, error: String(error) };
        }
    }
};
