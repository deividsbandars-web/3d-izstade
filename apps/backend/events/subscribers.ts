import { eventSubscriber } from '../../../src/backend/events/eventSubscriber.js';
import { PlatformEvent } from '../../../src/backend/events/eventTypes.js';
import { logger } from '../../../src/backend/logging/logger.js';
import { emailSequenceEngine } from '../../../src/backend/sequences/emailSequenceEngine.js';
import { analyticsTracker } from '../../../src/backend/distribution/analyticsTracker.js';
import { platformBrain } from '../../../src/backend/platform/intelligence/platformBrain.js';
import { contentScheduler } from '../../../src/backend/distribution/contentScheduler.js';

export const registerSubscribers = () => {
  logger.info('EventSubscribers', 'Registering system event subscribers...');

  // 1. Email Automation reacts to new leads
  eventSubscriber.subscribe(PlatformEvent.LEAD_CREATED, async (payload) => {
    logger.info('EventSubscribers', `Processing LEAD_CREATED for lead: ${payload.data.leadId}`);
    // Auto-subscribe new leads to a default welcome sequence
    // In a real scenario, the sequence ID would be dynamic based on the lead's source or industry
    await emailSequenceEngine.subscribeLead(payload.data.leadId, 'default_welcome_sequence');
  });

  // 2. Analytics Tracker reacts to traffic and landing pages
  eventSubscriber.subscribe(PlatformEvent.LANDING_CREATED, async (payload) => {
    logger.info('EventSubscribers', `Processing LANDING_CREATED for page: ${payload.data.landingPageId}`);
    // We could trigger an initial index ping or register the page in our analytics DB
  });

  // 3. Platform Brain reacts to agent failures to auto-heal
  eventSubscriber.subscribe(PlatformEvent.AGENT_FAILED, async (payload) => {
    logger.info('EventSubscribers', `Processing AGENT_FAILED for agent: ${payload.data.agentId}`);
    // Trigger the self-healing intelligence
    await platformBrain.optimizeAgentPrompts(payload.data.agentId);
  });

  // 4. Distribution Engine reacts to blog publishing
  eventSubscriber.subscribe(PlatformEvent.BLOG_PUBLISHED, async (payload) => {
    logger.info('EventSubscribers', `Processing BLOG_PUBLISHED for project: ${payload.data.projectId}`);
    
    // Auto-schedule social media posts to promote the new blog
    const baseContent = `Check out our latest insights on ${payload.data.topic}! Read more: ${payload.data.url}`;
    
    await contentScheduler.schedulePost({
      projectId: payload.data.projectId,
      platform: 'twitter',
      content: { text: baseContent },
      scheduledAt: new Date(Date.now() + 1000 * 60 * 30).toISOString() // Schedule 30 mins from now
    });

    await contentScheduler.schedulePost({
      projectId: payload.data.projectId,
      platform: 'linkedin',
      content: { text: baseContent, li_user_id: payload.data.userId },
      scheduledAt: new Date(Date.now() + 1000 * 60 * 60).toISOString() // Schedule 1 hour from now
    });
  });

  logger.info('EventSubscribers', 'Subscribers registered successfully.');
};
