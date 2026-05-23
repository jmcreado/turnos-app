import { createClient } from "@/lib/supabase/server";
import { getProfessionalBySlug, getProfessionalById } from "@/lib/professional";
import { notFound } from "next/navigation";
import { BookingCalendar } from "./BookingCalendar";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ service?: string }>;
};

export default async function BookPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { service: serviceId } = await searchParams;

  const supabase = await createClient();

  let professional = await getProfessionalBySlug(supabase, slug);
  if (!professional && slug.length >= 30) {
    professional = await getProfessionalById(supabase, slug);
  }
  if (!professional) notFound();

  // Cargar servicios activos del profesional
  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("professional_id", professional.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  const activeServices = services ?? [];

  // Determinar servicio seleccionado
  const selectedService = serviceId
    ? activeServices.find((s) => s.id === serviceId) ?? activeServices[0]
    : activeServices[0];

  // Si no hay servicios configurados, mostrar mensaje
  if (!selectedService) {
    return (
      <div className="min-h-screen bg-zinc-50 flex items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-xl font-semibold text-zinc-900">{professional.name}</h1>
          <p className="mt-2 text-zinc-500">Este profesional todavía no tiene servicios disponibles.</p>
        </div>
      </div>
    );
  }

  const now = new Date().toISOString();
  const fourWeeksLater = new Date();
  fourWeeksLater.setDate(fourWeeksLater.getDate() + 28);
  const endIso = fourWeeksLater.toISOString();

  const [slotsResult, bookedSlotIdsResult] = await Promise.all([
    supabase
      .from("availability_slots")
      .select("id, professional_id, start_time, end_time")
      .eq("professional_id", professional.id)
      .eq("is_blocked", false)
      .gte("start_time", now)
      .lte("start_time", endIso)
      .order("start_time", { ascending: true }),
    supabase
      .from("bookings")
      .select("slot_id")
      .eq("professional_id", professional.id)
      .in("status", ["CONFIRMED", "PENDING"]),
  ]);

  const slots = slotsResult.data ?? [];
  const bookedIds = new Set(
    (bookedSlotIdsResult.data ?? []).map((r) => r.slot_id)
  );
  const availableSlots = slots.filter((s) => !bookedIds.has(s.id));

  return (
    <div className="min-h-screen bg-zinc-50 py-8">
      <div className="mx-auto max-w-2xl px-4 space-y-4">

        {/* Header del profesional */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900">{professional.name}</h1>

          {/* Selector de servicios si hay más de uno */}
          {activeServices.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {activeServices.map((s) => (
                <a key={s.id} href={`/book/${slug}?service=${s.id}`} className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${s.id === selectedService.id ? "bg-zinc-900 text-white" : "border border-zinc-200 text-zinc-600 hover:bg-zinc-50"}`}>{s.name}</a>
              ))}
            </div>
          )}

          {/* Info del servicio seleccionado */}
          <div className="mt-4 rounded-xl bg-zinc-50 p-4">
            <p className="font-medium text-zinc-900">{selectedService.name}</p>
            {selectedService.description && (
              <p className="mt-1 text-sm text-zinc-500">{selectedService.description}</p>
            )}
            <dl className="mt-3 flex flex-wrap gap-4 text-sm">
              <div>
                <dt className="text-zinc-500">Duración</dt>
                <dd className="font-medium text-zinc-900">
                  {selectedService.duration_minutes} min
                </dd>
              </div>
              <div>
                <dt className="text-zinc-500">Precio</dt>
                <dd className="font-medium text-zinc-900">
                  ${Number(selectedService.price).toLocaleString("es-AR")} ARS
                </dd>
              </div>
              {selectedService.requires_payment && (
                <div>
                  <dt className="text-zinc-500">Pago</dt>
                  <dd className="font-medium text-amber-600">Requerido al reservar</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Calendario */}
        <BookingCalendar
          professional={professional}
          slots={availableSlots}
          serviceId={selectedService.id}
        />
      </div>
    </div>
  );
}