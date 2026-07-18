"use server";

/**
 * lib/actions/launch-waitlist.ts — Waitlist de lanzamiento (coming soon)
 * Inserta con service role: la tabla launch_waitlist tiene RLS activado
 * y sin policies públicas, así que anon no puede leer ni escribir directo.
 */

import { createServiceClient } from "@/lib/supabase/service";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type Result = { ok: true; already?: boolean } | { ok: false; error: string };

export async function joinLaunchWaitlist(email: string): Promise<Result> {
  const normalized = email.trim().toLowerCase();

  if (!normalized || normalized.length > 254 || !EMAIL_RE.test(normalized)) {
    return { ok: false, error: "Ingresá un email válido." };
  }

  const supabase = createServiceClient();

  const { error } = await supabase
    .from("launch_waitlist")
    .insert({ email: normalized, source: "coming_soon" });

  if (error) {
    // Email duplicado: lo tratamos como éxito idempotente
    if (error.code === "23505") return { ok: true, already: true };
    console.error("launch_waitlist insert error:", error);
    return { ok: false, error: "No pudimos anotarte. Probá de nuevo en un rato." };
  }

  return { ok: true };
}
