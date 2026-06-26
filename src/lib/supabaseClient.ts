import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getFrontendRuntimeEnv } from '../config/runtimeEnv';

type SupabaseEnv = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

function resolveNodeSupabaseEnv(): SupabaseEnv | null {
  if (typeof process === 'undefined' || !process.env) {
    return null;
  }

  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
  };
}

function getBrowserSupabaseEnv(): SupabaseEnv | { error: string } | null {
  if (!(typeof globalThis === 'object' && 'window' in globalThis)) {
    return null;
  }

  try {
    const runtimeEnv = getFrontendRuntimeEnv();
    return {
      supabaseUrl: runtimeEnv.supabaseUrl,
      supabaseAnonKey: runtimeEnv.supabaseAnonKey,
    };
  } catch (error: any) {
    const message = String(error?.message || error || '');
    if (message.startsWith('FRONTEND_SUPABASE_ENV_MISSING:')) {
      return { error: 'Supabase auth is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY for this environment.' };
    }

    throw error;
  }
}

function createMissingSupabaseClient(errorMessage: string): SupabaseClient {
  const missingClient = new Proxy({}, {
    get() {
      throw new Error(errorMessage);
    },
  });

  return missingClient as SupabaseClient;
}

let supabaseAuthConfigError: string | null = null;
let supabaseClient: SupabaseClient;

const browserSupabaseEnv = getBrowserSupabaseEnv();

if (browserSupabaseEnv) {
  if ('error' in browserSupabaseEnv) {
    supabaseAuthConfigError = browserSupabaseEnv.error;
    supabaseClient = createMissingSupabaseClient(supabaseAuthConfigError);
  } else {
    supabaseClient = createClient(browserSupabaseEnv.supabaseUrl, browserSupabaseEnv.supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    });
  }
} else {
  const nodeSupabaseEnv = resolveNodeSupabaseEnv();

  if (!nodeSupabaseEnv) {
    supabaseAuthConfigError = 'Supabase auth is not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY for this environment.';
    supabaseClient = createMissingSupabaseClient(supabaseAuthConfigError);
  } else {
    supabaseClient = createClient(nodeSupabaseEnv.supabaseUrl, nodeSupabaseEnv.supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    });
  }
}

export { supabaseAuthConfigError, supabaseClient };

export const handleSupabaseError = (error: any, context: string) => {
  console.error(`[Supabase Error - ${context}]:`, error?.message || error);
  return { data: null, error: error?.message || 'Unknown database error' };
};
