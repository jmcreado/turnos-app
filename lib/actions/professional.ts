"use server";

import { createClient } from "@/lib/supabase/server";
import { generateSlug } from "@/lib/utils/slug";
import { revalidatePath } from "next/cache";

type CreateProfileInput = {
  name: string;
  service_name: string;
  session_duration_minutes: number;
  session_price: number;
  requires_payment: boolean;
};

type UpdateProfileInput = Partial<CreateProfileInput>;

/**
 * Crea el perfil del profesional (primera vez). Requiere sesión.
 */
export async function createProfessionalProfile(
  input: CreateProfileInput,
  userEmail: string,
  userId: string
) {
  const supabase = await createClient();

  const slug = generateSlug(input.name);

  const { data, error } = await supabase
    .from("professionals")
    .insert({
      user_id: userId,
      name: input.name.trim(),
      email: userEmail,
      service_name: input.service_name.trim() || null,
      slug,
      session_duration_minutes: Math.max(15, Math.min(120, input.session_duration_minutes)),
      session_price: Math.max(0, input.session_price),
      requires_payment: input.requires_payment,
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { ok: true, id: data.id };
}

/**
 * Actualiza el perfil del profesional.
 */
export async function updateProfessionalProfile(
  professionalId: string,
  input: UpdateProfileInput
) {
  const supabase = await createClient();

  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name.trim();
  if (input.service_name !== undefined) payload.service_name = input.service_name.trim() || null;
  if (input.session_duration_minutes !== undefined) {
    payload.session_duration_minutes = Math.max(15, Math.min(120, input.session_duration_minutes));
  }
  if (input.session_price !== undefined) {
    payload.session_price = Math.max(0, input.session_price);
  }
  if (input.requires_payment !== undefined) payload.requires_payment = input.requires_payment;

  const { error } = await supabase
    .from("professionals")
    .update(payload)
    .eq("id", professionalId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}
