import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Faltan variables de entorno: NEXT_PUBLIC_SUPABASE_URL y/o NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

/**
 * Cliente de Supabase para uso en el cliente (browser).
 * Usa la anon key; las políticas RLS definen el acceso.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
