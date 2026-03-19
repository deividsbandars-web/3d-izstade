import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export const trackAnalytics = async (req: Request, res: Response) => {
  const { userId, payload } = req.body;
  const { type, sponsorId } = payload;

  console.log(`[Analytics] Action: ${type} by User: ${userId} for Sponsor: ${sponsorId}`);

  try {
    if (type === 'BOOTH_ENTER') {
      const { error } = await supabase.rpc('handle_booth_entry', { 
        s_id: sponsorId, 
        u_id: userId 
      });
      if (error) throw error;
    } else {
      // Citi notikumi (Click, Download)
      const { error } = await supabase
        .from('booth_analytics')
        .insert({
          user_id: userId,
          sponsor_id: sponsorId,
          event_type: type
        });
      if (error) throw error;
    }

    res.status(200).json({ success: true });
  } catch (error: any) {
    console.error('[Analytics Error]', error.message);
    res.status(500).json({ error: error.message });
  }
};
