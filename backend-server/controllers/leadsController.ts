import { Request, Response } from 'express';
import { leadEngine } from '../../src/backend/leads/engine/leadEngine.js';
import { getSupabase } from '../services/supabase.js';
import { analytics, errorMonitor } from '../observability/monitor.js';
import { AuthRequest } from '../middleware/authMiddleware.js';

export const getLeads = async (req: AuthRequest, res: Response) => {
  try {
    const supabase = getSupabase();
    if (!supabase) throw new Error("Supabase not configured");

    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', req.user?.id) // Strictly filtered by user
      .order('created_at', { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    errorMonitor.captureException(error, 'getLeads');
    res.status(500).json({ error: error.message });
  }
};

export const generateLeads = async (req: AuthRequest, res: Response) => {
  const { industry, location } = req.body;
  const userId = req.user?.id;
  
  if (!industry || !location) {
    return res.status(400).json({ error: 'Industry and location are required' });
  }

  try {
    // 1. Track the start of generation
    analytics.capture({
      userId,
      event: 'lead_generation_started',
      properties: { industry, location }
    });

    // 2. Call lead engine
    const result = await leadEngine.processAndStoreLeads(industry, location, userId);

    // 3. Track success
    analytics.capture({
      userId,
      event: 'lead_generation_completed',
      properties: { 
        industry, 
        location, 
        count: result.data?.length || 0 
      }
    });

    res.json(result);
  } catch (error: any) {
    errorMonitor.captureException(error, 'generateLeads');
    res.status(500).json({ error: error.message });
  }
};

export const captureLead = async (req: Request, res: Response) => {
  const { email, page_id } = req.body;

  if (!email || !page_id) {
    return res.status(400).send('Email and Page ID are required.');
  }

  try {
    const { leadCapture } = await import('../../src/backend/growth/leadCapture.js');
    const result = await leadCapture.captureLead(email, page_id, {
      ip: req.ip,
      referrer: req.headers.referer
    });

    if (result.error) throw new Error(result.error);

    // Redirect to a thank you page or back to the landing page with success
    res.send('<h1>Success!</h1><p>You have been added to the list.</p>');
  } catch (error: any) {
    console.error('Lead Capture Error:', error);
    res.status(500).send('An error occurred. Please try again later.');
  }
};
