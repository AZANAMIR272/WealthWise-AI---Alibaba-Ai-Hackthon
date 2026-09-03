import { createClient } from '@supabase/supabase-js';

/**
 * Server-side Supabase client.
 * Used for OAuth code exchange in the Google callback route.
 */
export function createServerSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}
