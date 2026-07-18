import type { Booking } from "@/types/database";

type Props = {
  bookings: Booking[];
};

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("es-AR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function UpcomingBookings({ bookings }: Props) {
  if (bookings.length === 0) {
    return (
      <div className="rounded-2xl border border-edge bg-surface p-6">
        <h2 className="text-lg font-semibold text-ink">Próximos turnos</h2>
        <p className="mt-4 text-muted">No tenés turnos confirmados próximos.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-edge bg-surface p-6">
      <h2 className="text-lg font-semibold text-ink">Próximos turnos</h2>
      <p className="mt-1 text-sm text-muted">Reservas confirmadas</p>
      <ul className="mt-4 divide-y divide-white/5">
        {bookings.map((b) => (
          <li key={b.id} className="py-4 first:pt-0">
            <p className="font-medium text-ink">{b.client_name}</p>
            <p className="text-sm text-muted">{b.client_email}</p>
            <p className="mt-1 text-sm text-muted">
              {b.slot
                ? formatDateTime(b.slot.start_time)
                : "—"}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
