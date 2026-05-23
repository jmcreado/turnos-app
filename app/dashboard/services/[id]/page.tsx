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
      <div className="min-h-screen bg-zinc-50 py-8">
        <div className="mx-auto max-w-lg px-4">
          <div className="h-64 animate-pulse rounded-2xl bg-zinc-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 py-8">
      <div className="mx-auto max-w-lg px-4">
        <div className="mb-6">
          <a href="/dashboard" className="text-sm text-zinc-500 hover:text-zinc-700">
            ← Volver al dashboard
          </a>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-lg font-semibold text-zinc-900">Editar servicio</h1>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700">Nombre *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-700">Descripción</label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-zinc-500 focus:outline-none"
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
                  onChange={(e) =>
                    setForm((f) => ({ ...f, duration_minutes: Number(e.target.value) || 60 }))
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-zinc-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700">Precio (ARS)</label>
                <input
                  type="number"
                  min={0}
                  step={100}
                  value={form.price}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, price: Number(e.target.value) || 0 }))
                  }
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-zinc-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="requires_payment"
                checked={form.requires_payment}
                onChange={(e) =>
                  setForm((f) => ({ ...f, requires_payment: e.target.checked }))
                }
                className="h-4 w-4 rounded border-zinc-300"
              />
              <label htmlFor="requires_payment" className="text-sm text-zinc-700">
                Requiero pago previo
              </label>
            </div>

            {error && (
              <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50"
              >
                {loading ? "Guardando…" : "Guardar cambios"}
              </button>
              
                href="/dashboard"
                className="rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Cancelar
              </a>
            </div>
          </form>

          <div className="mt-6 border-t border-zinc-100 pt-4">
            <button
              onClick={handleDelete}
              className="text-sm text-red-500 hover:text-red-700"
            >
              Desactivar servicio
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}