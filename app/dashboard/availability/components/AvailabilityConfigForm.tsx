"use client";

import { saveAvailability } from "@/lib/actions/availability";
import { WEEKDAY_LABELS, defaultWeeklyConfig, type WeeklyConfig } from "@/lib/availability";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Service = { id: string; name: string };

type Props = {
  professionalId: string;
  services: Service[];
};

export function AvailabilityConfigForm({ professionalId, services }: Props) {
  const router = useRouter();
  const [config, setConfig] = useState<WeeklyConfig>(defaultWeeklyConfig());
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function updateDay(index: number, patch: Partial<{ active: boolean; startTime: string; endTime: string; serviceId: string | null }>) {
    setConfig((prev) => {
      const next = [...prev];
      next[index] = { ...next[index]!, ...patch };
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setLoading(true);
    const result = await saveAvailability(professionalId, config);
    setLoading(false);
    if (result.ok) {
      setMessage({ type: "ok", text: `Disponibilidad guardada. Se generaron ${result.count} slots para las próximas 4 semanas.` });
      router.refresh();
    } else {
      setMessage({ type: "error", text: result.error ?? "Error al guardar." });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">Configuración semanal</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Elegí los días, horarios y —opcionalmente— qué servicio aplica cada día.
      </p>

      <div className="mt-6 space-y-4">
        {WEEKDAY_LABELS.map((label, i) => (
          <div key={label} className="flex flex-wrap items-center gap-4 rounded-lg border border-zinc-100 bg-zinc-50/50 p-4">
            <label className="flex w-12 items-center gap-2 font-medium text-zinc-700">
              <input
                type="checkbox"
                checked={config[i]!.active}
                onChange={(e) => updateDay(i, { active: e.target.checked })}
                className="h-4 w-4 rounded border-zinc-300"
              />
              {label}
            </label>

            {config[i]!.active && (
              <>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-500">De</span>
                  <input
                    type="time"
                    value={config[i]!.startTime}
                    onChange={(e) => updateDay(i, { startTime: e.target.value })}
                    className="rounded border border-zinc-300 px-3 py-1.5 text-sm"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-500">a</span>
                  <input
                    type="time"
                    value={config[i]!.endTime}
                    onChange={(e) => updateDay(i, { endTime: e.target.value })}
                    className="rounded border border-zinc-300 px-3 py-1.5 text-sm"
                  />
                </div>

                {services.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-zinc-500">Servicio</span>
                    <select
                      value={config[i]!.serviceId ?? ""}
                      onChange={(e) => updateDay(i, { serviceId: e.target.value || null })}
                      className="rounded border border-zinc-300 px-3 py-1.5 text-sm bg-white"
                    >
                      <option value="">Todos los servicios</option>
                      {services.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {message && (
        <p className={`mt-4 text-sm ${message.type === "ok" ? "text-emerald-600" : "text-red-600"}`} role="alert">
          {message.text}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-lg bg-zinc-900 px-4 py-3 font-medium text-white hover:bg-zinc-800 disabled:opacity-50 sm:w-auto"
      >
        {loading ? "Guardando…" : "Guardar disponibilidad"}
      </button>
    </form>
  );
}
