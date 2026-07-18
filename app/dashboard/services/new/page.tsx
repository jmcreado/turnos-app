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
  const [services, setServices] = useState<{ id: string; name: string }[]>([]);
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
          .select("id, name")
          .eq("professional_id", professional.id)
          .eq("is_active", true),
        supabase
          .from("availability_slots")
          .select("id, start_time, end_time")
          .eq("professional_id", professional.id)
          .eq("is_blocked", false)
          .gte("start_time", now),
      ]);

      setServices(servicesRes.data ?? []);
      const slots = slotsRes.data ?? [];
      setHasAvailability(slots.length > 0);
      setMaxWindowMinutes(getMaxContiguousWindowMinutes(slots));
      setLoadingContext(false);
    }
    loadContext();
  }, [router]);

  const existingServicesCount = services.length;
  const durationTooLong = hasAvailability && form.duration_minutes > maxWindowMinutes;
  const canSubmit = !loading && !loadingContext && hasAvailability;

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
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-lg px-4 space-y-6">
        <div className="mb-6">
          <a href="/dashboard" className="text-sm text-muted hover:text-ink">← Volver al dashboard</a>
        </div>

        <div className="rounded-2xl border border-edge bg-surface p-6">
          <h1 className="text-lg font-semibold text-ink">Nuevo servicio</h1>
          <p className="mt-1 text-sm text-muted">Configurá los detalles de tu servicio.</p>

          {!loadingContext && existingServicesCount > 0 && (
            <div className="mt-4 rounded-lg bg-white/5 border border-edge px-4 py-3 text-sm text-muted">
              Ya tenés {existingServicesCount} servicio{existingServicesCount !== 1 ? "s" : ""} activo{existingServicesCount !== 1 ? "s" : ""}. Todos comparten el mismo calendario — un turno de cualquier servicio ocupa el horario para los demás.
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink">Nombre del servicio *</label>
              <input
                type="text"
                required
                placeholder="Ej: Consulta general"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-edge bg-white/5 px-4 py-2.5 text-ink focus:border-accent/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Descripción (opcional)</label>
              <textarea
                rows={2}
                placeholder="Breve descripción del servicio"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-edge bg-white/5 px-4 py-2.5 text-ink focus:border-accent/40 focus:outline-none"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-ink">Duración (min)</label>
                <input
                  type="number"
                  min={15}
                  max={480}
                  step={15}
                  value={form.duration_minutes}
                  onChange={(e) => setForm((f) => ({ ...f, duration_minutes: Number(e.target.value) || 60 }))}
                  className="mt-1 w-full rounded-lg border border-edge bg-white/5 px-4 py-2.5 text-ink focus:border-accent/40 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink">Precio (ARS)</label>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={form.price === 0 ? '' : form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value === '' ? 0 : Number(e.target.value) }))}
                  className="mt-1 w-full rounded-lg border border-edge bg-white/5 px-4 py-2.5 text-ink focus:border-accent/40 focus:outline-none"
                />
              </div>
            </div>

            {durationTooLong && (
              <div className="rounded-lg border border-warn/25 bg-warn/10 px-4 py-3 text-sm text-warn">
                Tu disponibilidad configurada no tiene ningún bloque libre de {form.duration_minutes} minutos seguidos (el más largo es de {maxWindowMinutes} min). Este servicio no va a tener horarios para reservar hasta que ajustes tu disponibilidad más abajo.
              </div>
            )}

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="requires_payment"
                checked={form.requires_payment}
                onChange={(e) => setForm((f) => ({ ...f, requires_payment: e.target.checked }))}
                className="h-4 w-4 rounded border-edge"
              />
              <label htmlFor="requires_payment" className="text-sm text-muted">Requiero pago previo para confirmar el turno</label>
            </div>
            {error && <p className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}

            {!loadingContext && !hasAvailability && (
              <p className="text-sm text-warn">
                Para crear el servicio primero necesitás configurar tu disponibilidad semanal (más abajo).
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={!canSubmit}
                title={!hasAvailability ? "Configurá tu disponibilidad semanal antes de crear el servicio" : undefined}
                className="flex-1 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? "Guardando…" : "Crear servicio"}
              </button>
              <a href="/dashboard" className="rounded-lg border border-edge px-4 py-2.5 text-sm font-medium text-muted hover:bg-white/5">Cancelar</a>
            </div>
          </form>
        </div>

        {!loadingContext && !hasAvailability && professionalId && (
          <div className="space-y-3">
            <div className="rounded-lg border border-warn/25 bg-warn/10 px-4 py-3 text-sm text-warn">
              Todavía no configuraste tu disponibilidad semanal — sin esto, tu servicio no va a tener horarios para que los clientes reserven. Configurala acá abajo:
            </div>
            <AvailabilityConfigForm professionalId={professionalId} services={services} />
          </div>
        )}

        {!loadingContext && hasAvailability && professionalId && (
          <div className="rounded-2xl border border-edge bg-surface p-5 flex items-center justify-between gap-3">
            <p className="text-sm text-muted">Tu bloque libre más largo hoy es de <strong>{maxWindowMinutes} min</strong>.</p>
            <a href="/dashboard/availability" className="text-sm font-medium text-muted hover:text-ink whitespace-nowrap">Editar disponibilidad →</a>
          </div>
        )}
      </div>
    </div>
  );
}
