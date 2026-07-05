/**
 * app/book/[slug]/page.tsx — Tornu v2
 */
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
  if (!professional && slug.length >= 30) professional = await getProfessionalById(supabase, slug);
  if (!professional) notFound();

  const { data: services } = await supabase
    .from("services")
    .select("*")
    .eq("professional_id", professional.id)
    .eq("is_active", true)
    .order("created_at", { ascending: true });

  const activeServices = services ?? [];
  const selectedService = serviceId
    ? (activeServices.find(s => s.id === serviceId) ?? activeServices[0])
    : activeServices[0];

  if (!selectedService) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#f7f5f0" }}>
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

  const [slotsRes, bookedRes, waitlistRes] = await Promise.all([
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

    supabase
      .from("slot_waitlist")
      .select("slot_id, client_email")
      .eq("professional_id", professional.id),
  ]);

  const allSlots = slotsRes.data ?? [];
  const bookedSlotIds = new Set((bookedRes.data ?? []).map(r => r.slot_id));
  const waitlistSlotIds = new Set((waitlistRes.data ?? []).map(r => r.slot_id));

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: "#f7f5f0" }}>
      <div className="mx-auto max-w-lg px-4 space-y-4">
        {/* Professional header */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: "#e8f2ed" }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: "#1a6b4a" }}>
              {professional.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="font-bold text-zinc-900">{professional.name}</h1>
            </div>
          </div>

          {activeServices.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {activeServices.map(s => (
                <a key={s.id} href={`/book/${slug}?service=${s.id}`} className="rounded-full px-4 py-1.5 text-sm font-medium transition-colors" style={s.id === selectedService.id ? { backgroundColor: "#1a6b4a", color: "white" } : { border: "1px solid #d1d5db", color: "#4b5563" }}>{s.name}</a>
              ))}
            </div>
          )}

          <div className="mt-4 rounded-xl bg-white p-4">
            <p className="font-medium text-zinc-900">{selectedService.name}</p>
            {selectedService.description && <p className="mt-1 text-sm text-zinc-500">{selectedService.description}</p>}
            <dl className="mt-3 flex flex-wrap gap-4 text-sm">
              <div>
                <dt className="text-zinc-500">Duración</dt>
                <dd className="font-medium text-zinc-900">{selectedService.duration_minutes} min</dd>
              </div>
              <div>
                <dt className="text-zinc-500">Precio</dt>
                <dd className="font-medium text-zinc-900">${Number(selectedService.price).toLocaleString("es-AR")} ARS</dd>
              </div>
            </dl>
          </div>
        </div>

        <BookingCalendar
          professional={professional}
          allSlots={allSlots}
          bookedSlotIds={Array.from(bookedSlotIds)}
          waitlistSlotIds={Array.from(waitlistSlotIds)}
          serviceId={selectedService.id}
        />
      </div>
    </div>
  );
}
