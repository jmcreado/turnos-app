"use client";

/**
 * app/manage/[token]/ManageBooking.tsx — Tornu v2
 * Componente cliente para gestión de turno via magic link.
 */

import { cancelBookingByToken, rescheduleBookingByToken } from "@/lib/actions/booking";
import { useState } from "react";

const G = { green: "#1a6b4a", lightGreen: "#e8f2ed", greenText: "#14532d" };

type SlotOption = { id: string; start_time: string; end_time: string };

type BookingData = {
  id: string;
  professional_id: string;
  slot_id: string;
  management_token: string;
  client_name: string;
  client_email: string;
  status: "CONFIRMED" | "PENDING" | "CANCELLED";
  slot: { start_time: string; end_time: string } | null;
  service: { name: string; price: number; duration_minutes: number } | null;
  professional: { name: string; slug: string | null } | null;
};

type Props = {
  booking: BookingData;
  availableSlots: SlotOption[];
};

type Step = "view" | "reschedule" | "cancelled" | "rescheduled";

function fmtTime(iso: string) { return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }); }
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
}
function toLocalDateKey(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short", weekday: "short" });
}

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function groupSlotsByDate(slots: SlotOption[]): Map<string, SlotOption[]> {
  const map = new Map<string, SlotOption[]>();
  for (const slot of slots) {
    const key = new Date(slot.start_time).toISOString().slice(0, 10);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(slot);
  }
  return map;
}

export function ManageBooking({ booking, availableSlots }: Props) {
  const [step, setStep] = useState<Step>(booking.status === "CANCELLED" ? "cancelled" : "view");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotOption | null>(null);
  const [newSlotInfo, setNewSlotInfo] = useState<{ start_time: string } | null>(null);

  const slotsByDate = groupSlotsByDate(availableSlots);
  const dateKeys = Array.from(slotsByDate.keys()).sort();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  async function handleCancel() {
    if (!confirm("¿Seguro que querés cancelar tu turno?")) return;
    setLoading(true); setError(null);
    const res = await cancelBookingByToken(booking.management_token);
    setLoading(false);
    if (!res.ok) { setError(res.error ?? "Error al cancelar."); return; }
    setStep("cancelled");
  }

  async function handleReschedule() {
    if (!selectedSlot) return;
    setLoading(true); setError(null);
    const res = await rescheduleBookingByToken(booking.management_token, selectedSlot.id);
    setLoading(false);
    if (!res.ok) { setError(res.error ?? "Error al reprogramar."); return; }
    setNewSlotInfo({ start_time: selectedSlot.start_time });
    setStep("rescheduled");
  }

  // ── CANCELLED ─────────────────────────────────────────────────────────────
  if (step === "cancelled") {
    return (
      <div className="rounded-2xl bg-white p-6 shadow-sm text-center">
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl" style={{ backgroundColor: "#fee2e2" }}>✕</div>
        <h2 className="font-bold text-zinc-900 text-lg mb-2">Turno cancelado</h2>
        <p className="text-sm text-zinc-500 mb-6">Tu turno fue cancelado exitosamente.</p>
        {booking.professional?.slug && (
          <a href={`/book/${booking.professional.slug}`} className="block w-full py-3 rounded-xl text-white font-medium text-sm text-center" style={{ backgroundColor: G.green }}>Reservar nuevo turno</a>
        )}
      </div>
    );
  }

  // ── RESCHEDULED ───────────────────────────────────────────────────────────
  if (step === "rescheduled") {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: G.lightGreen }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl" style={{ backgroundColor: G.green }}>✓</div>
        <h2 className="text-xl font-bold mb-2" style={{ color: G.greenText }}>¡Turno reprogramado!</h2>
        {newSlotInfo && <p className="text-sm text-zinc-600 mb-4"><strong>{fmtDateTime(newSlotInfo.start_time)}</strong></p>}
        <p className="text-sm text-zinc-500">con {booking.professional?.name}</p>
      </div>
    );
  }

  // ── RESCHEDULE FLOW ───────────────────────────────────────────────────────
  if (step === "reschedule") {
    const dateSlotsForSelected = selectedDate ? (slotsByDate.get(selectedDate) ?? []) : [];
    return (
      <div className="space-y-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <button onClick={() => { setStep("view"); setSelectedSlot(null); setSelectedDate(null); }} className="text-sm text-zinc-400 mb-3 flex items-center gap-1">← Volver a mi turno</button>
          <h2 className="font-bold text-zinc-900 mb-0.5">Reprogramar turno</h2>
          {booking.slot && <p className="text-sm text-zinc-400">Actual: {fmtDateTime(booking.slot.start_time)}</p>}
        </div>

        {availableSlots.length === 0 ? (
          <div className="rounded-2xl bg-white p-8 text-center text-sm text-zinc-400 shadow-sm">Sin horarios disponibles para reprogramar.</div>
        ) : (
          <>
            {/* Date selector */}
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-xs font-medium text-zinc-400 mb-3">Elegí un día</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {dateKeys.map(d => {
                  const label = new Date(d + "T12:00:00").toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" });
                  const isSelected = selectedDate === d;
                  return (
                    <button key={d} onClick={() => { setSelectedDate(d); setSelectedSlot(null); }}
                      className="px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
                      style={isSelected ? { backgroundColor: G.green, color: "white" } : { backgroundColor: "#f3f4f6", color: "#4b5563" }}>
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {selectedDate && (
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-xs font-medium text-zinc-400 mb-3">Horarios disponibles</p>
                <div className="grid grid-cols-3 gap-2">
                  {dateSlotsForSelected.map(slot => (
                    <button key={slot.id} onClick={() => setSelectedSlot(slot)}
                      className="py-3 rounded-xl text-sm font-medium transition-all"
                      style={selectedSlot?.id === slot.id ? { backgroundColor: G.green, color: "white" } : { border: "1px solid #e5e7eb", color: "#374151" }}>
                      {fmtTime(slot.start_time)}
                    </button>
                  ))}
                </div>
                {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
                {selectedSlot && (
                  <button onClick={handleReschedule} disabled={loading}
                    className="w-full py-3.5 rounded-xl text-white font-medium mt-4 text-sm disabled:opacity-50"
                    style={{ backgroundColor: G.green }}>
                    {loading ? "Reprogramando..." : `Confirmar → ${fmtTime(selectedSlot.start_time)}`}
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // ── VIEW ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Branding */}
      <div className="flex items-center gap-2">
        <span className="text-xs px-2 py-1 rounded-lg text-white font-medium" style={{ backgroundColor: G.green }}>Tornu</span>
        <span className="text-xs text-zinc-400">Gestión de turno</span>
      </div>

      {/* Booking card */}
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="font-bold text-zinc-900 text-lg mb-4">Mi turno</h1>

        {booking.status === "CONFIRMED" || booking.status === "PENDING" ? (
          <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: G.lightGreen }}>
            <p className="text-sm font-bold mb-1" style={{ color: G.greenText }}>{booking.professional?.name}</p>
            {booking.service && <p className="text-sm text-zinc-600 mb-0.5">{booking.service.name}</p>}
            {booking.slot && <p className="text-sm font-medium text-zinc-900">{fmtDateTime(booking.slot.start_time)}</p>}
            <div className="mt-2">
              {booking.status === "CONFIRMED"
                ? <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#dcfce7", color: "#15803d" }}>✓ Confirmado</span>
                : <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: "#fef9c3", color: "#854d0e" }}>⏳ Pago pendiente</span>
              }
            </div>
          </div>
        ) : (
          <div className="rounded-xl p-4 mb-5" style={{ backgroundColor: "#fee2e2" }}>
            <p className="text-sm text-red-700 font-medium">Este turno fue cancelado.</p>
          </div>
        )}

        <div className="space-y-2 mb-5 text-sm text-zinc-600">
          <p>👤 <strong>{booking.client_name}</strong></p>
          <p>📧 {booking.client_email}</p>
        </div>

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        {(booking.status === "CONFIRMED" || booking.status === "PENDING") && (
          <div className="space-y-2">
            <button onClick={() => { setStep("reschedule"); setError(null); }}
              className="w-full py-3 rounded-xl font-medium text-sm border-2"
              style={{ color: G.green, borderColor: G.green }}>Reprogramar turno</button>
            <button onClick={handleCancel} disabled={loading}
              className="w-full py-3 rounded-xl text-white font-medium text-sm disabled:opacity-50"
              style={{ backgroundColor: "#dc2626" }}>
              {loading ? "Cancelando..." : "Cancelar turno"}
            </button>
          </div>
        )}

        {booking.status === "CANCELLED" && booking.professional?.slug && (
          <a href={`/book/${booking.professional.slug}`} className="block w-full py-3 rounded-xl text-white font-medium text-sm text-center" style={{ backgroundColor: G.green }}>Reservar nuevo turno</a>
        )}
      </div>
    </div>
  );
}
