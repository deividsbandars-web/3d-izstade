import assert from 'node:assert/strict';
import type { Response } from 'express';
import {
  estimateWithAi,
  generateAiVideo,
  respondWithAi,
} from '../controllers/aiController.js';
import { generateBusiness } from '../controllers/businessController.js';
import { generateBlogPost } from '../controllers/growthController.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';
import { businessGenerator } from '../../src/backend/business/businessGenerator.js';
import { billingApplicationService } from '../../src/backend/billing/billingApplicationService.js';
import { pubClient, subClient } from '../../src/backend/events/eventBus.js';
import { seoEngine } from '../../src/backend/growth/seoEngine.js';
import {
  llmService,
  type GenerateTextOptions,
  type LlmMeteringContext,
} from '../../src/backend/ai/llmService.js';

function createMockResponse() {
  const result = {
    body: null as unknown,
    statusCode: 200,
  };
  const response = {
    json(body: unknown) {
      result.body = body;
      return response;
    },
    status(statusCode: number) {
      result.statusCode = statusCode;
      return response;
    },
  } as Response;

  return { response, result };
}

function createAuthRequest(body: unknown, userId = 'auth-user-1') {
  return {
    body,
    user: {
      id: userId,
      email: `${userId}@example.com`,
      role: 'user',
    },
  } as AuthRequest;
}

const originalGenerateText = llmService.generateText;
const originalCallOpenAI = llmService._callOpenAI;
const originalEnforceQuota = billingApplicationService.enforceQuota;
const originalTrackUsage = billingApplicationService.trackUsage;
const originalLaunchBusinessWorkflow = businessGenerator.launchBusinessWorkflow;
const originalGenerateBlogPost = seoEngine.generateBlogPost;

try {
  {
    const captured: Array<{ prompt: string; options: GenerateTextOptions }> = [];
    llmService.generateText = async (prompt: string, options: GenerateTextOptions) => {
      captured.push({ prompt, options });
      return { text: 'metered response', error: null };
    };

    const aiCases = [
      {
        action: 'ai-estimate',
        body: { description: 'Estimate a sponsor booth.' },
        controller: estimateWithAi,
        route: '/api/ai-estimate',
      },
      {
        action: 'ai-respond',
        body: { prompt: 'Summarize this.', context: 'Expo context' },
        controller: respondWithAi,
        route: '/api/ai/respond',
      },
      {
        action: 'ai-video-treatment',
        body: { prompt: 'Show the product.', style: 'cinematic' },
        controller: generateAiVideo,
        route: '/api/ai/video',
      },
    ];

    for (const testCase of aiCases) {
      const { response, result } = createMockResponse();
      await testCase.controller(createAuthRequest(testCase.body, 'auth-ai-user'), response);
      assert.equal(result.statusCode, 200);
    }

    assert.equal(captured.length, aiCases.length);
    for (let index = 0; index < aiCases.length; index += 1) {
      assert.deepEqual(captured[index].options.metering, {
        action: aiCases[index].action,
        route: aiCases[index].route,
        source: 'http',
        userId: 'auth-ai-user',
      });
    }
    llmService.generateText = originalGenerateText;
  }

  {
    let capturedBusinessUserId = '';
    let capturedBusinessMetering: LlmMeteringContext | null = null;
    businessGenerator.launchBusinessWorkflow = async (_niche, userId, metering) => {
      capturedBusinessUserId = userId || '';
      capturedBusinessMetering = metering || null;
      return {
        data: {
          brief: 'Generated brief',
          project_id: 'project-1',
          tasks_dispatched: 0,
        },
        error: null,
      };
    };

    const { response, result } = createMockResponse();
    await generateBusiness(createAuthRequest({
      niche: 'AI expo',
      userId: 'spoofed-body-user',
    }, 'auth-business-user'), response);

    assert.equal(result.statusCode, 200);
    assert.equal(capturedBusinessUserId, 'auth-business-user');
    assert.deepEqual(capturedBusinessMetering, {
      action: 'business-generate',
      route: '/api/business/generate',
      source: 'http',
      userId: 'auth-business-user',
    });
  }

  {
    let capturedBlogUserId = '';
    let capturedBlogMetering: LlmMeteringContext | null = null;
    seoEngine.generateBlogPost = async (_projectId, _topic, _keywords, userId, metering) => {
      capturedBlogUserId = userId || '';
      capturedBlogMetering = metering || null;
      return { data: 'blog content', error: null };
    };

    const { response, result } = createMockResponse();
    await generateBlogPost(createAuthRequest({
      keywords: ['expo'],
      projectId: 'project-1',
      topic: 'Web3D sponsor ROI',
      userId: 'spoofed-body-user',
    }, 'auth-growth-user'), response);

    assert.equal(result.statusCode, 200);
    assert.equal(capturedBlogUserId, 'auth-growth-user');
    assert.deepEqual(capturedBlogMetering, {
      action: 'growth-blog-post',
      route: '/api/growth/blog-post',
      source: 'http',
      userId: 'auth-growth-user',
    });
  }

  {
    let openAiCalls = 0;
    let capturedQuotaUserId = '';
    let capturedQuotaMetadata: unknown = null;
    let capturedUsageUserId: string | undefined;
    let capturedUsageMetadata: unknown = null;

    llmService._callOpenAI = async () => {
      openAiCalls += 1;
      return {
        content: 'tracked text',
        usage: {
          completion_tokens: 7,
          prompt_tokens: 11,
        },
      };
    };
    billingApplicationService.enforceQuota = async (userId, payload) => {
      capturedQuotaUserId = userId;
      capturedQuotaMetadata = payload?.metadata;
      return { allowed: true };
    };
    billingApplicationService.trackUsage = async (userId, payload) => {
      capturedUsageUserId = userId;
      capturedUsageMetadata = payload?.metadata;
    };

    const tracked = await llmService.generateText('Track this prompt.', {
      metering: {
        action: 'ai-respond',
        route: '/api/ai/respond',
        source: 'http',
        userId: 'auth-metered-user',
      },
      temperature: 0.2,
    });
    assert.equal(tracked.error, null);
    assert.equal(tracked.text, 'tracked text');
    assert.equal(openAiCalls, 1);
    assert.equal(capturedQuotaUserId, 'auth-metered-user');
    assert.deepEqual(capturedQuotaMetadata, {
      action: 'ai-respond',
      actor: undefined,
      billable: true,
      budget: undefined,
      promptLength: 'Track this prompt.'.length,
      route: '/api/ai/respond',
      source: 'http',
    });
    assert.equal(capturedUsageUserId, 'auth-metered-user');
    assert.deepEqual(capturedUsageMetadata, {
      action: 'ai-respond',
      actor: undefined,
      billable: true,
      budget: undefined,
      promptLength: 'Track this prompt.'.length,
      route: '/api/ai/respond',
      source: 'http',
      task: 'Track this prompt.',
    });

    const missingMetering = await llmService.generateText('No context prompt.', { temperature: 0.1 } as any);
    assert.equal(missingMetering.text, null);
    assert.match(String(missingMetering.error), /metering context is required/i);
    assert.equal(openAiCalls, 1);
  }
} finally {
  llmService.generateText = originalGenerateText;
  llmService._callOpenAI = originalCallOpenAI;
  billingApplicationService.enforceQuota = originalEnforceQuota;
  billingApplicationService.trackUsage = originalTrackUsage;
  businessGenerator.launchBusinessWorkflow = originalLaunchBusinessWorkflow;
  seoEngine.generateBlogPost = originalGenerateBlogPost;
  pubClient.disconnect();
  subClient.disconnect();
}
