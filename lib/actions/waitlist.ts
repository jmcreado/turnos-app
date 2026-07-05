"use server";

/**
 * lib/actions/waitlist.ts — Tornu v2
 */

import { createClient } from "@/lib/supabase/server";
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
