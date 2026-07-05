import { runAgent } from './baseAgent.js';

export async function generateKeywords() {
  const prompt = `
    Generate a list of 50 long tail keywords for SEO about:
    construction, renovation, home services, cost calculators.
    Format as a simple JSON array of strings.
  `;
  const response = await runAgent(prompt);
  try {
    return JSON.parse(response || '[]');
  } catch {
    return ["roof replacement cost germany", "bathroom renovation cost europe", "heating installation price"];
  }
}
