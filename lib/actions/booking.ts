"use server";

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { sendConfirmationEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";

type CreateBookingInput = {
  slotId: string;
  professionalId: string;
  serviceId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
};

export async function createBooking(input: CreateBookingInput) {
  const supabase = await createClient();

  const { data: service } = await supabase
    .from("services")
    .select("requires_payment, name")
    .eq("id", input.serviceId)
    .single();

  if (!service) return { ok: false, error: "Servicio no encontrado." };

  const { data: professional } = await supabase
    .from("professionals")
    .select("name")
    .eq("id", input.professionalId)
    .single();

  const { data: slot } = await supabase
    .from("availability_slots")
    .select("start_time")
    .eq("id", input.slotId)
    .single();

  const status = service.requires_payment ? "PENDING" : "CONFIRMED";
  const expiresAt = service.requires_payment
    ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      professional_id: input.professionalId,
      service_id: input.serviceId,
      slot_id: input.slotId,
      client_name: input.clientName.trim(),
      client_email: input.clientEmail.trim(),
      client_phone: input.clientPhone.trim() || null,
      status,
      expires_at: expiresAt,
    })
    .select("id, status, management_token")
    .single();

  if (error) return { ok: false, error: error.message };

  const managementToken: string | null = data.management_token ?? null;

  if (slot?.start_time && managementToken) {
    try {
      await sendConfirmationEmail({
        clientName: input.clientName.trim(),
        clientEmail: input.clientEmail.trim(),
        professionalName: professional?.name ?? "Tu profesional",
        serviceName: service.name,
        slotStartTime: slot.start_time,
        managementToken,
      });
    } catch (e) {
      console.error("Error enviando email de confirmación:", e);
    }
  }

  revalidatePath("/dashboard");
  return {
    ok: true,
    bookingId: data.id,
    status: data.status as "CONFIRMED" | "PENDING",
    managementToken,
  };
}

/**
 * Cancela un turno desde el dashboard del profesional.
 */
export async function cancelBookingByProfessional(
  bookingId: string,
  _professionalId?: string
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("bookings")
    .update({ status: "CANCELLED" })
    .eq("id", bookingId);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/availability");
  return { ok: true };
}

/**
 * Cancela un turno desde la página del cliente usando management_token.
 */
export async function cancelBookingByToken(token: string) {
  const supabase = createServiceClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, status, availability_slots(start_time)")
    .eq("management_token", token)
    .maybeSingle();

  if (!booking) return { ok: false, error: "Turno no encontrado." };
  if (booking.status === "CANCELLED") return { ok: false, error: "El turno ya estaba cancelado." };

  const slotArr = booking.availability_slots as unknown as Array<{ start_time: string }>;
  const startTime = slotArr?.[0]?.start_time;
  if (startTime && new Date(startTime) < new Date()) {
    return { ok: false, error: "No podés cancelar un turno que ya ocurrió." };
  }

  const { error } = await supabase
    .from("bookings")
    .update({ status: "CANCELLED" })
    .eq("id", booking.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Reprograma un turno usando management_token.
 */
export async function rescheduleBookingByToken(token: string, newSlotId: string) {
  const supabase = createServiceClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, status, availability_slots(start_time)")
    .eq("management_token", token)
    .maybeSingle();

  if (!booking) return { ok: false, error: "Turno no encontrado." };
  if (booking.status === "CANCELLED") return { ok: false, error: "El turno está cancelado." };

  const slotArr = booking.availability_slots as unknown as Array<{ start_time: string }>;
  const startTime = slotArr?.[0]?.start_time;
  if (startTime && new Date(startTime) < new Date()) {
    return { ok: false, error: "No podés reprogramar un turno que ya ocurrió." };
  }

  const { error } = await supabase
    .from("bookings")
    .update({ slot_id: newSlotId })
    .eq("id", booking.id);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
