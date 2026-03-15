"use client";

import { updateProfessionalProfile } from "@/lib/actions/professional";
import type { Professional } from "@/types/database";
import { useState } from "react";

type Props = {
  professional: Professional;
};

export function ServiceSection({ professional }: Props) {
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    service_name: professional.service_name ?? professional.name,
    session_duration_minutes: professional.session_duration_minutes,
    session_price: professional.session_price,
    requires_payment: professional.requires_payment,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await updateProfessionalProfile(professional.id, form);
    setLoading(false);
    if (!result.ok) {
      setError(result.error ?? "Error al guardar");
      return;
    }
    setEditing(false);
  }

  const serviceName = professional.service_name || professional.name || "Mi servicio";

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900">Mi servicio</h2>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Editar
          </button>
        ) : null}
      </div>

      {editing ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700">
              Nombre del servicio
            </label>
            <input
              type="text"
              value={form.service_name}
              onChange={(e) => setForm((f) => ({ ...f, service_name: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-500/20"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Duración (min)
              </label>
              <input
                type="number"
                min={15}
                max={120}
                value={form.session_duration_minutes}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    session_duration_minutes: Number(e.target.value) || 60,
                  }))
                }
                className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Precio (ARS)
              </label>
              <input
                type="number"
                min={0}
                step={100}
                value={form.session_price}
                onChange={(e) =>
                  setForm((f) => ({ ...f, session_price: Number(e.target.value) || 0 }))
                }
                className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2 text-zinc-900"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="req-payment"
              checked={form.requires_payment}
              onChange={(e) =>
                setForm((f) => ({ ...f, requires_payment: e.target.checked }))
              }
              className="h-4 w-4 rounded border-zinc-300 text-zinc-900"
            />
            <label htmlFor="req-payment" className="text-sm text-zinc-700">
              Requiero pago previo
            </label>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {loading ? "Guardando…" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <dl className="mt-4 space-y-2">
          <div>
            <dt className="text-sm text-zinc-500">Servicio</dt>
            <dd className="font-medium text-zinc-900">{serviceName}</dd>
          </div>
          <div>
            <dt className="text-sm text-zinc-500">Duración</dt>
            <dd className="font-medium text-zinc-900">{professional.session_duration_minutes} min</dd>
          </div>
          <div>
            <dt className="text-sm text-zinc-500">Precio</dt>
            <dd className="font-medium text-zinc-900">
              ${professional.session_price.toLocaleString("es-AR")} ARS
            </dd>
          </div>
          <div>
            <dt className="text-sm text-zinc-500">Pago previo</dt>
            <dd className="font-medium text-zinc-900">
              {professional.requires_payment ? "Sí" : "No"}
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}
