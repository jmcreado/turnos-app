"use client";

/**
 * app/dashboard/availability/components/SlotsCalendar.tsx — Tornu v2
 * Vista de agenda del profesional: semana por semana, booking info, cancel, waitlist.
 */

import { blockSlot, unblockSlot } from "@/lib/actions/availability";
import { cancelBookingByProfessional } from "@/lib/actions/booking";
import { removeWaitlistEntry } from "@/lib/actions/waitlist";
import type { AvailabilitySlot, SlotWaitlist } from "@/types/database";
import { useRouter } from "next/navigation";
import { useState, useMemo } from "react";

const G = {
  green: "#1a6b4a",
  lightGreen: "#e8f2ed",
  greenText: "#14532d",
  cream: "#f7f5f0",
};

type BookingInfo = {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  status: string;
  service_name: string | null;
};

type Props = {
  professionalId: string;
  slots: AvailabilitySlot[];
  bookingsBySlot: Record<string, BookingInfo>;
  waitlistBySlot: Record<string, SlotWaitlist>;
};

function fmt(iso: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(iso).toLocaleString("es-AR", opts);
}
function fmtTime(iso: string) { return fmt(iso, { hour: "2-digit", minute: "2-digit" }); }
function fmtDate(iso: string) { return fmt(iso, { day: "numeric", month: "short" }); }

function getWeekMonday(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(monday.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function weekKey(d: Date): string { return getWeekMonday(d).toISOString().slice(0, 10); }

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    CONFIRMED: { label: "Confirmado", bg: "#dcfce7", color: "#15803d" },
    PENDING: { label: "Pago pendiente", bg: "#fef9c3", color: "#854d0e" },
    BLOCKED: { label: "Bloqueado", bg: "#fee2e2", color: "#b91c1c" },
    FREE: { label: "Libre", bg: "#f3f4f6", color: "#6b7280" },
  };
  const s = map[status] ?? map.FREE;
  return (
    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: s.bg, color: s.color }}>{s.label}</span>
  );
}

export function SlotsCalendar({ professionalId, slots, bookingsBySlot, waitlistBySlot }: Props) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [notifiedSlots, setNotifiedSlots] = useState<Set<string>>(new Set());

  // Agrupar slots por semana
  const weekGroups = useMemo(() => {
    const map = new Map<string, AvailabilitySlot[]>();
    for (const slot of slots) {
      const k = weekKey(new Date(slot.start_time));
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(slot);
    }
    for (const arr of map.values()) arr.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
    return map;
  }, [slots]);

  const weekKeys = useMemo(() => Array.from(weekGroups.keys()).sort(), [weekGroups]);
  const [weekIdx, setWeekIdx] = useState(0);
  const currentWeekKey = weekKeys[weekIdx] ?? null;
  const weekSlots = currentWeekKey ? (weekGroups.get(currentWeekKey) ?? []) : [];

  // Agrupar por día dentro de la semana
  const dayGroups = useMemo(() => {
    const map = new Map<string, AvailabilitySlot[]>();
    for (const slot of weekSlots) {
      const d = new Date(slot.start_time).toISOString().slice(0, 10);
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(slot);
    }
    return map;
  }, [weekSlots]);

  const dayKeys = useMemo(() => Array.from(dayGroups.keys()).sort(), [dayGroups]);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const activeDayKey = selectedDay && dayKeys.includes(selectedDay) ? selectedDay : (dayKeys[0] ?? null);
  const daySlots = activeDayKey ? (dayGroups.get(activeDayKey) ?? []) : [];

  // Stats semana
  const confirmed = weekSlots.filter(s => bookingsBySlot[s.id]?.status === "CONFIRMED").length;
  const pending = weekSlots.filter(s => bookingsBySlot[s.id]?.status === "PENDING").length;
  const free = weekSlots.filter(s => !bookingsBySlot[s.id] && !s.is_blocked).length;

  const selectedSlot = selectedSlotId ? slots.find(s => s.id === selectedSlotId) ?? null : null;
  const selectedBooking = selectedSlot ? (bookingsBySlot[selectedSlot.id] ?? null) : null;
  const selectedWaitlist = selectedSlot ? (waitlistBySlot[selectedSlot.id] ?? null) : null;

  async function handleBlockToggle(slot: AvailabilitySlot) {
    setLoadingId(slot.id);
    if (slot.is_blocked) await unblockSlot(slot.id, professionalId);
    else await blockSlot(slot.id, professionalId);
    setLoadingId(null);
    router.refresh();
  }

  async function handleCancel(bookingId: string) {
    setLoadingId(bookingId);
    await cancelBookingByProfessional(bookingId, professionalId);
    setLoadingId(null);
    setSelectedSlotId(null);
    router.refresh();
  }

  async function handleNotifyWaitlist(waitlistEntry: SlotWaitlist) {
    setLoadingId(waitlistEntry.id);
    // Cancelar el turno si hay uno, y remover la entrada de waitlist
    const booking = selectedBooking;
    if (booking) await cancelBookingByProfessional(booking.id, professionalId);
    await removeWaitlistEntry(waitlistEntry.id, professionalId);
    setNotifiedSlots(prev => new Set([...prev, waitlistEntry.slot_id]));
    setLoadingId(null);
    setSelectedSlotId(null);
    router.refresh();
  }

  if (slots.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <p className="text-zinc-500">No hay slots para las próximas 4 semanas. Configurá tu disponibilidad arriba.</p>
      </div>
    );
  }

  function weekLabel(k: string): string {
    const monday = new Date(k);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    return `${fmtDate(monday.toISOString())} – ${fmtDate(sunday.toISOString())}`;
  }

  function dayLabel(d: string): string {
    return new Date(d + "T12:00:00").toLocaleDateString("es-AR", { weekday: "short", day: "numeric" });
  }

  function bookingsForDay(d: string) {
    return (dayGroups.get(d) ?? []).filter(s => bookingsBySlot[s.id]).length;
  }

  function dayHasWaitlist(d: string) {
    return (dayGroups.get(d) ?? []).some(s => waitlistBySlot[s.id]);
  }

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-5 text-white" style={{ backgroundColor: G.green }}>
        <p className="text-xs opacity-70 uppercase tracking-wider mb-1">Agenda</p>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => { setWeekIdx(i => Math.max(0, i - 1)); setSelectedDay(null); }}
            disabled={weekIdx === 0}
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg transition-opacity disabled:opacity-30"
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>‹</button>
          <span className="text-sm font-medium">{weekKeys[weekIdx] ? weekLabel(weekKeys[weekIdx]!) : "—"}</span>
          <button
            onClick={() => { setWeekIdx(i => Math.min(weekKeys.length - 1, i + 1)); setSelectedDay(null); }}
            disabled={weekIdx >= weekKeys.length - 1}
            className="w-8 h-8 rounded-full flex items-center justify-center text-lg transition-opacity disabled:opacity-30"
            style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>›</button>
        </div>
        <div className="flex gap-2">
          {[{ label: "Confirmados", val: confirmed }, { label: "Pendientes", val: pending }, { label: "Libres", val: free }].map(({ label, val }) => (
            <div key={label} className="flex-1 rounded-xl p-3 text-center" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
              <div className="text-2xl font-bold">{val}</div>
              <div className="text-xs opacity-80 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="p-5">
        {/* Day tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {dayKeys.map(d => {
            const count = bookingsForDay(d);
            const hasWL = dayHasWaitlist(d);
            const isSelected = activeDayKey === d;
            return (
              <button key={d} onClick={() => setSelectedDay(d)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
                style={isSelected ? { backgroundColor: G.green, color: "white" } : { backgroundColor: "#f3f4f6", color: "#4b5563" }}>
                {dayLabel(d)}
                {count > 0 && (
                  <span className="text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold"
                    style={isSelected ? { backgroundColor: "rgba(255,255,255,0.25)" } : { backgroundColor: G.lightGreen, color: G.greenText }}>
                    {count}
                  </span>
                )}
                {hasWL && <span className="text-xs">🔔</span>}
              </button>
            );
          })}
        </div>

        {/* Slot list */}
        <div className="space-y-2">
          {daySlots.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-400">Sin slots este día</p>
          )}
          {daySlots.map(slot => {
            const booking = bookingsBySlot[slot.id];
            const wl = waitlistBySlot[slot.id];
            const slotStatus = booking ? booking.status : slot.is_blocked ? "BLOCKED" : "FREE";
            const isLoading = loadingId === slot.id || loadingId === booking?.id;
            const wasNotified = notifiedSlots.has(slot.id);

            return (
              <div key={slot.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-zinc-900">
                      {fmtTime(slot.start_time)} – {fmtTime(slot.end_time)}
                    </span>
                    <StatusBadge status={slotStatus} />
                    {wl && !wasNotified && (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: "#fef3c7", color: "#92400e" }}>🔔 1 en espera</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {slotStatus === "FREE" && (
                      <button onClick={() => handleBlockToggle(slot)} disabled={isLoading}
                        className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-50">
                        {isLoading ? "..." : "Bloquear"}
                      </button>
                    )}
                    {slotStatus === "BLOCKED" && (
                      <button onClick={() => handleBlockToggle(slot)} disabled={isLoading}
                        className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-100 disabled:opacity-50">
                        {isLoading ? "..." : "Desbloquear"}
                      </button>
                    )}
                    {(slotStatus === "CONFIRMED" || slotStatus === "PENDING") && (
                      <button onClick={() => setSelectedSlotId(slot.id)} className="text-xs px-3 py-1.5 rounded-lg text-white" style={{ backgroundColor: G.green }}>Ver detalle</button>
                    )}
                  </div>
                </div>
                {booking && (
                  <div className="mt-2 text-sm text-zinc-600">
                    <span className="font-medium text-zinc-900">{booking.client_name}</span>
                    {booking.service_name && <><span className="text-zinc-300 mx-1">·</span>{booking.service_name}</>}
                  </div>
                )}
                {wasNotified && (
                  <p className="mt-2 text-xs" style={{ color: G.green }}>✓ Cliente en espera notificado</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail modal */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50 p-4" onClick={() => setSelectedSlotId(null)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-5">
              <div>
                <h2 className="font-bold text-gray-900 text-lg">
                  {fmtTime(selectedSlot.start_time)} – {fmtTime(selectedSlot.end_time)}
                </h2>
                <p className="text-sm text-zinc-500 mt-0.5">{fmtDate(selectedSlot.start_time)}</p>
                <div className="mt-1 flex gap-2 flex-wrap">
                  <StatusBadge status={selectedBooking?.status ?? "FREE"} />
                  {selectedWaitlist && <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: "#fef3c7", color: "#92400e" }}>🔔 1 en espera</span>}
                </div>
              </div>
              <button onClick={() => setSelectedSlotId(null)} className="text-zinc-400 hover:text-zinc-600 text-xl leading-none">✕</button>
            </div>

            {selectedBooking && (
              <div className="space-y-3 mb-5">
                {[
                  { label: "Cliente", val: selectedBooking.client_name },
                  { label: "Email", val: selectedBooking.client_email },
                  { label: "Teléfono", val: selectedBooking.client_phone ?? "—" },
                  { label: "Servicio", val: selectedBooking.service_name ?? "—" },
                ].map(({ label, val }) => (
                  <div key={label}>
                    <div className="text-xs text-zinc-400 mb-0.5">{label}</div>
                    <div className="text-sm font-medium text-zinc-900">{val}</div>
                  </div>
                ))}
                {selectedBooking.status === "PENDING" && (
                  <div className="rounded-xl p-3" style={{ backgroundColor: "#fef9c3" }}>
                    <p className="text-sm text-yellow-800">⏳ Pago pendiente · Expira en 24hs</p>
                  </div>
                )}
                {selectedWaitlist && (
                  <div className="rounded-xl p-3" style={{ backgroundColor: "#fef3c7" }}>
                    <p className="text-sm font-medium text-amber-800 mb-0.5">🔔 En lista de espera</p>
                    <p className="text-sm text-amber-700">{selectedWaitlist.client_name} · {selectedWaitlist.client_email}</p>
                  </div>
                )}
              </div>
            )}

            {selectedWaitlist
              ? (
                <button
                  onClick={() => handleNotifyWaitlist(selectedWaitlist)}
                  disabled={!!loadingId}
                  className="w-full py-3 rounded-xl text-white font-medium text-sm disabled:opacity-50"
                  style={{ backgroundColor: "#dc2626" }}>
                  {loadingId ? "..." : "Cancelar y notificar al siguiente →"}
                </button>
              )
              : selectedBooking && (
                <button
                  onClick={() => handleCancel(selectedBooking.id)}
                  disabled={!!loadingId}
                  className="w-full py-3 rounded-xl text-white font-medium text-sm disabled:opacity-50"
                  style={{ backgroundColor: "#dc2626" }}>
                  {loadingId ? "..." : "Cancelar turno"}
                </button>
              )
            }
            <button onClick={() => setSelectedSlotId(null)} className="w-full py-2.5 rounded-xl text-zinc-500 text-sm mt-2">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
