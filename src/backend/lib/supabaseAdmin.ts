import { createClient } from '@supabase/supabase-js';

let cachedAdminClient: any = null;

function resolveRequiredEnv(key: string) {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`BACKEND_ENV_MISSING:${key}`);
  }

  return value;
}

export function getSupabaseAdminClient() {
  if (!cachedAdminClient) {
    cachedAdminClient = createClient(
      resolveRequiredEnv('SUPABASE_URL'),
      process.env.SUPABASE_SERVICE_KEY?.trim() || resolveRequiredEnv('SUPABASE_SERVICE_ROLE_KEY'),
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );
  }

  return cachedAdminClient;
}
