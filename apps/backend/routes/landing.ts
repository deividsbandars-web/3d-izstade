import { Router, Request, Response } from 'express';
import { getSupabase } from '../services/supabase.js';
import { analyticsTracker } from '../../../src/backend/distribution/analyticsTracker.js';

export const landingRouter = Router();

/**
 * Public route to serve landing pages by their unique slug.
 */
landingRouter.get('/:slug', async (req: Request, res: Response) => {
  const { slug } = req.params;
  const source = (req.query.s as string) || 'direct';
  const campaign = (req.query.c as string) || 'default';

  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not configured");

    // 1. Fetch landing page data from Supabase
    const { data: page, error } = await supabase
      .from('landing_pages')
      .select('*, projects(title)')
      .eq('slug', slug)
      .single();

    if (error || !page) {
      return res.status(404).send('Landing page not found.');
    }

    // 2. Track the visit (async, non-blocking)
    analyticsTracker.trackVisit({
      landingPageId: page.id,
      source,
      campaign,
      userAgent: req.headers['user-agent']
    }).catch(err => console.error('Tracking failed:', err));

    // 3. Serve the dynamic HTML with SEO metadata
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${page.title}</title>
        <meta name="description" content="${page.seo_metadata?.description || ''}">
        <meta name="keywords" content="${(page.seo_metadata?.keywords || []).join(', ')}">
        <style>
          body { font-family: 'Inter', sans-serif; background: #020617; color: white; margin: 0; padding: 0; }
          .container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
          .hero { text-align: center; padding: 100px 0; background: radial-gradient(circle, #1e293b 0%, #020617 100%); }
          h1 { fontSize: 4rem; margin: 0; }
          .cta-form { background: rgba(255,255,255,0.05); padding: 40px; border-radius: 20px; margin-top: 50px; }
          input { padding: 15px; width: 300px; border-radius: 10px; border: 1px solid #334155; background: #0f172a; color: white; }
          button { padding: 15px 30px; border-radius: 10px; background: #3b82f6; color: white; border: none; cursor: pointer; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="hero">
          ${page.content_html}
        </div>
        <div class="container">
          <div class="cta-form" id="signup">
            <h2>Get Started Now</h2>
            <form action="/api/leads/capture" method="POST">
              <input type="hidden" name="page_id" value="${page.id}">
              <input type="email" name="email" placeholder="Your work email" required>
              <button type="submit">Join the Waiting List</button>
            </form>
          </div>
        </div>
      </body>
      </html>
    `;

    res.send(html);
  } catch (error) {
    console.error('Error serving landing page:', error);
    res.status(500).send('Internal server error.');
  }
});
