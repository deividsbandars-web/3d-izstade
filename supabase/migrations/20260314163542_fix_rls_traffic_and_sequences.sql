-- Iespējot RLS priekš traffic_analytics
ALTER TABLE public.traffic_analytics ENABLE ROW LEVEL SECURITY;

-- Noteikumi priekš traffic_analytics
-- Parasti analītiku var skatīt tikai autentificēti lietotāji (vai admini), bet ja nepieciešams vākt datus publiski:
CREATE POLICY "Enable insert for public" ON public.traffic_analytics
  FOR INSERT WITH CHECK (true);

-- Iespējot RLS priekš user_sequence_progress
ALTER TABLE public.user_sequence_progress ENABLE ROW LEVEL SECURITY;

-- Noteikumi priekš user_sequence_progress
-- Lietotāji var redzēt tikai progresu, kas piesaistīts viņu pašu līdiem
CREATE POLICY "Users can view their own sequence progress" ON public.user_sequence_progress
  FOR SELECT TO authenticated USING (
      EXISTS (SELECT 1 FROM public.leads WHERE leads.id = user_sequence_progress.lead_id AND leads.user_id = auth.uid())
  );

CREATE POLICY "Users can insert their own sequence progress" ON public.user_sequence_progress
  FOR INSERT TO authenticated WITH CHECK (
      EXISTS (SELECT 1 FROM public.leads WHERE leads.id = lead_id AND leads.user_id = auth.uid())
  );

CREATE POLICY "Users can update their own sequence progress" ON public.user_sequence_progress
  FOR UPDATE TO authenticated USING (
      EXISTS (SELECT 1 FROM public.leads WHERE leads.id = user_sequence_progress.lead_id AND leads.user_id = auth.uid())
  );

