import { createClient } from '@supabase/supabase-js';
import { getFrontendRuntimeEnv } from '../config/runtimeEnv';

const frontendRuntimeEnv = getFrontendRuntimeEnv();

export const supabaseUrl = frontendRuntimeEnv.supabaseUrl;
export const supabaseAnonKey = frontendRuntimeEnv.supabaseAnonKey;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
