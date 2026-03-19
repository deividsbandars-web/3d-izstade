import { Request, Response } from 'express';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

export const getOverview = async (req: Request, res: Response) => {
  const { sponsorId } = req.query;

  try {
    const { data: analytics, error: aErr } = await supabase
      .from('booth_analytics')
      .select('*')
      .eq('sponsor_id', sponsorId);

    if (aErr) throw aErr;

    const { data: billing, error: bErr } = await supabase
      .from('sponsor_billing')
      .select('*')
      .eq('sponsor_id', sponsorId)
      .single();

    if (bErr && bErr.code !== 'PGRST116') throw bErr;

    const overview = {
      totalVisits: analytics.filter(e => e.event_type === 'ENTRY').length,
      totalClicks: analytics.filter(e => e.event_type === 'CLICK').length,
      totalDownloads: analytics.filter(e => e.event_type === 'DOWNLOAD').length,
      totalSpent: billing?.total_spent || 0,
      liveVisitors: Math.floor(Math.random() * 10) + 1, // Simulated live count (usually from Redis)
    };

    res.json(overview);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getAnalytics = async (req: Request, res: Response) => {
  const { sponsorId } = req.query;

  try {
    // Get time-series data (last 30 days)
    const { data, error } = await supabase
      .from('booth_analytics')
      .select('created_at, event_type')
      .eq('sponsor_id', sponsorId)
      .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;

    // Aggregate by day
    const chartData = aggregateByDay(data);
    res.json(chartData);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

export const getBillingDetails = async (req: Request, res: Response) => {
  const { sponsorId } = req.query;

  try {
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('sponsor_id', sponsorId)
      .single();

    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('sponsor_id', sponsorId)
      .order('created_at', { ascending: false });

    res.json({ subscription, payments });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};

const aggregateByDay = (data: any[]) => {
  const aggregated: any = {};
  data.forEach(entry => {
    const day = new Date(entry.created_at).toISOString().split('T')[0];
    if (!aggregated[day]) aggregated[day] = { date: day, visits: 0, interactions: 0 };
    if (entry.event_type === 'ENTRY') aggregated[day].visits++;
    else aggregated[day].interactions++;
  });
  return Object.values(aggregated).sort((a: any, b: any) => a.date.localeCompare(b.date));
};
