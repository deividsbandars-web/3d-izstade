import { supabase } from '../core/supabase.js';

// ==========================================
// CRM & PROJECTS (warpala_os_schema)
// ==========================================

export async function fetchClients() {
  const { data, error } = await supabase
    .from('clients')
    .select(`
      *,
      projects (
        id, title, status,
        quotes (total_price),
        invoices (amount, status)
      )
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function fetchProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select(`
      *,
      clients (name),
      project_tasks (*),
      project_materials (*)
    `)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  return data;
}

export async function createClient(client: { name: string; email?: string; phone?: string; company_id: string }) {
  const { data, error } = await supabase
    .from('clients')
    .insert([client])
    .select()
    .single();
  
  if (error) throw error;
  return data;
}
