"use client";

/**
 * app/book/[slug]/BookingCalendar.tsx — Tornu v2
 * Vista cliente: calendario mensual, waitlist, magic link post-booking.
 */

import { createBooking } from "@/lib/actions/booking";
import { joinWaitlist } from "@/lib/actions/waitlist";
import type { Professional } from "@/types/database";
import { useState, useMemo } from "react";

const G = { green: "#1a6b4a", lightGreen: "#e8f2ed", greenText: "#14532d", amber: "#d97706" };

type SlotRow = { id: string; professional_id: string; start_time: string; end_time: string };

type Props = {
  professional: Professional;
  allSlots: SlotRow[];
  bookedSlotIds: string[];
  waitlistSlotIds: string[];
  serviceId: string;
};

type Step = "calendar" | "form" | "success" | "waitlist-form" | "waitlist-success";

function fmtTime(iso: string) { return new Date(iso).toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" }); }
function fmtDateShort(iso: string) { return new Date(iso).toLocaleDateString("es-AR", { weekday: "short", day: "numeric", month: "short" }); }
function toLocalDate(iso: string) { return new Date(iso).toLocaleDateString("es-AR", { timeZone: "America/Argentina/Buenos_Aires" }).split("/").reverse().join("-"); }

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function buildCalendarCells(year: number, month: number) {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDow = first.getDay() === 0 ? 6 : first.getDay() - 1;
  const cells: (number | null)[] = Array(startDow).fill(null);
  for (let d = 1; d <= last.getDate(); d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function BookingCalendar({ professional, allSlots, bookedSlotIds, waitlistSlotIds, serviceId }: Props) {
  const today = new Date();
  const [calYear, setCalYear] = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotRow | null>(null);
  const [step, setStep] = useState<Step>("calendar");
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [wlForm, setWlForm] = useState({ name: "", email: "" });
  const [wlSlot, setWlSlot] = useState<SlotRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [managementToken, setManagementToken] = useState<string | null>(null);
  const [bookedAt, setBookedAt] = useState<{ time: string; date: string } | null>(null);

  const bookedSet = useMemo(() => new Set(bookedSlotIds), [bookedSlotIds]);

  // Agrupar slots por día local
  const slotsByDate = useMemo(() => {
    const map = new Map<string, { free: SlotRow[]; booked: SlotRow[] }>();
    for (const slot of allSlots) {
      const d = toLocalDate(slot.start_time);
      if (!map.has(d)) map.set(d, { free: [], booked: [] });
      if (bookedSet.has(slot.id)) map.get(d)!.booked.push(slot);
      else map.get(d)!.free.push(slot);
    }
    return map;
  }, [allSlots, bookedSet]);

  const calCells = useMemo(() => buildCalendarCells(calYear, calMonth), [calYear, calMonth]);
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const monthName = new Date(calYear, calMonth, 1).toLocaleDateString("es-AR", { month: "long", year: "numeric" });

  function prevMonth() {
    if (calMonth === 0) { setCalYear(y => y - 1); setCalMonth(11); }
    else setCalMonth(m => m - 1);
    setSelectedDay(null); setSelectedSlot(null);
  }
  function nextMonth() {
    if (calMonth === 11) { setCalYear(y => y + 1); setCalMonth(0); }
    else setCalMonth(m => m + 1);
    setSelectedDay(null); setSelectedSlot(null);
  }

  const dayData = selectedDay ? (slotsByDate.get(selectedDay) ?? { free: [], booked: [] }) : null;
  const isDayFull = dayData ? dayData.free.length === 0 && dayData.booked.length > 0 : false;

  async function handleBook() {
    if (!selectedSlot || !form.name || !form.email) return;
    setLoading(true); setError(null);
    const res = await createBooking({
      slotId: selectedSlot.id,
      professionalId: professional.id,
      serviceId,
      clientName: form.name,
      clientEmail: form.email,
      clientPhone: form.phone,
    });
    setLoading(false);
    if (!res.ok) { setError(res.error ?? "Error al reservar."); return; }
    setManagementToken(res.managementToken ?? null);
    setBookedAt({ time: fmtTime(selectedSlot.start_time), date: fmtDateShort(selectedSlot.start_time) });
    setStep("success");
  }

  async function handleJoinWaitlist() {
    if (!wlSlot || !wlForm.name || !wlForm.email) return;
    setLoading(true); setError(null);
    const res = await joinWaitlist({ slotId: wlSlot.id, professionalId: professional.id, clientName: wlForm.name, clientEmail: wlForm.email });
    setLoading(false);
    if (!res.ok) { setError(res.error ?? "Error."); return; }
    setStep("waitlist-success");
  }

  // ── WAITLIST SUCCESS ──────────────────────────────────────────────────────
  if (step === "waitlist-success") {
    return (
      <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: "#fef3c7" }}>
        <div className="text-4xl mb-4">🔔</div>
        <h2 className="text-lg font-bold mb-2 text-amber-900">¡Anotado en lista de espera!</h2>
        <p className="text-sm text-amber-800 mb-5">Te avisamos por email si el turno de las <strong>{wlSlot ? fmtTime(wlSlot.start_time) : ""}</strong> se libera.</p>
        <button onClick={() => { setStep("calendar"); setWlSlot(null); setWlForm({ name: "", email: "" }); }} className="text-sm font-medium" style={{ color: G.greenText }}>Buscar otro horario</button>
      </div>
    );
  }

  // ── WAITLIST FORM ─────────────────────────────────────────────────────────
  if (step === "waitlist-form") {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <button onClick={() => setStep("calendar")} className="text-sm text-zinc-400 mb-4 flex items-center gap-1">← Volver</button>
        <div className="text-2xl mb-2">🔔</div>
        <h2 className="font-bold text-zinc-900 mb-0.5">Lista de espera</h2>
        <p className="text-sm text-zinc-400 mb-5">{wlSlot ? fmtTime(wlSlot.start_time) : ""}</p>
        <div className="space-y-3">
          {[{ key: "name", label: "Nombre *", placeholder: "Tu nombre", type: "text" }, { key: "email", label: "Email *", placeholder: "tu@email.com", type: "email" }].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label className="text-xs font-medium text-zinc-500 mb-1 block">{label}</label>
              <input type={type} placeholder={placeholder} value={wlForm[key as "name" | "email"]}
                onChange={e => setWlForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-zinc-400" />
            </div>
          ))}
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-4 rounded-xl p-3 text-sm" style={{ backgroundColor: "#fef3c7", color: "#92400e" }}>📧 Te avisamos por email si se libera — sin compromiso.</div>
        <button onClick={handleJoinWaitlist} disabled={loading || !wlForm.name || !wlForm.email}
          className="w-full py-3.5 rounded-xl text-white font-medium mt-4 text-sm disabled:opacity-40"
          style={{ backgroundColor: G.amber }}>
          {loading ? "Anotando..." : "Anotarme en lista de espera"}
        </button>
      </div>
    );
  }

  // ── SUCCESS ───────────────────────────────────────────────────────────────
  if (step === "success") {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const manageUrl = managementToken ? `${baseUrl}/manage/${managementToken}` : null;
    return (
      <div className="rounded-2xl p-8 text-center" style={{ backgroundColor: G.lightGreen }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-white text-2xl" style={{ backgroundColor: G.green }}>✓</div>
        <h2 className="text-xl font-bold mb-2" style={{ color: G.greenText }}>¡Turno confirmado!</h2>
        {bookedAt && <p className="text-sm text-zinc-600 mb-0.5"><strong>{bookedAt.time}</strong> · {bookedAt.date}</p>}
        <p className="text-sm text-zinc-600 mb-5">con {professional.name}</p>
        <div className="bg-white rounded-xl p-4 text-sm text-zinc-600 text-left mb-5 space-y-2">
          <p>📧 Email enviado a <strong>{form.email}</strong></p>
          <p>🔗 Incluye link para reprogramar o cancelar tu turno</p>
          <p>🔔 Recordatorio automático 24hs antes</p>
        </div>
        {manageUrl && (
          <a href={manageUrl} className="block w-full py-3 rounded-xl text-white font-medium text-sm mb-3 text-center" style={{ backgroundColor: G.green }}>Gestionar mi turno →</a>
        )}
        <button onClick={() => { setStep("calendar"); setSelectedSlot(null); setSelectedDay(null); setForm({ name: "", email: "", phone: "" }); }} className="text-sm font-medium" style={{ color: G.green }}>Reservar otro turno</button>
      </div>
    );
  }

  // ── FORM ──────────────────────────────────────────────────────────────────
  if (step === "form") {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <button onClick={() => setStep("calendar")} className="text-sm text-zinc-400 mb-4 flex items-center gap-1">← Volver</button>
        <h2 className="font-bold text-zinc-900 mb-0.5">Tus datos</h2>
        {selectedSlot && <p className="text-sm text-zinc-400 mb-5">{fmtTime(selectedSlot.start_time)} · {fmtDateShort(selectedSlot.start_time)}</p>}
        <div className="space-y-3">
          {[
            { key: "name", label: "Nombre completo *", placeholder: "Tu nombre", type: "text" },
            { key: "email", label: "Email *", placeholder: "tu@email.com", type: "email" },
            { key: "phone", label: "Teléfono (opcional)", placeholder: "11-xxxx-xxxx", type: "tel" },
          ].map(({ key, label, placeholder, type }) => (
            <div key={key}>
              <label className="text-xs font-medium text-zinc-500 mb-1 block">{label}</label>
              <input type={type} placeholder={placeholder} value={form[key as keyof typeof form]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-zinc-400" />
            </div>
          ))}
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <div className="mt-4 rounded-xl p-4 text-sm" style={{ backgroundColor: G.lightGreen, color: G.greenText }}>
          💡 Recibirás un link por email para reprogramar o cancelar — sin crear cuenta.
        </div>
        <button onClick={handleBook} disabled={loading || !form.name || !form.email}
          className="w-full py-3.5 rounded-xl text-white font-medium mt-4 text-sm disabled:opacity-40"
          style={{ backgroundColor: G.green }}>
          {loading ? "Reservando..." : "Confirmar turno"}
        </button>
      </div>
    );
  }

  // ── CALENDAR ──────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Monthly calendar */}
      <div className="rounded-2xl bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-zinc-900 text-sm capitalize">{monthName}</h2>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="text-zinc-400 hover:text-zinc-700 text-lg leading-none px-1">‹</button>
            <button onClick={nextMonth} className="text-zinc-400 hover:text-zinc-700 text-lg leading-none px-1">›</button>
          </div>
        </div>

        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map(h => <div key={h} className="text-center text-xs text-zinc-400 font-medium py-1">{h}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {calCells.map((day, idx) => {
            if (!day) return <div key={idx} />;
            const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const data = slotsByDate.get(dateStr);
            const hasFree = (data?.free.length ?? 0) > 0;
            const isFull = !hasFree && (data?.booked.length ?? 0) > 0;
            const isPast = dateStr < todayStr;
            const isToday = dateStr === todayStr;
            const isSelected = selectedDay === dateStr;
            const clickable = !isPast && (hasFree || isFull);

            const cellStyle = isSelected ? { backgroundColor: G.green, color: "white" }
              : hasFree ? { backgroundColor: G.lightGreen, color: G.greenText }
              : isFull ? { backgroundColor: "#fef3c7", color: "#92400e" }
              : { color: isPast ? "#d1d5db" : "#9ca3af" };

            return (
              <button key={idx} disabled={!clickable}
                onClick={() => { setSelectedDay(dateStr); setSelectedSlot(null); }}
                className="flex flex-col items-center justify-center rounded-xl py-1.5 transition-all disabled:cursor-default"
                style={cellStyle}>
                <span className={`text-sm font-medium leading-tight ${isToday && !isSelected ? "underline decoration-2" : ""}`}>{day}</span>
                {hasFree
                  ? <span className="text-xs leading-tight opacity-85">{data!.free.length} slot{data!.free.length !== 1 ? "s" : ""}</span>
                  : isFull
                  ? <span className="text-xs leading-tight">{isSelected ? "Completo" : "🔔"}</span>
                  : <span className="text-xs opacity-0">·</span>
                }
              </button>
            );
          })}
        </div>
        {slotsByDate.size > 0 && (
          <p className="text-xs text-amber-700 mt-3 text-center">🔔 Días amarillos = lista de espera disponible</p>
        )}
      </div>

      {/* Slots for selected day */}
      {selectedDay && !isDayFull && (
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs font-medium text-zinc-400 mb-3">Horarios disponibles</p>
          {(dayData?.free.length ?? 0) === 0
            ? <p className="text-center text-sm text-zinc-400 py-4">Sin horarios libres</p>
            : <div className="grid grid-cols-3 gap-2">
                {dayData!.free.map(slot => (
                  <button key={slot.id} onClick={() => setSelectedSlot(slot)}
                    className="py-3 rounded-xl text-sm font-medium transition-all"
                    style={selectedSlot?.id === slot.id ? { backgroundColor: G.green, color: "white" } : { border: "1px solid #e5e7eb", color: "#374151" }}>
                    {fmtTime(slot.start_time)}
                  </button>
                ))}
              </div>
          }
          {selectedSlot && (
            <button onClick={() => setStep("form")} className="w-full py-3.5 rounded-xl text-white font-medium mt-4 text-sm" style={{ backgroundColor: G.green }}>
              Continuar con {fmtTime(selectedSlot.start_time)} →
            </button>
          )}
        </div>
      )}

      {/* Full day - waitlist */}
      {selectedDay && isDayFull && (
        <div className="space-y-2">
          <div className="rounded-2xl p-4" style={{ backgroundColor: "#fef3c7" }}>
            <p className="text-sm font-medium text-amber-900 mb-0.5">🔔 Día completo</p>
            <p className="text-sm text-amber-700">Anotate en lista de espera para un horario específico:</p>
          </div>
          {dayData!.booked.map(slot => {
            const inWL = waitlistSlotIds.includes(slot.id);
            return (
              <div key={slot.id} className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-zinc-900">{fmtTime(slot.start_time)} – {fmtTime(slot.end_time)}</span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: "#f3f4f6", color: "#6b7280" }}>Ocupado</span>
                </div>
                {inWL
                  ? <span className="text-xs px-3 py-1.5 rounded-lg font-medium" style={{ backgroundColor: "#fef3c7", color: "#92400e" }}>✓ En espera</span>
                  : <button onClick={() => { setWlSlot(slot); setWlForm({ name: "", email: "" }); setError(null); setStep("waitlist-form"); }}
                      className="text-xs px-3 py-1.5 rounded-lg font-medium text-white"
                      style={{ backgroundColor: G.amber }}>🔔 Anotarme</button>
                }
              </div>
            );
          })}
        </div>
      )}

      {!selectedDay && (
        <div className="bg-white rounded-2xl p-5 text-center text-sm text-zinc-400" style={{ border: "1px dashed #d1d5db" }}>Seleccioná un día del calendario</div>
      )}
    </div>
  );
}
