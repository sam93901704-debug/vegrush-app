import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Get Supabase URL from environment variables
 * Throws error if not configured
 */
function getSupabaseUrl(): string {
  const url = process.env.SUPABASE_URL;
  if (!url) {
    throw new Error('SUPABASE_URL environment variable is not configured');
  }
  return url;
}

/**
 * Get Supabase service role key from environment variables
 * Throws error if not configured
 * Note: Service role key has admin privileges - never expose to client
 */
function getSupabaseServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not configured');
  }
  return key;
}

/**
 * Get storage bucket name from environment variables
 * Defaults to 'product-images' if not set
 */
function getStorageBucket(): string {
  return process.env.SUPABASE_BUCKET || 'product-images';
}

/**
 * Initialize Supabase client with service role key
 * Service role key bypasses RLS policies - use only on backend
 */
let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClient) {
    console.log(">>> RUNTIME SUPABASE_URL =", JSON.stringify(process.env.SUPABASE_URL));
console.log(">>> RUNTIME SERVICE_ROLE_KEY EXISTS =", !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log(">>> RUNTIME BUCKET =", process.env.SUPABASE_BUCKET);

    const url = getSupabaseUrl();
    const key = getSupabaseServiceRoleKey();
    supabaseClient = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseClient;
}

/**
 * Get storage bucket name
 */
export function getStorageBucketName(): string {
  return getStorageBucket();
}

/**
 * Validate Supabase configuration on startup
 */
export function validateSupabaseConfig(): void {
  try {
    getSupabaseUrl();
    getSupabaseServiceRoleKey();
    getStorageBucket();
  } catch (error) {
    console.error('❌ Supabase configuration error:', error instanceof Error ? error.message : 'Unknown error');
    throw error;
  }
}

