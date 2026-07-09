import { createClient } from "@supabase/supabase-js";

/**
 * Cliente con service role — solo para rutas de servidor sin auth de usuario.
 * No usar en componentes del lado del cliente.
 */
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}
