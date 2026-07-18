"use client";

import type { Booking } from "@/types/database";
import { formatSlotDateTime, formatSlotTime } from "@/lib/utils/format-date";
import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

type Counts = { confirmed: number; pending: number; cancelled: number };
export type StatusFilter = "" | "CONFIRMED" | "PENDING" | "CANCELLED";

type TurnosSectionContextValue = {
  counts: Counts; bookings: Booking[]; statusFilter: StatusFilter;
  setStatusFilter: (v: StatusFilter) => void; searchQuery: string;
  setSearchQuery: (v: string) => void; detailBooking: Booking | null;
  setDetailBooking: (b: Booking | null) => void; filteredBookings: Booking[];
};

const TurnosSectionContext = createContext<TurnosSectionContextValue | null>(null);

function useTurnosSection() {
  const ctx = useContext(TurnosSectionContext);
  if (!ctx) throw new Error("useTurnosSection must be used within TurnosSectionProvider");
  return ctx;
}

const STATUS_LABELS: Record<string, string> = { CONFIRMED: "Confirmado", PENDING: "Pendiente", CANCELLED: "Cancelado" };

export function TurnosSectionProvider({ counts, bookings, children }: { counts: Counts; bookings: Booking[]; children: ReactNode }) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);

  const filteredBookings = useMemo(() => {
    let list = bookings;
    if (statusFilter) list = list.filter(b => b.status === statusFilter);
    const q = searchQuery.trim().toLowerCase();
    if (q) list = list.filter(b => b.client_name.toLowerCase().includes(q) || b.client_email.toLowerCase().includes(q));
    return list;
  }, [bookings, statusFilter, searchQuery]);

  const value = useMemo<TurnosSectionContextValue>(
    () => ({ counts, bookings, statusFilter, setStatusFilter, searchQuery, setSearchQuery, detailBooking, setDetailBooking, filteredBookings }),
    [counts, bookings, statusFilter, searchQuery, detailBooking, filteredBookings]
  );

  return <TurnosSectionContext.Provider value={value}>{children}</TurnosSectionContext.Provider>;
}

function BookingDetailModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const slotStart = booking.slot?.start_time;
  const expiresAt = booking.expires_at;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose} role="dialog" aria-modal="true">
      <div className="max-h-[90vh] w-full max-w-md overflow-auto rounded-2xl border border-edge bg-surface-2 p-6 shadow-xl shadow-black/40" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-ink">Detalle del turno</h3>
          <button type="button" onClick={onClose} className="rounded p-1 text-faint hover:text-ink text-xl leading-none">×</button>
        </div>
        <dl className="space-y-4">
          {[
            { label: "Cliente", val: booking.client_name },
            { label: "Email", val: booking.client_email },
            { label: "Teléfono", val: booking.client_phone ?? "—" },
            { label: "Fecha y hora", val: slotStart ? `${formatSlotDateTime(slotStart)}${booking.slot?.end_time ? ` a ${formatSlotTime(booking.slot.end_time)}` : ""}` : "—" },
          ].map(({ label, val }) => (
            <div key={label}>
              <dt className="text-sm font-medium text-muted">{label}</dt>
              <dd className="mt-0.5 text-ink">{val}</dd>
            </div>
          ))}
          <div>
            <dt className="text-sm font-medium text-muted">Estado</dt>
            <dd className="mt-0.5">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${booking.status === "CONFIRMED" ? "bg-accent/10 text-accent" : booking.status === "PENDING" ? "bg-warn/10 text-warn" : "bg-white/5 text-muted"}`}>
                {STATUS_LABELS[booking.status] ?? booking.status}
              </span>
            </dd>
          </div>
          {booking.status === "PENDING" && expiresAt && (
            <div>
              <dt className="text-sm font-medium text-muted">Vence</dt>
              <dd className="mt-0.5 text-warn">{formatSlotDateTime(expiresAt)}</dd>
            </div>
          )}
        </dl>
        <div className="mt-6 flex justify-end">
          <button type="button" onClick={onClose} className="rounded-xl bg-ink px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-accent">Cerrar</button>
        </div>
      </div>
    </div>
  );
}

export function TurnosSummaryCards() {
  const { counts, statusFilter, setStatusFilter } = useTurnosSection();
  const total = counts.confirmed + counts.pending + counts.cancelled;

  return (
    <div className="rounded-2xl border border-edge bg-surface p-6">
      <h2 className="text-lg font-semibold text-ink">Mis turnos</h2>
      <p className="mt-1 text-sm text-muted">Resumen por estado</p>
      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { key: "" as StatusFilter, label: "Todos", val: total, bg: "rgba(255,255,255,0.06)", color: "#d6d6d2", ring: "#8b8b88" },
          { key: "CONFIRMED" as StatusFilter, label: "Confirmados", val: counts.confirmed, bg: "rgba(142,240,184,0.1)", color: "#8ef0b8", ring: "#8ef0b8" },
          { key: "PENDING" as StatusFilter, label: "Pendientes", val: counts.pending, bg: "rgba(240,210,142,0.1)", color: "#f0d28e", ring: "#f0d28e" },
          { key: "CANCELLED" as StatusFilter, label: "Cancelados", val: counts.cancelled, bg: "rgba(255,255,255,0.04)", color: "#8b8b88", ring: "#55554f" },
        ].map(({ key, label, val, bg, color, ring }) => (
          <button key={key} type="button" onClick={() => setStatusFilter(key)}
            className="rounded-xl p-4 text-center transition-all"
            style={{ backgroundColor: bg, outline: statusFilter === key ? `2px solid ${ring}` : "none", outlineOffset: "2px" }}>
            <span className="text-2xl font-bold" style={{ color }}>{val}</span>
            <p className="mt-1 text-sm font-medium" style={{ color }}>{label}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

export function TurnosList() {
  const { bookings, statusFilter, setStatusFilter, searchQuery, setSearchQuery, filteredBookings, detailBooking, setDetailBooking } = useTurnosSection();
  return (
    <section className="rounded-2xl border border-edge bg-surface p-6">
      <h2 className="text-lg font-semibold text-ink">Listado de turnos</h2>
      <p className="mt-1 text-sm text-muted">Buscá y filtrá por estado.</p>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as StatusFilter)}
          className="rounded-xl border border-edge bg-surface-2 px-3 py-2 text-sm text-ink">
          <option value="">Todos los estados</option>
          <option value="CONFIRMED">Confirmados</option>
          <option value="PENDING">Pendientes</option>
          <option value="CANCELLED">Cancelados</option>
        </select>
        <input type="search" placeholder="Buscar por nombre o email..." value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="flex-1 rounded-xl border border-edge bg-white/5 px-3 py-2 text-sm text-ink placeholder-faint sm:max-w-sm" />
      </div>
      <div className="mt-4 overflow-x-auto">
        {filteredBookings.length === 0 ? (
          <p className="rounded-xl bg-white/[0.03] py-12 text-center text-sm text-faint">
            {bookings.length === 0 ? "Aún no tenés turnos." : "Ningún turno coincide con el filtro."}
          </p>
        ) : (
          <table className="w-full min-w-[600px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-edge">
                {["Cliente", "Email", "Teléfono", "Fecha y hora", "Estado", ""].map(h => (
                  <th key={h} className={`pb-3 font-medium text-muted ${h === "" ? "text-right" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map(booking => (
                <tr key={booking.id} className="border-b border-white/5 last:border-0">
                  <td className="py-3 font-medium text-ink">{booking.client_name}</td>
                  <td className="py-3 text-muted">{booking.client_email}</td>
                  <td className="py-3 text-muted">{booking.client_phone || "—"}</td>
                  <td className="py-3 text-muted">{booking.slot?.start_time ? formatSlotDateTime(booking.slot.start_time) : "—"}</td>
                  <td className="py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${booking.status === "CONFIRMED" ? "bg-accent/10 text-accent" : booking.status === "PENDING" ? "bg-warn/10 text-warn" : "bg-white/5 text-muted"}`}>
                      {STATUS_LABELS[booking.status] ?? booking.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button type="button" onClick={() => setDetailBooking(booking)}
                      className="rounded-lg border border-edge px-3 py-1.5 text-xs font-medium text-muted hover:bg-white/5 hover:text-ink">Ver detalle</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {detailBooking && <BookingDetailModal booking={detailBooking} onClose={() => setDetailBooking(null)} />}
    </section>
  );
}
