import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables"
  );
}

/**
 * Supabase admin client using the service role key.
 * Use this for server-side operations that bypass RLS.
 */
export const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * The public anon key, used when creating per-request clients
 * scoped to a specific user's JWT.
 */
export const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? "";
