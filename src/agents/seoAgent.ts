import { runAgent } from './baseAgent.js';

export async function runSeoTask() {
  const topics = [
    "roof replacement cost germany",
    "bathroom renovation cost europe",
    "heating installation price"
  ];

  for (const topic of topics) {
    console.log(`[SEO Agent] Working on: ${topic}`);
    await runAgent(`
      Generate an SEO-optimized article about ${topic}. 
      Include a table of costs, FAQs and a guide. 
      Format: Markdown. 
      Tone: Professional.
    `);
    
    // Šeit tiktu izsaukts serviss, kas izveido lapu un publicē to tavā CMS vai DB
    console.log(`[SEO Agent] Article generated for ${topic}. Ready to publish.`);
  }
}
