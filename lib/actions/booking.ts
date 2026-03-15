"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type CreateBookingInput = {
  slotId: string;
  professionalId: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
};

/**
 * Crea una reserva. Si el profesional no requiere pago → CONFIRMED; si no → PENDING.
 */
export async function createBooking(input: CreateBookingInput) {
  const supabase = await createClient();

  const { data: professional } = await supabase
    .from("professionals")
    .select("requires_payment")
    .eq("id", input.professionalId)
    .single();

  if (!professional) {
    return { ok: false, error: "Profesional no encontrado." };
  }

  const status = professional.requires_payment ? "PENDING" : "CONFIRMED";
  const expiresAt = professional.requires_payment
    ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      professional_id: input.professionalId,
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
