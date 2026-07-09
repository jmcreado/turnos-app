import { createServiceClient } from "@/lib/supabase/service";
import { cancelBookingByToken } from "@/lib/actions/manage";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ cancelled?: string; error?: string }>;
};

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: "Confirmado",
  PENDING: "Pendiente de pago",
  CANCELLED: "Cancelado",
};

const ERROR_MESSAGES: Record<string, string> = {
  not_found: "No encontramos ningún turno con ese link.",
  already_cancelled: "Este turno ya estaba cancelado.",
  past_booking: "No podés cancelar un turno que ya ocurrió.",
  server_error: "Hubo un error al cancelar. Intentá de nuevo.",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Argentina/Buenos_Aires",
  });
}

export default async function ManagePage({ params, searchParams }: Props) {
  const { token } = await params;
  const { cancelled, error } = await searchParams;

  const supabase = createServiceClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select(`
      id, client_name, client_email, status, created_at,
      availability_slots(start_time, end_time),
      services(name),
      professionals(name)
    `)
    .eq("management_token", token)
    .maybeSingle();

  if (!booking) return notFound();

  const slotArr = booking.availability_slots as unknown as Array<{ start_time: string; end_time: string }>;
  const slot = slotArr?.[0];
  const serviceArr = booking.services as unknown as Array<{ name: string }>;
  const profArr = booking.professionals as unknown as Array<{ name: string }>;

  const serviceName = serviceArr?.[0]?.name ?? "—";
  const professionalName = profArr?.[0]?.name ?? "—";

  const isUpcoming = slot?.start_time ? new Date(slot.start_time) > new Date() : false;
  const canCancel = booking.status !== "CANCELLED" && isUpcoming;

  return (
    <div className="min-h-screen bg-[#f7f5f0] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <a href="/" className="text-xl font-serif font-semibold text-[#1a1a1a]">Tornu</a>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900 mb-1">Tu turno</h1>
          <p className="text-sm text-zinc-500 mb-6">Podés cancelarlo desde acá si lo necesitás.</p>

          {cancelled && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 mb-5">
              <p className="text-sm font-medium text-emerald-800">Turno cancelado correctamente.</p>
            </div>
          )}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 mb-5">
              <p className="text-sm text-red-700">{ERROR_MESSAGES[error] ?? "Ocurrió un error."}</p>
            </div>
          )}

          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-zinc-500">Profesional</dt>
              <dd className="font-medium text-zinc-900 text-right">{professionalName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Servicio</dt>
              <dd className="font-medium text-zinc-900 text-right">{serviceName}</dd>
            </div>
            {slot?.start_time && (
              <div className="flex justify-between">
                <dt className="text-zinc-500">Fecha</dt>
                <dd className="font-medium text-zinc-900 text-right">{formatDate(slot.start_time)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-zinc-500">Estado</dt>
              <dd>
                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  booking.status === "CONFIRMED"
                    ? "bg-emerald-100 text-emerald-800"
                    : booking.status === "PENDING"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-zinc-100 text-zinc-600"
                }`}>
                  {STATUS_LABELS[booking.status] ?? booking.status}
                </span>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-zinc-500">Cliente</dt>
              <dd className="font-medium text-zinc-900">{booking.client_name}</dd>
            </div>
          </dl>

          {canCancel && !cancelled && (
            <div className="mt-6 pt-5 border-t border-zinc-100">
              <p className="text-sm text-zinc-500 mb-3">¿Necesitás cancelar?</p>
              <form
                action={async () => {
                  "use server";
                  await cancelBookingByToken(token);
                }}
              >
                <button
                  type="submit"
                  className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
                >
                  Cancelar mi turno
                </button>
              </form>
            </div>
          )}

          {!canCancel && !cancelled && booking.status !== "CANCELLED" && !isUpcoming && (
            <p className="mt-5 pt-5 border-t border-zinc-100 text-sm text-zinc-400">Este turno ya ocurrió.</p>
          )}
        </div>
      </div>
    </div>
  );
}
