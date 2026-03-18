import { createClient } from '@supabase/supabase-js';
// Helper to get environment variables in both Vite and Node.js environments
const getEnv = (name) => {
    if (typeof process !== 'undefined' && process.env && process.env[name]) {
        return process.env[name];
    }
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[`VITE_${name}`]) {
        return import.meta.env[`VITE_${name}`];
    }
    return '';
};
const supabaseUrl = getEnv('SUPABASE_URL');
const supabaseAnonKey = getEnv('SUPABASE_ANON_KEY');
// Create a safe, reusable client instance
const createSafeClient = () => {
    try {
        if (!supabaseUrl || !supabaseAnonKey) {
            // ignore in dev
            // console.warn('⚠️ SUPABASE CLIENT WARNING: Missing SUPABASE_URL or SUPABASE_ANON_KEY.');
            // Fallback for development/UI work without throwing fatal application errors
            return createClient('https://dummy-fallback.supabase.co', 'dummy-key');
        }
        return createClient(supabaseUrl, supabaseAnonKey, {
            auth: {
                persistSession: true,
                autoRefreshToken: true,
            }
        });
    }
    catch (error) {
        console.error('❌ FATAL: Failed to initialize Supabase client:', error);
        return createClient('https://dummy-fallback.supabase.co', 'dummy-key');
    }
};
export const supabaseClient = createSafeClient();
export const handleSupabaseError = (error, context) => {
    console.error(`[Supabase Error - ${context}]:`, error?.message || error);
    return { data: null, error: error?.message || 'Unknown database error' };
};
