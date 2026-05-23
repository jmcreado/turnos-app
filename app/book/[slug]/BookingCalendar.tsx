"use client";

import { createBooking } from "@/lib/actions/booking";
import type { Professional } from "@/types/database";
import {
  formatSlotTime,
  formatSlotDateShort,
  formatSlotDateTime,
  getWeekdayIndexFromIso,
  WEEKDAY_LABELS_UTC,
  getWeekKeyFromIso,
} from "@/lib/utils/format-date";
import { useState } from "react";

type SlotRow = {
  id: string;
  professional_id: string;
  start_time: string;
  end_time: string;
};

type Props = {
  professional: Professional;
  slots: SlotRow[];
  serviceId: string;
};

function groupSlotsByWeek(slots: SlotRow[]): Map<string, SlotRow[]> {
  const map = new Map<string, SlotRow[]>();
  for (const slot of slots) {
    const key = getWeekKeyFromIso(slot.start_time);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(slot);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }
  return map;
}

type SubmitState = "idle" | "loading" | "success" | "pending_payment";

export function BookingCalendar({ professional, slots, serviceId }: Props) {
  const [selectedSlot, setSelectedSlot] = useState<SlotRow | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [submitState, setSubmitState] = useState<SubmitState>("idle");
  const [error, setError] = useState<string | null>(null);

  const weekGroups = groupSlotsByWeek(slots);
  const weekKeys = Array.from(weekGroups.keys()).sort();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSlot) return;
    setError(null);
    setSubmitState("loading");

    const result = await createBooking({
      slotId: selectedSlot.id,
      professionalId: professional.id,
      serviceId,
      clientName: form.name,
      clientEmail: form.email,
      clientPhone: form.phone,
    });

    if (!result.ok) {
      setError(result.error ?? "Error al reservar.");
      setSubmitState("idle");
      return;
    }

    setSubmitState(result.status === "CONFIRMED" ? "success" : "pending_payment");
  }

  if (submitState === "success") {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        <div className="text-3xl mb-3">✓</div>
        <h2 className="text-xl font-semibold text-emerald-800">¡Turno confirmado!</h2>
        <p className="mt-2 text-emerald-700">
          Te enviamos un email a <strong>{form.email}</strong> con los detalles y un link para gestionar tu turno.
        </p>
        <p className="mt-1 text-sm text-emerald-600">
          {selectedSlot && formatSlotDateTime(selectedSlot.start_time)}
        </p>
      </div>
    );
  }

  if (submitState === "pending_payment") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <div className="text-3xl mb-3">⏳</div>
        <h2 className="text-xl font-semibold text-amber-800">Turno pendiente de pago</h2>
        <p className="mt-2 text-amber-700">
          Tu turno quedó reservado por 24 horas. Te contactaremos por email para coordinar el pago.
        </p>
        <p className="mt-2 text-sm text-amber-600">
          {selectedSlot && formatSlotDateTime(selectedSlot.start_time)}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-base font-semibold text-zinc-900">Elegí un horario</h2>

        {slots.length === 0 ? (
          <p className="mt-4 text-zinc-500">
            No hay turnos disponibles en las próximas 4 semanas.
          </p>
        ) : (
          <div className="mt-4 space-y-4">
            {weekKeys.map((weekKey) => {
              const weekSlots = weekGroups.get(weekKey)!;
              return (
                <div key={weekKey}>
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400">
                    {weekKey}
                  </p>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {weekSlots.map((slot) => (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => {
                          setSelectedSlot(slot);
                          setError(null);
                        }}
                        className={`rounded-lg border px-4 py-3 text-left text-sm transition-colors ${
                          selectedSlot?.id === slot.id
                            ? "border-zinc-900 bg-zinc-900 text-white"
                            : "border-zinc-200 hover:border-zinc-400 hover:bg-zinc-50"
                        }`}
                      >
                        <span className="font-medium">
                          {WEEKDAY_LABELS_UTC[getWeekdayIndexFromIso(slot.start_time)]}
                        </span>{" "}
                        {formatSlotDateShort(slot.start_time)} · {formatSlotTime(slot.start_time)}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedSlot && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm"
        >
          <h3 className="font-semibold text-zinc-900">Completá tus datos</h3>
          <p className="mt-1 text-sm text-zinc-500">
            {formatSlotDateTime(selectedSlot.start_time)}
          </p>

          <div className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Nombre completo *
              </label>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Email *
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/20"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700">
                Teléfono *
              </label>
              <input
                type="tel"
                required
                placeholder="Ej: +54 11 1234-5678"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-zinc-900 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-500/20"
              />
            </div>
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="mt-6 flex gap-3">
            <button
              type="submit"
              disabled={submitState === "loading"}
              className="flex-1 rounded-lg bg-zinc-900 px-6 py-2.5 font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
            >
              {submitState === "loading" ? "Reservando…" : "Confirmar turno"}
            </button>
            <button
              type="button"
              onClick={() => setSelectedSlot(null)}
              className="rounded-lg border border-zinc-300 px-4 py-2.5 font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Cambiar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}