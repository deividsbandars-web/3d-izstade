import { GrowthAPI } from '../services/growth.js';

export async function runSeoTask() {
  const topics = [
    "roof replacement cost germany",
    "bathroom renovation cost europe",
    "heating installation price"
  ];

  for (const topic of topics) {
    console.log(`[SEO Agent] Working on: ${topic}`);
    await GrowthAPI.generateKeywordClusters({ topic });
    
    // Šeit tiktu izsaukts serviss, kas izveido lapu un publicē to tavā CMS vai DB
    console.log(`[SEO Agent] Keyword cluster generated for ${topic}.`);
  }
}
