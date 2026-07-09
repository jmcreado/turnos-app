"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getMaxContiguousWindowMinutes } from "@/lib/availability";
import { AvailabilityConfigForm } from "../../availability/components/AvailabilityConfigForm";

export default function NewServicePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    duration_minutes: 60,
    price: 0,
    requires_payment: false,
  });

  const [professionalId, setProfessionalId] = useState<string | null>(null);
  const [loadingContext, setLoadingContext] = useState(true);
  const [existingServicesCount, setExistingServicesCount] = useState(0);
  const [hasAvailability, setHasAvailability] = useState(false);
  const [maxWindowMinutes, setMaxWindowMinutes] = useState(0);

  useEffect(() => {
    async function loadContext() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: professional } = await supabase
        .from("professionals")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!professional) { setLoadingContext(false); return; }
      setProfessionalId(professional.id);

      const now = new Date().toISOString();
      const [servicesRes, slotsRes] = await Promise.all([
        supabase
          .from("services")
          .select("id", { count: "exact", head: true })
          .eq("professional_id", professional.id)
          .eq("is_active", true),
        supabase
          .from("availability_slots")
          .select("id, start_time, end_time")
          .eq("professional_id", professional.id)
          .eq("is_blocked", false)
          .gte("start_time", now),
      ]);

      setExistingServicesCount(servicesRes.count ?? 0);
      const slots = slotsRes.data ?? [];
      setHasAvailability(slots.length > 0);
      setMaxWindowMinutes(getMaxContiguousWindowMinutes(slots));
      setLoadingContext(false);
    }
    loadContext();
  }, [router]);

  const durationTooLong = hasAvailability && form.duration_minutes > maxWindowMinutes;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/login"); return; }

    const { data: professional } = await supabase
      .from("professionals")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!professional) {
      setError("No se encontró tu perfil profesional.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase.from("services").insert({
      professional_id: professional.id,
      name: form.name,
      description: form.description || null,
      duration_minutes: form.duration_minutes,
      price: form.price,
      requires_payment: form.requires_payment,
    });

    setLoading(false);
    if (insertError) { setError(insertError.message); return; }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-8">
      <div className="mx-auto max-w-lg px-4 space-y-6">
        <div className="mb-6">
          <a href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-700">← Volver al dashboard</a>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-zinc-900">Nuevo servicio</h1>
          <p className="mt-1 text-sm text-zinc-500">Configurá los detalles de tu servicio.</p>

          {!loadingContext && existingServicesCount > 0 && (
            <div className="mt-4 rounded-lg bg-zinc-50 border border-zinc-200 px-4 py-3 text-sm text-zinc-600">
              Ya tenés {existingServicesCount} servicio{existingServicesCount !== 1 ? "s" : ""} activo{existingServicesCount !== 1 ? "s" : ""}. Todos comparten el mismo calendario — un turno de cualquier servicio ocupa el horario para los demás.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700">Nombre del servicio *</label>
              <input
                type="text"
                required
                placeholder="Ej: Consulta general"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">Descripción (opcional)</label>
              <textarea
                rows={2}
                placeholder="Breve descripción del servicio"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/20"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-700">Duración (min)</label>
                <input
                  type="number"
                  min={15}
                  max={480}
                  step={15}
                  value={form.duration_minutes}
                  onChange={(e) => setForm((f) => ({ ...f, duration_minutes: Number(e.target.value) || 60 }))}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-zinc-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700">Precio (ARS)</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.price === 0 ? '' : form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value === '' ? 0 : Number(e.target.value) }))}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-zinc-500 focus:outline-none"
                />
              </div>
            </div>

            {durationTooLong && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
                Tu disponibilidad configurada no tiene ningún bloque libre de {form.duration_minutes} minutos seguidos (el más largo es de {maxWindowMinutes} min). Este servicio no va a tener horarios para reservar hasta que ajustes tu disponibilidad más abajo.
              </div>
            )}

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="requires_payment"
                checked={form.requires_payment}
                onChange={(e) => setForm((f) => ({ ...f, requires_payment: e.target.checked }))}
                className="h-4 w-4 rounded border-zinc-300"
              />
              <label htmlFor="requires_payment" className="text-sm text-zinc-700">Requiero pago previo para confirmar el turno</label>
            </div>
            {error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading} className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50">
                {loading ? "Guardando…" : "Crear servicio"}
              </button>
              <a href="/dashboard" className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50">Cancelar</a>
            </div>
          </form>
        </div>

        {!loadingContext && !hasAvailability && professionalId && (
          <div className="space-y-3">
            <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
              Todavía no configuraste tu disponibilidad semanal — sin esto, tu servicio no va a tener horarios para que los clientes reserven. Configurala acá abajo:
            </div>
            <AvailabilityConfigForm professionalId={professionalId} />
          </div>
        )}

        {!loadingContext && hasAvailability && professionalId && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm flex items-center justify-between gap-3">
            <p className="text-sm text-zinc-600">Tu bloque libre más largo hoy es de <strong>{maxWindowMinutes} min</strong>.</p>
            <a href="/dashboard/availability" className="text-sm font-medium text-zinc-700 hover:text-zinc-900 whitespace-nowrap">Editar disponibilidad →</a>
          </div>
        )}
      </div>
    </div>
  );
}
