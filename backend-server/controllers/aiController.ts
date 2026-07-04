import { Response } from 'express';
import { llmService } from '../../src/backend/ai/llmService.js';
import { createHttpLlmMetering, sendHttpLlmMeteringError } from '../lib/httpLlmMetering.js';
import type { AuthRequest } from '../middleware/authMiddleware.js';

function getString(value: unknown) {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : '';
}

export const estimateWithAi = async (req: AuthRequest, res: Response) => {
  try {
    const description = getString(req.body?.description);
    if (!description) {
      return res.status(400).json({ error: 'description is required' });
    }

    const prompt = `You are a commercial solutions estimator. Analyze the following request and return a concise estimate summary with likely scope, rough effort, and key cost drivers.\n\nRequest: ${description}`;
    const { text, error } = await llmService.generateText(prompt, {
      metering: createHttpLlmMetering(req, '/api/ai-estimate', 'ai-estimate'),
      temperature: 0.3,
    });

    if (error) {
      return res.status(502).json({ error: String(error) });
    }

    return res.json({ text, description });
  } catch (error) {
    const handled = sendHttpLlmMeteringError(res, error);
    if (handled) {
      return handled;
    }

    throw error;
  }
};

export const respondWithAi = async (req: AuthRequest, res: Response) => {
  try {
    const prompt = getString(req.body?.prompt);
    const context = getString(req.body?.context);
    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' });
    }

    const composedPrompt = context
      ? `Context:\n${context}\n\nUser prompt:\n${prompt}`
      : prompt;

    const { text, error } = await llmService.generateText(composedPrompt, {
      metering: createHttpLlmMetering(req, '/api/ai/respond', 'ai-respond'),
      temperature: 0.6,
    });
    if (error) {
      return res.status(502).json({ error: String(error) });
    }

    return res.json({ text });
  } catch (error) {
    const handled = sendHttpLlmMeteringError(res, error);
    if (handled) {
      return handled;
    }

    throw error;
  }
};

export const generateAiVideo = async (req: AuthRequest, res: Response) => {
  try {
    const prompt = getString(req.body?.prompt);
    const style = getString(req.body?.style);
    if (!prompt) {
      return res.status(400).json({ error: 'prompt is required' });
    }

    const { text, error } = await llmService.generateText(
      `Create a short cinematic video treatment for the following concept. Return a concise scene description and a thumbnail idea.\n\nStyle: ${style || 'default'}\nPrompt: ${prompt}`,
      {
        metering: createHttpLlmMetering(req, '/api/ai/video', 'ai-video-treatment'),
        temperature: 0.7,
      },
    );

    if (error) {
      return res.status(502).json({ error: String(error) });
    }

    return res.json({
      success: true,
      videoUrl: null,
      thumbnail: null,
      treatment: text,
    });
  } catch (error) {
    const handled = sendHttpLlmMeteringError(res, error);
    if (handled) {
      return handled;
    }

    throw error;
  }
};
