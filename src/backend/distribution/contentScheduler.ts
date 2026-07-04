import { Redis } from 'ioredis';
import { logger } from '../logging/logger.js';
import { supabaseClient } from '../../lib/supabaseClient.js';
import { socialPublisher } from './socialPublisher.js';
import { communityPublisher } from './communityPublisher.js';
import { getRedisTlsOptions, resolveRedisConnectionPolicy } from '../infrastructure/redisConnectionPolicy.js';

const redisPolicy = resolveRedisConnectionPolicy(process.env.REDIS_URL || 'redis://localhost:6379');
const redis = new Redis(redisPolicy.url, getRedisTlsOptions(redisPolicy));

/**
 * Manages scheduled content publishing across multiple platforms.
 */
export const contentScheduler = {
  /**
   * Adds a post to the schedule in both Supabase and Redis queue.
   */
  async schedulePost(params: {
    projectId: string;
    platform: 'twitter' | 'linkedin' | 'reddit';
    content: any;
    scheduledAt: string;
  }) {
    try {
      logger.info('ContentScheduler', `Scheduling ${params.platform} post for project ${params.projectId}`);

      // 1. Save to Supabase
      const { data, error } = await supabaseClient
        .from('content_schedule')
        .insert([{
          project_id: params.projectId,
          platform: params.platform,
          content: params.content,
          scheduled_at: params.scheduledAt,
          status: 'scheduled'
        }])
        .select()
        .single();

      if (error) throw error;

      // 2. Add to Redis delayed queue
      await redis.zadd('scheduled_posts_queue', new Date(params.scheduledAt).getTime(), data.id);

      return { data, error: null };
    } catch (error) {
      logger.error('ContentScheduler', 'Failed to schedule post', error);
      return { data: null, error: String(error) };
    }
  },

  /**
   * Periodic task runner to publish ready posts.
   */
  async runScheduledPosts() {
    try {
      const now = Date.now();
      
      // Fetch post IDs from Redis that are due
      const postIds = await redis.zrangebyscore('scheduled_posts_queue', 0, now);
      
      if (postIds.length === 0) return;

      logger.info('ContentScheduler', `Found ${postIds.length} posts to publish.`);

      for (const id of postIds) {
        // Fetch full content from Supabase
        const { data: post, error: fetchError } = await supabaseClient
          .from('content_schedule')
          .select('*')
          .eq('id', id)
          .single();

        if (fetchError || !post) continue;

        let result: any = { success: false };

        // Route to correct publisher
        if (post.platform === 'twitter') {
          result = await socialPublisher.publishTweet(post.content.text);
        } else if (post.platform === 'linkedin') {
          result = await socialPublisher.publishLinkedInPost(post.content.li_user_id, post.content.text);
        } else if (post.platform === 'reddit') {
          result = await communityPublisher.publishRedditPost(post.content);
        }

        // Update status
        if (result.success) {
          await supabaseClient
            .from('content_schedule')
            .update({ status: 'published', published_at: new Date().toISOString() })
            .eq('id', id);
          
          // Remove from Redis
          await redis.zrem('scheduled_posts_queue', id);
        } else {
          await supabaseClient
            .from('content_schedule')
            .update({ status: 'failed', error_log: result.error })
            .eq('id', id);
        }
      }
    } catch (error) {
      logger.error('ContentScheduler', 'Error in runScheduledPosts', error);
    }
  }
};
