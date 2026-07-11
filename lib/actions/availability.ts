"use server";

import { createClient } from "@/lib/supabase/server";
import { generateSlotTimes, SLOT_GRANULARITY_MINUTES, type WeeklyConfig } from "@/lib/availability";
import { revalidatePath } from "next/cache";

export async function saveAvailability(
  professionalId: string,
  weeklyConfig: WeeklyConfig
) {
  const supabase = await createClient();
  const now = new Date().toISOString();

  const { data: bookedSlots } = await supabase
    .from("bookings")
    .select("slot_id")
    .in("status", ["CONFIRMED", "PENDING"]);

  const bookedSlotIds = new Set((bookedSlots ?? []).map((r) => r.slot_id));

  const { data: futureSlots } = await supabase
    .from("availability_slots")
    .select("id")
    .eq("professional_id", professionalId)
    .gte("start_time", now);

  const toDelete = (futureSlots ?? []).filter((s) => !bookedSlotIds.has(s.id));
  for (const slot of toDelete) {
    await supabase.from("availability_slots").delete().eq("id", slot.id);
  }

  // Generar slots por día para poder asignar service_id correctamente
  let totalCount = 0;

  for (let dayIndex = 0; dayIndex < weeklyConfig.length; dayIndex++) {
    const dayConfig = weeklyConfig[dayIndex];
    if (!dayConfig?.active) continue;

    // Config con solo este día activo para generar sus slots
    const singleDayConfig = weeklyConfig.map((d, i) =>
      i === dayIndex ? d : { ...d, active: false }
    );

    const slotTimes = generateSlotTimes(singleDayConfig, SLOT_GRANULARITY_MINUTES, 4);
    if (slotTimes.length === 0) continue;

    const rows = slotTimes.map(({ start, end }) => ({
      professional_id: professionalId,
      start_time: start,
      end_time: end,
      is_blocked: false,
      service_id: dayConfig.serviceId ?? null,
    }));

    const { error } = await supabase.from("availability_slots").insert(rows);
    if (error) return { ok: false, error: error.message };

    totalCount += rows.length;
  }

  revalidatePath("/dashboard/availability");
  return { ok: true, count: totalCount };
}

export async function blockSlot(slotId: string, professionalId: string) {
  const supabase = await createClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("id")
    .eq("slot_id", slotId)
    .in("status", ["CONFIRMED", "PENDING"])
    .maybeSingle();

  if (booking) return { ok: false, error: "No se puede bloquear un slot con reserva activa." };

  const { error } = await supabase
    .from("availability_slots")
    .update({ is_blocked: true })
    .eq("id", slotId)
    .eq("professional_id", professionalId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/availability");
  return { ok: true };
}

export async function unblockSlot(slotId: string, professionalId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("availability_slots")
    .update({ is_blocked: false })
    .eq("id", slotId)
    .eq("professional_id", professionalId);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/availability");
  return { ok: true };
}
