"use server";

/**
 * lib/actions/waitlist.ts — Tornu v2
 */

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendWaitlistNotificationEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";

export async function joinWaitlist(input: {
  slotId: string;
  professionalId: string;
  clientName: string;
  clientEmail: string;
}) {
  const supabase = await createClient();

  const { error } = await supabase.from("slot_waitlist").insert({
    slot_id: input.slotId,
    professional_id: input.professionalId,
    client_name: input.clientName.trim(),
    client_email: input.clientEmail.trim().toLowerCase(),
  });

  if (error) {
    if (error.code === "23505") return { ok: false, error: "Ya estás en lista de espera para ese horario." };
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function removeWaitlistEntry(waitlistId: string, professionalId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("slot_waitlist")
    .delete()
    .eq("id", waitlistId)
    .eq("professional_id", professionalId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/availability");
  return { ok: true };
}

/**
 * Notifica al primero en lista de espera cuando se libera un slot.
 * Se llama automáticamente al cancelar un turno.
 */
export async function notifyFirstWaitlistEntry(params: {
  slotId: string;
  slotStartTime: string;
  professionalSlug: string | null;
  professionalName: string;
  serviceName: string;
  serviceId: string | null;
}) {
  const supabase = createServiceClient();

  // Primer entry por orden de llegada, no notificado aún
  const { data: entry } = await supabase
    .from("slot_waitlist")
    .select("id, client_name, client_email")
    .eq("slot_id", params.slotId)
    .eq("notified", false)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!entry) return;

  const APP_URL =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const slug = params.professionalSlug;
  const serviceParam = params.serviceId ? `?service=${params.serviceId}` : "";
  const bookingUrl = slug
    ? `${APP_URL}/book/${slug}${serviceParam}`
    : `${APP_URL}`;

  try {
    await sendWaitlistNotificationEmail({
      clientName: entry.client_name,
      clientEmail: entry.client_email,
      professionalName: params.professionalName,
      serviceName: params.serviceName,
      slotStartTime: params.slotStartTime,
      bookingUrl,
    });

    await supabase.from("slot_waitlist").update({ notified: true }).eq("id", entry.id);
  } catch (e) {
    console.error("Error notifying waitlist entry:", e);
  }
}
