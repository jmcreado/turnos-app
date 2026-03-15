"use client";

import { blockSlot, unblockSlot } from "@/lib/actions/availability";
import type { AvailabilitySlot } from "@/types/database";
import { getWeekdayIndex, WEEKDAY_LABELS } from "@/lib/availability";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Props = {
  professionalId: string;
  slots: AvailabilitySlot[];
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
}

/** Agrupa slots por semana (lunes a domingo) para mostrar */
function groupSlotsByWeek(slots: AvailabilitySlot[]): Map<string, AvailabilitySlot[]> {
  const map = new Map<string, AvailabilitySlot[]>();
  for (const slot of slots) {
    const d = new Date(slot.start_time);
    const weekStart = new Date(d);
    const day = weekStart.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    weekStart.setDate(weekStart.getDate() + diff);
    weekStart.setHours(0, 0, 0, 0);
    const key = weekStart.toISOString().slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(slot);
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }
  return map;
}

export function SlotsCalendar({ professionalId, slots }: Props) {
  const router = useRouter();
  const [blockingId, setBlockingId] = useState<string | null>(null);

  const weekGroups = groupSlotsByWeek(slots);
  const weekKeys = Array.from(weekGroups.keys()).sort();

  async function handleBlock(slot: AvailabilitySlot) {
    setBlockingId(slot.id);
    if (slot.is_blocked) {
      await unblockSlot(slot.id, professionalId);
    } else {
      await blockSlot(slot.id, professionalId);
    }
    setBlockingId(null);
    router.refresh();
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-zinc-900">Slots generados</h2>
        <p className="mt-4 text-zinc-500">
          No hay slots para las próximas 4 semanas. Configurá días y horarios arriba y hacé clic en
          &quot;Guardar disponibilidad&quot;.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">Slots generados</h2>
      <p className="mt-1 text-sm text-zinc-500">Próximas 4 semanas. Podés bloquear horarios puntuales.</p>

      <div className="mt-6 space-y-8">
        {weekKeys.map((weekKey) => {
          const weekSlots = weekGroups.get(weekKey)!;
          const weekStart = new Date(weekKey);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 6);
          const weekLabel = `${formatDate(weekStart)} – ${formatDate(weekEnd)}`;

          return (
            <div key={weekKey}>
              <h3 className="mb-3 text-sm font-medium text-zinc-600">{weekLabel}</h3>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {weekSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className={`flex items-center justify-between rounded-lg border px-4 py-3 ${
                      slot.is_blocked
                        ? "border-amber-200 bg-amber-50/50"
                        : "border-zinc-200 bg-zinc-50/50"
                    }`}
                  >
                    <div>
                      <span className="font-medium text-zinc-900">
                        {WEEKDAY_LABELS[getWeekdayIndex(new Date(slot.start_time))]}
                      </span>
                      <span className="ml-2 text-zinc-600">
                        {formatDate(slot.start_time)} {formatTime(slot.start_time)} –{" "}
                        {formatTime(slot.end_time)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleBlock(slot)}
                      disabled={blockingId === slot.id}
                      className={`shrink-0 rounded px-2 py-1 text-xs font-medium ${
                        slot.is_blocked
                          ? "bg-amber-200 text-amber-800 hover:bg-amber-300"
                          : "bg-zinc-200 text-zinc-700 hover:bg-zinc-300"
                      } disabled:opacity-50`}
                    >
                      {blockingId === slot.id
                        ? "..."
                        : slot.is_blocked
                          ? "Desbloquear"
                          : "Bloquear"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
