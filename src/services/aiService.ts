const IS_LIVE_AI = false;

interface AiVideoResult {
  success: boolean;
  videoUrl: string | null;
  thumbnail?: string | null;
}

interface AiApiRequest {
  prompt?: string;
  description?: string;
  context?: string;
  style?: string;
}

async function postAiApi<T>(path: string, payload: AiApiRequest): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`AI_API_HTTP_${response.status}`);
  }

  return await response.json() as T;
}

export async function aiEstimate(description: string) {
  return await postAiApi('/api/ai-estimate', { description });
}

export async function generateAiResponse(prompt: string, context?: string) {
  console.log(`AI Request [Live API: ${IS_LIVE_AI}] -> ${prompt.substring(0, 50)}...`);

  if (!IS_LIVE_AI) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return getSimulatedResponse(prompt);
  }

  try {
    const result = await postAiApi<{ text?: string | null; response?: string | null }>('/api/ai/respond', {
      prompt,
      context,
    });

    return result.text || result.response || 'AI neģenerēja atbildi.';
  } catch (error) {
    console.error('AI API Error (fallback to simulation):', error);
    return `${getSimulatedResponse(prompt)} (Fallback Mode)`;
  }
}

function getSimulatedResponse(prompt: string): string {
  const lowerPrompt = prompt.toLowerCase();
  if (lowerPrompt.includes('video')) return 'Simulēts video scenārijs: dinamiskas gaismas un neona elementi.';
  if (lowerPrompt.includes('aprēķin')) return 'Simulēta tāme: materiāli 400 EUR, darbs 600 EUR. Kopā: 1000 EUR.';
  return 'Šī ir simulēta atbilde. Lai lietotu reālu AI, frontendam jāizmanto server-side API ceļš, nevis browser key izpilde.';
}

export async function generateAiVideo(prompt: string, style: string): Promise<AiVideoResult> {
  if (IS_LIVE_AI) {
    try {
      const result = await postAiApi<{ success: boolean; videoUrl?: string | null; thumbnail?: string | null }>('/api/ai/video', {
        prompt,
        style,
      });
      return {
        success: result.success,
        videoUrl: result.videoUrl ?? null,
        thumbnail: result.thumbnail ?? null,
      };
    } catch (error) {
      console.error('AI video API error (fallback to simulation):', error);
    }
  }

  await new Promise((resolve) => setTimeout(resolve, 3000));
  return {
    success: true,
    videoUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_1MB.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=400&q=80'
  };
}
