import { logger } from '../logging/logger.js';
import OpenAI from 'openai';
import { billingApplicationService } from '../billing/billingApplicationService.js';

const getEnv = (name: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[name]) {
    return process.env[name] as string;
  }
  return '';
};

const isServerRuntime = typeof process !== 'undefined' && Boolean(process.versions?.node);

let openaiClient: OpenAI | null = null;
try {
  const apiKey = getEnv('OPENAI_API_KEY');
  if (apiKey) {
    openaiClient = new OpenAI({ apiKey });
  }
} catch (e) {
  logger.warn('LLMService', 'Failed to initialize OpenAI client.', e);
}

export interface GenerateTextOptions {
  provider?: 'openai' | 'gemini';
  model?: string;
  temperature?: number;
  maxTokens?: number;
  timeoutMs?: number;
  metering: LlmMeteringContext;
}

export type LlmMeteringContext =
  | {
      source: 'http';
      userId: string;
      route: string;
      action: string;
    }
  | {
      source: 'system';
      actor: string;
      action: string;
      budget: string;
      billable?: boolean;
      route?: string;
      userId?: string;
    };

export function createSystemLlmMetering(actor: string, action: string, budget = 'internal-ops'): LlmMeteringContext {
  return {
    source: 'system',
    actor,
    action,
    budget,
    billable: false,
  };
}

function getNonEmptyString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : '';
}

function resolveMeteringContext(metering: LlmMeteringContext | undefined): LlmMeteringContext {
  if (!metering) {
    throw new Error('LLM metering context is required');
  }

  const action = getNonEmptyString(metering.action);
  if (!action) {
    throw new Error('LLM metering action is required');
  }

  if (metering.source === 'http') {
    const userId = getNonEmptyString(metering.userId);
    const route = getNonEmptyString(metering.route);
    if (!userId) {
      throw new Error('HTTP LLM calls require an authenticated user id');
    }
    if (!route) {
      throw new Error('HTTP LLM calls require a route id');
    }

    return {
      source: 'http',
      userId,
      route,
      action,
    };
  }

  const actor = getNonEmptyString(metering.actor);
  const budget = getNonEmptyString(metering.budget);
  if (!actor) {
    throw new Error('System LLM calls require an actor id');
  }
  if (!budget) {
    throw new Error('System LLM calls require a budget id');
  }

  return {
    source: 'system',
    actor,
    action,
    budget,
    billable: metering.billable === true,
    route: getNonEmptyString(metering.route) || undefined,
    userId: getNonEmptyString(metering.userId) || undefined,
  };
}

function getMeteredUserId(metering: LlmMeteringContext) {
  if (metering.source === 'http') {
    return metering.userId;
  }

  return metering.billable === true ? metering.userId : undefined;
}

function createUsageMetadata(metering: LlmMeteringContext, promptLength: number) {
  return {
    action: metering.action,
    actor: metering.source === 'system' ? metering.actor : undefined,
    billable: metering.source === 'http' ? true : metering.billable === true,
    budget: metering.source === 'system' ? metering.budget : undefined,
    promptLength,
    route: metering.route,
    source: metering.source,
  };
}

export const llmService = {
  async generateText(prompt: string, options: GenerateTextOptions): Promise<{ text: string | null; error: any }> {
    const provider = options.provider || 'openai';
    const timeoutMs = options.timeoutMs || 30000;

    try {
      const metering = resolveMeteringContext(options.metering);
      const userId = getMeteredUserId(metering);
      const usageMetadata = createUsageMetadata(metering, prompt.length);

      // 1. Check daily limits first
      if (userId) {
        const quotaCheck = await billingApplicationService.enforceQuota(userId, {
          provider,
          model: options.model,
          maxDailyRequests: 50,
          metadata: usageMetadata,
        });
        if (!quotaCheck.allowed) throw new Error(quotaCheck.reason || 'Daily API limit reached');
      }

      logger.info('LLMService', `Generating text via ${provider}`, usageMetadata);

      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('LLM request timed out')), timeoutMs)
      );

      const requestPromise = provider === 'openai' 
        ? this._callOpenAI(prompt, options)
        : this._callGemini(prompt, options);

      const result = await Promise.race([requestPromise, timeoutPromise]) as any;

      // 2. Log usage (Token counting provided by OpenAI response)
      if (provider === 'openai' && result.usage) {
        await billingApplicationService.trackUsage(userId, {
          provider: 'openai',
          model: options.model || 'gpt-4o-mini',
          promptTokens: result.usage.prompt_tokens,
          completionTokens: result.usage.completion_tokens,
          costUsd: this._calculateOpenAICost(result.usage.prompt_tokens, result.usage.completion_tokens),
          metadata: {
            ...usageMetadata,
            task: prompt.substring(0, 50),
          }
        });
      }

      return { text: typeof result === 'string' ? result : result.content, error: null };
    } catch (error) {
      logger.error('LLMService', `Error in generateText (${provider})`, error);
      return { text: null, error: error instanceof Error ? error.message : String(error) };
    }
  },

  async _callOpenAI(prompt: string, options: GenerateTextOptions): Promise<any> {
    if (!isServerRuntime) throw new Error('OpenAI execution must remain server-side.');
    if (!openaiClient) throw new Error('OpenAI client is not initialized.');
    
    const response = await openaiClient.chat.completions.create({
      model: options.model || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens || 1000,
    });

    return {
      content: response.choices[0]?.message?.content || '',
      usage: response.usage
    };
  },

  async _callGemini(prompt: string, options: GenerateTextOptions): Promise<string> {
    if (!isServerRuntime) throw new Error('Gemini execution must remain server-side.');
    const apiKey = getEnv('GEMINI_API_KEY');
    if (!apiKey) throw new Error('GEMINI_API_KEY is missing.');

    const model = options.model || 'gemini-1.5-flash';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
           temperature: options.temperature ?? 0.7,
           maxOutputTokens: options.maxTokens || 1000
        }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  },

  _calculateOpenAICost(promptTokens: number, completionTokens: number): number {
    // Current gpt-4o-mini pricing: $0.150 / 1M input, $0.600 / 1M output
    const inputCost = (promptTokens / 1000000) * 0.15;
    const outputCost = (completionTokens / 1000000) * 0.60;
    return inputCost + outputCost;
  }
};
