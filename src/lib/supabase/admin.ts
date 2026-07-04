import { createClient } from "@supabase/supabase-js";

/** Client con service role — SOLO en servidor (actions/route handlers). Salta RLS. */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
