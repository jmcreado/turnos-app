/**
 * lib/supabase/admin.ts
 * Cliente con service role para operaciones que requieren bypass de RLS.
 * ⚠️ Solo usar en server actions / server components. Nunca en el cliente.
 */
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY env var");
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
