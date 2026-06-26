import { runAgent } from './baseAgent.js';
import { supabase } from '../core/supabase.js';

export async function generateArticle(keyword: string) {
  const prompt = `
    Write a 1500 word SEO optimized article about: ${keyword}.
    
    Include these sections:
    1. Title & Intro
    2. Detailed Cost Breakdown (Table)
    3. Materials needed
    4. Labour cost analysis
    5. Price examples by country/city
    6. FAQ
    7. CTA: "Try our ${keyword.includes('roof') ? 'Roof' : 'Renovation'} cost calculator"
    
    Format: Markdown. Tone: Professional and Authoritative.
  `;
  return await runAgent(prompt);
}

export function createPage(article: string, keyword: string) {
  return {
    slug: keyword.toLowerCase().replaceAll(" ", "-"),
    title: keyword.charAt(0).toUpperCase() + keyword.slice(1),
    content: article,
    status: 'published',
    created_at: new Date().toISOString()
  };
}

export async function publish(page: any) {
  const { error } = await supabase.from("seo_pages").insert(page);
  if (error) console.error("Publishing error:", error);
}

export async function runSeoMachine() {
  console.log("Starting SEO Machine...");
  const keywords = await import('./keywordAgent.js').then(m => m.generateKeywords());
  
  for (const keyword of keywords) {
    console.log(`Generating article for: ${keyword}`);
    const article = await generateArticle(keyword);
    if (article) {
      const page = createPage(article, keyword);
      await publish(page);
      console.log(`Successfully published: ${page.slug}`);
    } else {
      console.error(`Failed to generate article for: ${keyword}`);
    }
  }
}
