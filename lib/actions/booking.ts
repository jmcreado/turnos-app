"use server";

/**
 * lib/actions/booking.ts — Tornu v2
 */

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

// ─── Crear turno (cliente) ────────────────────────────────────────────────────

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
    .select("requires_payment")
    .eq("id", input.serviceId)
    .single();

  if (!service) return { ok: false, error: "Servicio no encontrado." };

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

  revalidatePath("/dashboard");
  return {
    ok: true,
    bookingId: data.id,
    managementToken: data.management_token as string,
    status: data.status as "CONFIRMED" | "PENDING",
  };
}

// ─── Cancelar turno (profesional) ────────────────────────────────────────────

export async function cancelBookingByProfessional(
  bookingId: string,
  professionalId: string
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("bookings")
    .update({ status: "CANCELLED" })
    .eq("id", bookingId)
    .eq("professional_id", professionalId)
    .in("status", ["CONFIRMED", "PENDING"]);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/availability");
  revalidatePath("/dashboard");
  return { ok: true };
}

// ─── Gestión por token (cliente via magic link) ───────────────────────────────

export async function getBookingByToken(token: string) {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("bookings")
    .select(
      `id, professional_id, slot_id, service_id, client_name, client_email,
       client_phone, status, expires_at, management_token, created_at,
       availability_slots(start_time, end_time),
       services(name, price, duration_minutes),
       professionals(name, slug)`
    )
    .eq("management_token", token)
    .maybeSingle();

  if (error || !data) return null;

  const raw = data as any;
  return {
    id: raw.id as string,
    professional_id: raw.professional_id as string,
    slot_id: raw.slot_id as string,
    service_id: raw.service_id as string | null,
    client_name: raw.client_name as string,
    client_email: raw.client_email as string,
    client_phone: raw.client_phone as string | null,
    status: raw.status as "CONFIRMED" | "PENDING" | "CANCELLED",
    expires_at: raw.expires_at as string | null,
    management_token: raw.management_token as string,
    created_at: raw.created_at as string,
    slot: Array.isArray(raw.availability_slots)
      ? (raw.availability_slots[0] ?? null)
      : (raw.availability_slots ?? null),
    service: Array.isArray(raw.services)
      ? (raw.services[0] ?? null)
      : (raw.services ?? null),
    professional: Array.isArray(raw.professionals)
      ? (raw.professionals[0] ?? null)
      : (raw.professionals ?? null),
  };
}

export async function cancelBookingByToken(token: string) {
  const admin = createAdminClient();

  const { data: booking } = await admin
    .from("bookings")
    .select("id, status, slot_id, professional_id")
    .eq("management_token", token)
    .maybeSingle();

  if (!booking) return { ok: false, error: "Turno no encontrado." };
  if (booking.status === "CANCELLED") return { ok: false, error: "El turno ya está cancelado." };

  const { error } = await admin
    .from("bookings")
    .update({ status: "CANCELLED" })
    .eq("management_token", token);

  if (error) return { ok: false, error: error.message };

  return { ok: true, slotId: booking.slot_id as string };
}

export async function rescheduleBookingByToken(token: string, newSlotId: string) {
  const admin = createAdminClient();

  const { data: booking } = await admin
    .from("bookings")
    .select("id, status, slot_id, professional_id")
    .eq("management_token", token)
    .maybeSingle();

  if (!booking) return { ok: false, error: "Turno no encontrado." };
  if (booking.status === "CANCELLED") return { ok: false, error: "El turno ya está cancelado." };
  if (booking.slot_id === newSlotId) return { ok: false, error: "Ese ya es tu horario actual." };

  // Verificar que el slot nuevo existe, no está bloqueado y es del mismo profesional
  const { data: newSlot } = await admin
    .from("availability_slots")
    .select("id, is_blocked, professional_id")
    .eq("id", newSlotId)
    .maybeSingle();

  if (!newSlot || newSlot.is_blocked) return { ok: false, error: "Horario no disponible." };
  if (newSlot.professional_id !== booking.professional_id) return { ok: false, error: "Horario no válido." };

  // Verificar que el slot nuevo no tiene otra reserva activa
  const { data: conflict } = await admin
    .from("bookings")
    .select("id")
    .eq("slot_id", newSlotId)
    .in("status", ["CONFIRMED", "PENDING"])
    .maybeSingle();

  if (conflict) return { ok: false, error: "Ese horario ya está reservado." };

  const { error } = await admin
    .from("bookings")
    .update({ slot_id: newSlotId })
    .eq("management_token", token);

  if (error) return { ok: false, error: error.message };

  return { ok: true };
}
