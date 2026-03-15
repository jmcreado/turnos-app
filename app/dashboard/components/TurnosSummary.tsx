"use client";

import type { Booking } from "@/types/database";
import {
  formatSlotDateTime,
  formatSlotTime,
} from "@/lib/utils/format-date";
import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type Counts = {
  confirmed: number;
  pending: number;
  cancelled: number;
};

export type StatusFilter = "" | "CONFIRMED" | "PENDING" | "CANCELLED";

type TurnosSectionContextValue = {
  counts: Counts;
  bookings: Booking[];
  statusFilter: StatusFilter;
  setStatusFilter: (v: StatusFilter) => void;
  searchQuery: string;
  setSearchQuery: (v: string) => void;
  detailBooking: Booking | null;
  setDetailBooking: (b: Booking | null) => void;
  filteredBookings: Booking[];
};

const TurnosSectionContext = createContext<TurnosSectionContextValue | null>(
  null
);

function useTurnosSection() {
  const ctx = useContext(TurnosSectionContext);
  if (!ctx)
    throw new Error("useTurnosSection must be used within TurnosSectionProvider");
  return ctx;
}

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: "Confirmado",
  PENDING: "Pendiente",
  CANCELLED: "Cancelado",
};

type TurnosSectionProviderProps = {
  counts: Counts;
  bookings: Booking[];
  children: ReactNode;
};

export function TurnosSectionProvider({
  counts,
  bookings,
  children,
}: TurnosSectionProviderProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [detailBooking, setDetailBooking] = useState<Booking | null>(null);

  const filteredBookings = useMemo(() => {
    let list = bookings;
    if (statusFilter) {
      list = list.filter((b) => b.status === statusFilter);
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (b) =>
          b.client_name.toLowerCase().includes(q) ||
          b.client_email.toLowerCase().includes(q)
      );
    }
    return list;
  }, [bookings, statusFilter, searchQuery]);

  const value = useMemo<TurnosSectionContextValue>(
    () => ({
      counts,
      bookings,
      statusFilter,
      setStatusFilter,
      searchQuery,
      setSearchQuery,
      detailBooking,
      setDetailBooking,
      filteredBookings,
    }),
    [
      counts,
      bookings,
      statusFilter,
      searchQuery,
      detailBooking,
      filteredBookings,
    ]
  );

  return (
    <TurnosSectionContext.Provider value={value}>
      {children}
    </TurnosSectionContext.Provider>
  );
}

function BookingDetailModal({
  booking,
  onClose,
}: {
  booking: Booking;
  onClose: () => void;
}) {
  const slotStart = booking.slot?.start_time;
  const expiresAt = booking.expires_at;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="max-h-[90vh] w-full max-w-md overflow-auto rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 id="modal-title" className="text-lg font-semibold text-zinc-900">
            Detalle del turno
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
            aria-label="Cerrar"
          >
            <span className="text-xl leading-none">×</span>
          </button>
        </div>

        <dl className="mt-6 space-y-4">
          <div>
            <dt className="text-sm font-medium text-zinc-500">Cliente</dt>
            <dd className="mt-0.5 text-zinc-900">{booking.client_name}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-zinc-500">Email</dt>
            <dd className="mt-0.5 text-zinc-900">{booking.client_email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-zinc-500">Teléfono</dt>
            <dd className="mt-0.5 text-zinc-900">
              {booking.client_phone || "—"}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-zinc-500">Fecha y hora</dt>
            <dd className="mt-0.5 text-zinc-900">
              {slotStart ? formatSlotDateTime(slotStart) : "—"}
              {booking.slot?.end_time && (
                <span className="text-zinc-500">
                  {" "}
                  a {formatSlotTime(booking.slot.end_time)}
                </span>
              )}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-zinc-500">Estado</dt>
            <dd className="mt-0.5">
              <span
                className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  booking.status === "CONFIRMED"
                    ? "bg-emerald-100 text-emerald-800"
                    : booking.status === "PENDING"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-zinc-100 text-zinc-600"
                }`}
              >
                {STATUS_LABELS[booking.status] ?? booking.status}
              </span>
            </dd>
          </div>
          {booking.status === "PENDING" && expiresAt && (
            <div>
              <dt className="text-sm font-medium text-zinc-500">Vence</dt>
              <dd className="mt-0.5 text-amber-700">
                {formatSlotDateTime(expiresAt)}
              </dd>
            </div>
          )}
        </dl>

        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

/** Solo las 4 tarjetas de resumen (para la segunda fila, columna derecha). */
export function TurnosSummaryCards() {
  const { counts, statusFilter, setStatusFilter } = useTurnosSection();

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">Mis turnos</h2>
      <p className="mt-1 text-sm text-zinc-500">Resumen por estado</p>
      <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <button
          type="button"
          onClick={() => setStatusFilter("")}
          className={`rounded-xl p-4 text-center transition-colors ${
            statusFilter === ""
              ? "ring-2 ring-zinc-900 ring-offset-2"
              : "hover:opacity-90"
          } bg-zinc-100`}
        >
          <span className="text-2xl font-bold text-zinc-700">
            {counts.confirmed + counts.pending + counts.cancelled}
          </span>
          <p className="mt-1 text-sm font-medium text-zinc-700">Todos</p>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("CONFIRMED")}
          className={`rounded-xl p-4 text-center transition-colors ${
            statusFilter === "CONFIRMED"
              ? "ring-2 ring-emerald-600 ring-offset-2"
              : "hover:opacity-90"
          } bg-emerald-50`}
        >
          <span className="text-2xl font-bold text-emerald-700">
            {counts.confirmed}
          </span>
          <p className="mt-1 text-sm font-medium text-emerald-800">
            Confirmados
          </p>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("PENDING")}
          className={`rounded-xl p-4 text-center transition-colors ${
            statusFilter === "PENDING"
              ? "ring-2 ring-amber-500 ring-offset-2"
              : "hover:opacity-90"
          } bg-amber-50`}
        >
          <span className="text-2xl font-bold text-amber-700">
            {counts.pending}
          </span>
          <p className="mt-1 text-sm font-medium text-amber-800">
            Pendientes
          </p>
        </button>
        <button
          type="button"
          onClick={() => setStatusFilter("CANCELLED")}
          className={`rounded-xl p-4 text-center transition-colors ${
            statusFilter === "CANCELLED"
              ? "ring-2 ring-zinc-500 ring-offset-2"
              : "hover:opacity-90"
          } bg-zinc-100`}
        >
          <span className="text-2xl font-bold text-zinc-600">
            {counts.cancelled}
          </span>
          <p className="mt-1 text-sm font-medium text-zinc-700">Cancelados</p>
        </button>
      </div>
    </div>
  );
}

/** Lista completa con buscador, filtro y tabla (ancho completo). */
export function TurnosList() {
  const {
    bookings,
    statusFilter,
    setStatusFilter,
    searchQuery,
    setSearchQuery,
    filteredBookings,
    detailBooking,
    setDetailBooking,
  } = useTurnosSection();

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-zinc-900">Listado de turnos</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Buscá y filtrá por estado. Clic en &quot;Ver detalle&quot; para más información.
      </p>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <label
            htmlFor="status-filter"
            className="text-sm font-medium text-zinc-600"
          >
            Estado:
          </label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as StatusFilter)
            }
            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
          >
            <option value="">Todos</option>
            <option value="CONFIRMED">Confirmados</option>
            <option value="PENDING">Pendientes</option>
            <option value="CANCELLED">Cancelados</option>
          </select>
        </div>
        <div className="flex-1">
          <input
            type="search"
            placeholder="Buscar por nombre o email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 sm:max-w-sm"
          />
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        {filteredBookings.length === 0 ? (
          <p className="rounded-lg border border-zinc-100 bg-zinc-50/50 py-12 text-center text-sm text-zinc-500">
            {bookings.length === 0
              ? "Aún no tenés turnos."
              : "Ningún turno coincide con el filtro o la búsqueda."}
          </p>
        ) : (
          <table className="w-full min-w-[600px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-200">
                <th className="pb-3 font-medium text-zinc-600">Cliente</th>
                <th className="pb-3 font-medium text-zinc-600">Email</th>
                <th className="pb-3 font-medium text-zinc-600">Teléfono</th>
                <th className="pb-3 font-medium text-zinc-600">Fecha y hora</th>
                <th className="pb-3 font-medium text-zinc-600">Estado</th>
                <th className="pb-3 font-medium text-zinc-600 text-right">
                  Acción
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.map((booking) => (
                <tr
                  key={booking.id}
                  className="border-b border-zinc-100 last:border-0"
                >
                  <td className="py-3 font-medium text-zinc-900">
                    {booking.client_name}
                  </td>
                  <td className="py-3 text-zinc-600">
                    {booking.client_email}
                  </td>
                  <td className="py-3 text-zinc-600">
                    {booking.client_phone || "—"}
                  </td>
                  <td className="py-3 text-zinc-600">
                    {booking.slot?.start_time
                      ? formatSlotDateTime(booking.slot.start_time)
                      : "—"}
                  </td>
                  <td className="py-3">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        booking.status === "CONFIRMED"
                          ? "bg-emerald-100 text-emerald-800"
                          : booking.status === "PENDING"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      {STATUS_LABELS[booking.status] ?? booking.status}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setDetailBooking(booking)}
                      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                    >
                      Ver detalle
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {detailBooking && (
        <BookingDetailModal
          booking={detailBooking}
          onClose={() => setDetailBooking(null)}
        />
      )}
    </section>
  );
}
