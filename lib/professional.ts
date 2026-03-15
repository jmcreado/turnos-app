import { createClient } from "@/lib/supabase/server";
import type { Professional } from "@/types/database";

export type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * Obtiene el profesional del usuario actual (por email o user_id).
 */
export async function getProfessionalForUser(
  supabase: SupabaseClient,
  userId: string,
  userEmail: string
): Promise<Professional | null> {
  const { data: byEmail } = await supabase
    .from("professionals")
    .select("*")
    .eq("email", userEmail)
    .maybeSingle();

  if (byEmail) return byEmail as Professional;

  const { data: byUser } = await supabase
    .from("professionals")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  return byUser as Professional | null;
}

/**
 * Obtiene un profesional por slug (para la página pública de reservas).
 */
export async function getProfessionalBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<Professional | null> {
  const { data } = await supabase
    .from("professionals")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  return data as Professional | null;
}

/**
 * Fallback: obtener por id si la tabla no tiene slug.
 */
export async function getProfessionalById(
  supabase: SupabaseClient,
  id: string
): Promise<Professional | null> {
  const { data } = await supabase
    .from("professionals")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  return data as Professional | null;
}
