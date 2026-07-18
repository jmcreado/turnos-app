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

const ACCENT = "#8ef0b8";

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
    CONFIRMED: { label: "Confirmado", bg: "rgba(142,240,184,0.1)", color: "#8ef0b8" },
    PENDING: { label: "Pago pendiente", bg: "rgba(240,210,142,0.1)", color: "#f0d28e" },
    BLOCKED: { label: "Bloqueado", bg: "rgba(240,160,142,0.1)", color: "#f0a08e" },
    FREE: { label: "Libre", bg: "rgba(255,255,255,0.06)", color: "#8b8b88" },
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
      <div className="rounded-2xl border border-edge bg-surface p-8 text-center shadow-sm">
        <p className="text-muted">No hay slots para las próximas 4 semanas. Configurá tu disponibilidad arriba.</p>
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
    <div className="rounded-2xl border border-edge bg-surface shadow-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-accent/25 bg-accent/[0.07] p-5 text-ink">
        <p className="mb-1 text-xs uppercase tracking-wider text-accent">Agenda</p>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => { setWeekIdx(i => Math.max(0, i - 1)); setSelectedDay(null); }}
            disabled={weekIdx === 0}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-edge bg-white/5 text-lg transition-opacity hover:bg-white/10 disabled:opacity-30">‹</button>
          <span className="text-sm font-medium">{weekKeys[weekIdx] ? weekLabel(weekKeys[weekIdx]!) : "—"}</span>
          <button
            onClick={() => { setWeekIdx(i => Math.min(weekKeys.length - 1, i + 1)); setSelectedDay(null); }}
            disabled={weekIdx >= weekKeys.length - 1}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-edge bg-white/5 text-lg transition-opacity hover:bg-white/10 disabled:opacity-30">›</button>
        </div>
        <div className="flex gap-2">
          {[{ label: "Confirmados", val: confirmed }, { label: "Pendientes", val: pending }, { label: "Libres", val: free }].map(({ label, val }) => (
            <div key={label} className="flex-1 rounded-xl bg-white/5 p-3 text-center">
              <div className="text-2xl font-bold text-accent">{val}</div>
              <div className="mt-0.5 text-xs text-muted">{label}</div>
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
                style={isSelected ? { backgroundColor: "#f5f5f4", color: "#0a0a0a" } : { backgroundColor: "rgba(255,255,255,0.06)", color: "#8b8b88" }}>
                {dayLabel(d)}
                {count > 0 && (
                  <span className="text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold"
                    style={isSelected ? { backgroundColor: "rgba(10,10,10,0.15)" } : { backgroundColor: "rgba(142,240,184,0.12)", color: ACCENT }}>
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
            <p className="py-8 text-center text-sm text-faint">Sin slots este día</p>
          )}
          {daySlots.map(slot => {
            const booking = bookingsBySlot[slot.id];
            const wl = waitlistBySlot[slot.id];
            const slotStatus = booking ? booking.status : slot.is_blocked ? "BLOCKED" : "FREE";
            const isLoading = loadingId === slot.id || loadingId === booking?.id;
            const wasNotified = notifiedSlots.has(slot.id);

            return (
              <div key={slot.id} className="rounded-xl border border-white/5 bg-white/5 p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-ink">
                      {fmtTime(slot.start_time)} – {fmtTime(slot.end_time)}
                    </span>
                    <StatusBadge status={slotStatus} />
                    {wl && !wasNotified && (
                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: "rgba(240,210,142,0.12)", color: "#f0d28e" }}>🔔 1 en espera</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {slotStatus === "FREE" && (
                      <button onClick={() => handleBlockToggle(slot)} disabled={isLoading}
                        className="text-xs px-3 py-1.5 rounded-lg border border-edge text-muted hover:bg-white/10 disabled:opacity-50">
                        {isLoading ? "..." : "Bloquear"}
                      </button>
                    )}
                    {slotStatus === "BLOCKED" && (
                      <button onClick={() => handleBlockToggle(slot)} disabled={isLoading}
                        className="text-xs px-3 py-1.5 rounded-lg border border-edge text-muted hover:bg-white/10 disabled:opacity-50">
                        {isLoading ? "..." : "Desbloquear"}
                      </button>
                    )}
                    {(slotStatus === "CONFIRMED" || slotStatus === "PENDING") && (
                      <button onClick={() => setSelectedSlotId(slot.id)} className="rounded-lg bg-ink px-3 py-1.5 text-xs text-background transition-colors hover:bg-accent">Ver detalle</button>
                    )}
                  </div>
                </div>
                {booking && (
                  <div className="mt-2 text-sm text-muted">
                    <span className="font-medium text-ink">{booking.client_name}</span>
                    {booking.service_name && <><span className="text-faint mx-1">·</span>{booking.service_name}</>}
                  </div>
                )}
                {wasNotified && (
                  <p className="mt-2 text-xs text-accent">✓ Cliente en espera notificado</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Detail modal */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-black/70 flex items-end justify-center z-50 p-4" onClick={() => setSelectedSlotId(null)}>
          <div className="rounded-2xl border border-edge bg-surface-2 w-full max-w-md p-6 shadow-xl shadow-black/40" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-5">
              <div>
                <h2 className="font-bold text-ink text-lg">
                  {fmtTime(selectedSlot.start_time)} – {fmtTime(selectedSlot.end_time)}
                </h2>
                <p className="text-sm text-muted mt-0.5">{fmtDate(selectedSlot.start_time)}</p>
                <div className="mt-1 flex gap-2 flex-wrap">
                  <StatusBadge status={selectedBooking?.status ?? "FREE"} />
                  {selectedWaitlist && <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: "rgba(240,210,142,0.12)", color: "#f0d28e" }}>🔔 1 en espera</span>}
                </div>
              </div>
              <button onClick={() => setSelectedSlotId(null)} className="text-faint hover:text-muted text-xl leading-none">✕</button>
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
                    <div className="text-xs text-faint mb-0.5">{label}</div>
                    <div className="text-sm font-medium text-ink">{val}</div>
                  </div>
                ))}
                {selectedBooking.status === "PENDING" && (
                  <div className="rounded-xl border border-warn/25 bg-warn/10 p-3">
                    <p className="text-sm text-warn">⏳ Pago pendiente · Expira en 24hs</p>
                  </div>
                )}
                {selectedWaitlist && (
                  <div className="rounded-xl border border-warn/25 bg-warn/10 p-3">
                    <p className="text-sm font-medium text-warn mb-0.5">🔔 En lista de espera</p>
                    <p className="text-sm text-warn">{selectedWaitlist.client_name} · {selectedWaitlist.client_email}</p>
                  </div>
                )}
              </div>
            )}

            {selectedWaitlist
              ? (
                <button
                  onClick={() => handleNotifyWaitlist(selectedWaitlist)}
                  disabled={!!loadingId}
                  className="w-full rounded-xl border border-danger/40 bg-danger/10 py-3 text-sm font-medium text-danger transition-colors hover:bg-danger/20 disabled:opacity-50">
                  {loadingId ? "..." : "Cancelar y notificar al siguiente →"}
                </button>
              )
              : selectedBooking && (
                <button
                  onClick={() => handleCancel(selectedBooking.id)}
                  disabled={!!loadingId}
                  className="w-full rounded-xl border border-danger/40 bg-danger/10 py-3 text-sm font-medium text-danger transition-colors hover:bg-danger/20 disabled:opacity-50">
                  {loadingId ? "..." : "Cancelar turno"}
                </button>
              )
            }
            <button onClick={() => setSelectedSlotId(null)} className="w-full py-2.5 rounded-xl text-muted text-sm mt-2">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
