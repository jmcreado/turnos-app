"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
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

/**
 * Borra la cuenta del profesional en forma DEFINITIVA e irreversible:
 * services, availability_slots, bookings, slot_waitlist, el professional
 * y el usuario de auth. Verifica ownership contra la sesión actual antes
 * de tocar nada (usa admin client, que bypassea RLS).
 */
export async function hardDeleteAccount(professionalId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "No autenticado" };

  const { data: professional, error: fetchError } = await supabase
    .from("professionals")
    .select("id, user_id, email")
    .eq("id", professionalId)
    .maybeSingle();

  if (fetchError || !professional) {
    return { ok: false, error: "No se encontró la cuenta" };
  }
  const isOwner = professional.user_id === user.id || professional.email === user.email;
  if (!isOwner) {
    return { ok: false, error: "No autorizado" };
  }

  const admin = createAdminClient();

  // Orden explícito de borrado (no confiamos únicamente en cascadas de FK)
  const { error: waitlistError } = await admin.from("slot_waitlist").delete().eq("professional_id", professionalId);
  if (waitlistError) return { ok: false, error: `Falló borrar waitlist: ${waitlistError.message}` };

  const { error: bookingsError } = await admin.from("bookings").delete().eq("professional_id", professionalId);
  if (bookingsError) return { ok: false, error: `Falló borrar turnos: ${bookingsError.message}` };

  const { error: slotsError } = await admin.from("availability_slots").delete().eq("professional_id", professionalId);
  if (slotsError) return { ok: false, error: `Falló borrar disponibilidad: ${slotsError.message}` };

  const { error: servicesError } = await admin.from("services").delete().eq("professional_id", professionalId);
  if (servicesError) return { ok: false, error: `Falló borrar servicios: ${servicesError.message}` };

  const { error: profError } = await admin.from("professionals").delete().eq("id", professionalId);
  if (profError) return { ok: false, error: `Falló borrar el perfil: ${profError.message}` };

  const { error: authError } = await admin.auth.admin.deleteUser(user.id);
  if (authError) {
    return { ok: false, error: `Se borraron tus datos pero falló borrar el usuario de login: ${authError.message}` };
  }

  return { ok: true };
}
