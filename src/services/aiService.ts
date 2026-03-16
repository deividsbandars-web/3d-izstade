import OpenAI from 'openai';

// DROŠĪBAS SLĒDZIS: Maini uz 'true', lai tērētu tokenus un lietotu reālu AI.
// Pārliecinies, ka .env failā ir VITE_OPENAI_API_KEY
const IS_LIVE_AI = false; 

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true
});

export async function aiEstimate(description: string) {
  const response = await fetch("/api/ai-estimate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ description })
  });
  return await response.json();
}

/**
 * Galvenā AI funkcija ar integrētu drošības režīmu.
 */
export async function generateAiResponse(prompt: string, context?: string) {
  console.log(`AI Request [Live: ${IS_LIVE_AI}] -> ${prompt.substring(0, 50)}...`);

  // 1. Ja Live režīms ir izslēgts vai nav atslēgas, lietojam simulāciju
  if (!IS_LIVE_AI || !import.meta.env.VITE_OPENAI_API_KEY) {
    await new Promise(r => setTimeout(r, 1500));
    return getSimulatedResponse(prompt);
  }

  // 2. Ja Live režīms ir ieslēgts, saucam OpenAI
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Lētākais un ātrākais modelis testēšanai
      messages: [
        { role: "system", content: "Tu esi Warpala AI asistents. Atbildi īsi un profesionāli latviešu valodā." },
        { role: "user", content: `${prompt}${context ? `\n\nContext: ${context}` : ''}` }
      ],
      max_tokens: 500, // Ierobežojam garumu, lai taupītu naudu
      temperature: 0.7
    });

    return response.choices[0].message.content || "AI neģenerēja atbildi.";
  } catch (error) {
    console.error("AI API Error (Pārslēdzos uz simulāciju):", error);
    return getSimulatedResponse(prompt) + " (Fallback Mode)";
  }
}

/**
 * Iepriekš definētas atbildes bezmaksas testēšanai.
 */
function getSimulatedResponse(prompt: string): string {
  const p = prompt.toLowerCase();
  if (p.includes('video')) return "Simulēts video scenārijs: Dinamiskas gaismas un neona elementi.";
  if (p.includes('aprēķin')) return "Simulēta tāme: Materiāli 400€, Darbs 600€. Kopā: 1000€.";
  return "Šī ir simulēta atbilde. Lai redzētu reālu AI, failā aiService.ts iestati IS_LIVE_AI = true.";
}

export async function generateAiVideo(_prompt: string, _style: string) {
  await new Promise(r => setTimeout(r, 3000));
  return {
    success: true,
    videoUrl: 'https://test-videos.co.uk/vids/bigbuckbunny/mp4/h264/1080/Big_Buck_Bunny_1080_10s_1MB.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=400&q=80'
  };
}
