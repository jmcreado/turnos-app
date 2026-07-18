"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function EditServicePage() {
  const router = useRouter();
  const params = useParams();
  const serviceId = params.id as string;

  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    description: "",
    duration_minutes: 60,
    price: 0,
    requires_payment: false,
    is_active: true,
  });

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data } = await supabase
        .from("services")
        .select("*")
        .eq("id", serviceId)
        .maybeSingle();
      if (data) {
        setForm({
          name: data.name,
          description: data.description ?? "",
          duration_minutes: data.duration_minutes,
          price: Number(data.price),
          requires_payment: data.requires_payment,
          is_active: data.is_active,
        });
      }
      setFetching(false);
    }
    load();
  }, [serviceId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("services")
      .update({
        name: form.name,
        description: form.description || null,
        duration_minutes: form.duration_minutes,
        price: form.price,
        requires_payment: form.requires_payment,
        is_active: form.is_active,
      })
      .eq("id", serviceId);

    setLoading(false);
    if (updateError) { setError(updateError.message); return; }
    router.push("/dashboard");
    router.refresh();
  }

  async function handleDelete() {
    if (!confirm("¿Desactivar este servicio? Los turnos existentes no se verán afectados.")) return;
    const supabase = createClient();
    await supabase.from("services").update({ is_active: false }).eq("id", serviceId);
    router.push("/dashboard");
    router.refresh();
  }

  if (fetching) {
    return (
      <div className="min-h-screen py-8">
        <div className="mx-auto max-w-lg px-4">
          <div className="h-64 animate-pulse rounded-2xl bg-white/5" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="mx-auto max-w-lg px-4">
        <div className="mb-6">
          <a href="/dashboard" className="text-sm text-muted hover:text-ink">← Volver al dashboard</a>
        </div>
        <div className="rounded-2xl border border-edge bg-surface p-6">
          <h1 className="text-lg font-semibold text-ink">Editar servicio</h1>
          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink">Nombre *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-edge bg-white/5 px-4 py-2.5 text-ink focus:border-accent/40 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Descripción</label>
              <textarea
                rows={2}
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
                  step={100}
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: Number(e.target.value) || 0 }))}
                  className="mt-1 w-full rounded-lg border border-edge bg-white/5 px-4 py-2.5 text-ink focus:border-accent/40 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="requires_payment"
                checked={form.requires_payment}
                onChange={(e) => setForm((f) => ({ ...f, requires_payment: e.target.checked }))}
                className="h-4 w-4 rounded border-edge"
              />
              <label htmlFor="requires_payment" className="text-sm text-muted">Requiero pago previo</label>
            </div>
            {error && <p className="rounded-lg bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={loading} className="flex-1 rounded-lg bg-ink px-4 py-2.5 text-sm font-medium text-background transition-colors hover:bg-accent disabled:opacity-50">
                {loading ? "Guardando…" : "Guardar cambios"}
              </button>
              <a href="/dashboard" className="rounded-lg border border-edge px-4 py-2.5 text-sm font-medium text-muted hover:bg-white/5">Cancelar</a>
            </div>
          </form>
          <div className="mt-6 border-t border-white/5 pt-4">
            <button onClick={handleDelete} className="text-sm text-danger/80 hover:text-danger">Desactivar servicio</button>
          </div>
        </div>
      </div>
    </div>
  );
}