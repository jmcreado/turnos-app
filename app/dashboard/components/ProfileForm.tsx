"use client";

import { createProfessionalProfile } from "@/lib/actions/professional";
import { useState } from "react";

const G = { green: "#1a6b4a", lightGreen: "#e8f2ed" };

type Props = { userEmail: string; userId: string };

export function ProfileForm({ userEmail, userId }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", service_name: "", session_duration_minutes: 60, session_price: 0, requires_payment: false });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await createProfessionalProfile(form, userEmail, userId);
    setLoading(false);
    if (!result.ok) { setError(result.error ?? "Error al guardar"); return; }
  }

  return (
    <div className="mx-auto max-w-xl rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wider mb-1" style={{ color: G.green }}>Tornu</p>
        <h2 className="text-xl font-semibold text-zinc-900">Completá tu perfil</h2>
        <p className="mt-1 text-sm text-zinc-500">Necesitamos estos datos para armar tu link de reservas.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {[
          { id: "name", label: "Tu nombre", placeholder: "", type: "text", key: "name" },
          { id: "service_name", label: "Nombre del servicio", placeholder: "ej. Consulta psicológica", type: "text", key: "service_name" },
        ].map(({ id, label, placeholder, type, key }) => (
          <div key={id}>
            <label htmlFor={id} className="block text-sm font-medium text-zinc-700 mb-1">{label}</label>
            <input id={id} type={type} required placeholder={placeholder}
              value={form[key as "name" | "service_name"]}
              onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-zinc-900 focus:outline-none focus:border-zinc-400" />
          </div>
        ))}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-zinc-700 mb-1">Duración (minutos)</label>
            <input id="duration" type="number" min={15} max={120} value={form.session_duration_minutes}
              onChange={e => setForm(f => ({ ...f, session_duration_minutes: Number(e.target.value) || 60 }))}
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-zinc-900 focus:outline-none focus:border-zinc-400" />
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium text-zinc-700 mb-1">Precio (ARS)</label>
            <input id="price" type="number" min={0} value={form.session_price}
              onChange={e => setForm(f => ({ ...f, session_price: Number(e.target.value) || 0 }))}
              className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-zinc-900 focus:outline-none focus:border-zinc-400" />
          </div>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" checked={form.requires_payment}
            onChange={e => setForm(f => ({ ...f, requires_payment: e.target.checked }))}
            className="mt-0.5 h-4 w-4 rounded" />
          <span className="text-sm text-zinc-700">Requerir pago previo para confirmar el turno</span>
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading}
          className="w-full rounded-xl py-3 text-sm font-medium text-white transition-opacity disabled:opacity-50"
          style={{ backgroundColor: G.green }}>
          {loading ? "Guardando..." : "Crear mi perfil →"}
        </button>
      </form>
    </div>
  );
}
