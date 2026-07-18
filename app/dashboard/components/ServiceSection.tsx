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
    <div className="rounded-2xl border border-edge bg-surface p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink">Mi servicio</h2>
        {!editing ? (
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="rounded-lg border border-edge px-3 py-1.5 text-sm font-medium text-muted hover:bg-white/5"
          >
            Editar
          </button>
        ) : null}
      </div>

      {editing ? (
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink">
              Nombre del servicio
            </label>
            <input
              type="text"
              value={form.service_name}
              onChange={(e) => setForm((f) => ({ ...f, service_name: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-edge bg-white/5 px-4 py-2 text-ink focus:border-accent/40 focus:outline-none"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-ink">
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
                className="mt-1 w-full rounded-lg border border-edge bg-white/5 px-4 py-2 text-ink"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">
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
                className="mt-1 w-full rounded-lg border border-edge bg-white/5 px-4 py-2 text-ink"
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
              className="h-4 w-4 rounded border-edge text-ink"
            />
            <label htmlFor="req-payment" className="text-sm text-muted">
              Requiero pago previo
            </label>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-accent disabled:opacity-50"
            >
              {loading ? "Guardando…" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-lg border border-edge px-4 py-2 text-sm font-medium text-muted hover:bg-white/5"
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <dl className="mt-4 space-y-2">
          <div>
            <dt className="text-sm text-muted">Servicio</dt>
            <dd className="font-medium text-ink">{serviceName}</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Duración</dt>
            <dd className="font-medium text-ink">{professional.session_duration_minutes} min</dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Precio</dt>
            <dd className="font-medium text-ink">
              ${professional.session_price.toLocaleString("es-AR")} ARS
            </dd>
          </div>
          <div>
            <dt className="text-sm text-muted">Pago previo</dt>
            <dd className="font-medium text-ink">
              {professional.requires_payment ? "Sí" : "No"}
            </dd>
          </div>
        </dl>
      )}
    </div>
  );
}
