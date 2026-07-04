import { createBrowserClient } from "@supabase/ssr";

// ponytail: placeholder hasta Fase 2 — el proyecto Supabase real no existe todavía.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
