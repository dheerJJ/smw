import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseUrl !== "https://your-project.supabase.co" &&
  supabaseAnonKey &&
  supabaseAnonKey !== "your-anon-key"
);

/**
 * Browser Supabase client for client-side components
 */
export function createBrowserClientInstance() {
  if (!isSupabaseConfigured) {
    return null;
  }
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

/**
 * Service-role Supabase client (Server/Cron/Webhook only)
 * Bypasses RLS for automated cron execution and webhook callbacks
 */
export function createAdminSupabaseClient() {
  if (!isSupabaseConfigured || !supabaseServiceRoleKey) {
    return null;
  }
  return createSupabaseClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
