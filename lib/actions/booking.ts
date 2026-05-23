"use server";

import { createClient } from "@/lib/supabase/server";
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

  // Obtener configuración del servicio seleccionado
  const { data: service } = await supabase
    .from("services")
    .select("requires_payment")
    .eq("id", input.serviceId)
    .single();

  if (!service) {
    return { ok: false, error: "Servicio no encontrado." };
  }

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
    .select("id, status")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard");
  return {
    ok: true,
    bookingId: data.id,
    status: data.status as "CONFIRMED" | "PENDING",
  };
}