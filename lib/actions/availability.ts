"use server";

import { createClient } from "@/lib/supabase/server";
import { generateSlotTimes, type WeeklyConfig } from "@/lib/availability";
import { revalidatePath } from "next/cache";

/**
 * Guarda la disponibilidad: elimina slots futuros sin reserva y crea los nuevos según la config.
 */
export async function saveAvailability(
  professionalId: string,
  weeklyConfig: WeeklyConfig,
  durationMinutes: number
) {
  const supabase = await createClient();
  const now = new Date().toISOString();

  // Slots que tienen alguna reserva (CONFIRMED o PENDING) no se tocan
  const { data: bookedSlots } = await supabase
    .from("bookings")
    .select("slot_id")
    .in("status", ["CONFIRMED", "PENDING"]);

  const bookedSlotIds = new Set((bookedSlots ?? []).map((r) => r.slot_id));

  // Borrar slots futuros de este profesional que no estén reservados
  const { data: futureSlots } = await supabase
    .from("availability_slots")
    .select("id")
    .eq("professional_id", professionalId)
    .gte("start_time", now);

  const toDelete = (futureSlots ?? []).filter((s) => !bookedSlotIds.has(s.id));
  for (const slot of toDelete) {
    await supabase.from("availability_slots").delete().eq("id", slot.id);
  }

  // Generar nuevos slots
  const slotTimes = generateSlotTimes(weeklyConfig, durationMinutes, 4);

  if (slotTimes.length === 0) {
    revalidatePath("/dashboard/availability");
    return { ok: true, count: 0 };
  }

  const rows = slotTimes.map(({ start, end }) => ({
    professional_id: professionalId,
    start_time: start,
    end_time: end,
    is_blocked: false,
  }));

  const { error } = await supabase.from("availability_slots").insert(rows);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/availability");
  return { ok: true, count: rows.length };
}

/**
 * Marca un slot como bloqueado (solo si no tiene reserva confirmada/pendiente).
 */
export async function blockSlot(slotId: string, professionalId: string) {
  const supabase = await createClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("id")
    .eq("slot_id", slotId)
    .in("status", ["CONFIRMED", "PENDING"])
    .maybeSingle();

  if (booking) {
    return { ok: false, error: "No se puede bloquear un slot con reserva activa." };
  }

  const { error } = await supabase
    .from("availability_slots")
    .update({ is_blocked: true })
    .eq("id", slotId)
    .eq("professional_id", professionalId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/availability");
  return { ok: true };
}

/**
 * Desbloquea un slot.
 */
export async function unblockSlot(slotId: string, professionalId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("availability_slots")
    .update({ is_blocked: false })
    .eq("id", slotId)
    .eq("professional_id", professionalId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath("/dashboard/availability");
  return { ok: true };
}
