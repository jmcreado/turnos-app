"use client";

import { createProfessionalProfile } from "@/lib/actions/professional";
import { useState } from "react";

type Props = {
  userEmail: string;
  userId: string;
};

export function ProfileForm({ userEmail, userId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    service_name: "",
    session_duration_minutes: 60,
    session_price: 0,
    requires_payment: false,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await createProfessionalProfile(form, userEmail, userId);
    setLoading(false);

    if (!result.ok) {
      setError(result.error ?? "Error al guardar");
      return;
    }
  }

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <h2 className="text-xl font-semibold text-zinc-900">
        Completá tu perfil
      </h2>
      <p className="mt-1 text-sm text-zinc-600">
        Necesitamos estos datos para armar tu link de reservas y mostrar tu servicio a los clientes.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-zinc-700">
            Tu nombre
          </label>
          <input
            id="name"
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/20"
          />
        </div>

        <div>
          <label htmlFor="service_name" className="block text-sm font-medium text-zinc-700">
            Nombre del servicio
          </label>
          <input
            id="service_name"
            type="text"
            required
            placeholder="ej. Consulta psicológica"
            value={form.service_name}
            onChange={(e) => setForm((f) => ({ ...f, service_name: e.target.value }))}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/20"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-zinc-700">
              Duración (minutos)
            </label>
            <input
              id="duration"
              type="number"
              min={15}
              max={120}
              value={form.session_duration_minutes}
              onChange={(e) =>
                setForm((f) => ({ ...f, session_duration_minutes: Number(e.target.value) || 60 }))
              }
              className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/20"
            />
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-zinc-700">
              Precio (ARS)
            </label>
            <input
              id="price"
              type="number"
              min={0}
              step={100}
              value={form.session_price}
              onChange={(e) =>
                setForm((f) => ({ ...f, session_price: Number(e.target.value) || 0 }))
              }
              className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/20"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            id="requires_payment"
            type="checkbox"
            checked={form.requires_payment}
            onChange={(e) =>
              setForm((f) => ({ ...f, requires_payment: e.target.checked }))
            }
            className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-500"
          />
          <label htmlFor="requires_payment" className="text-sm text-zinc-700">
            Requiero pago previo para confirmar el turno
          </label>
        </div>

        {error && (
          <p className="text-sm text-red-600" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-zinc-900 px-4 py-3 font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
        >
          {loading ? "Guardando…" : "Crear perfil"}
        </button>
      </form>
    </div>
  );
}
