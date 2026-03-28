import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getBackendRuntimeEnv } from '../config/runtimeEnv.js';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (supabaseInstance) {
    return supabaseInstance;
  }

  const backendRuntimeEnv = getBackendRuntimeEnv();
  supabaseInstance = createClient(backendRuntimeEnv.supabaseUrl, backendRuntimeEnv.supabaseServiceKey);
  return supabaseInstance;
}
