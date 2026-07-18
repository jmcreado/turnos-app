/**
 * app/book/[slug]/page.tsx — Tornu v2
 */
import { createClient } from "@/lib/supabase/server";
import { getProfessionalBySlug, getProfessionalById } from "@/lib/professional";
import { computeBookableStarts, type OccupiedRange } from "@/lib/availability";
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
      <div className="tn-glow flex min-h-screen items-center justify-center">
        <div className="text-center px-4">
          <h1 className="text-xl font-semibold text-ink">{professional.name}</h1>
          <p className="mt-2 text-muted">Este profesional todavía no tiene servicios disponibles.</p>
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
      // Filtrar por servicio: mostrar slots sin restricción O restringidos a este servicio
      .or(`service_id.is.null,service_id.eq.${selectedService.id}`)
      .order("start_time", { ascending: true }),

    supabase
      .from("bookings")
      .select("slot_id, services(duration_minutes)")
      .eq("professional_id", professional.id)
      .in("status", ["CONFIRMED", "PENDING"]),

    supabase
      .from("slot_waitlist")
      .select("slot_id, client_email")
      .eq("professional_id", professional.id),
  ]);

  const allAtomicSlots = slotsRes.data ?? [];
  const slotsById = new Map(allAtomicSlots.map(s => [s.id, s]));
  const bookedSlotIds = new Set((bookedRes.data ?? []).map(r => r.slot_id));
  const waitlistSlotIds = new Set((waitlistRes.data ?? []).map(r => r.slot_id));

  type BookedRow = { slot_id: string; services: { duration_minutes: number } | { duration_minutes: number }[] | null };
  const occupiedRanges: OccupiedRange[] = [];
  for (const raw of (bookedRes.data ?? []) as BookedRow[]) {
    const startSlot = slotsById.get(raw.slot_id);
    const serviceInfo = Array.isArray(raw.services) ? raw.services[0] : raw.services;
    const durationMinutes = serviceInfo?.duration_minutes;
    if (!startSlot || !durationMinutes) continue;
    const startMs = new Date(startSlot.start_time).getTime();
    occupiedRanges.push({
      start: startSlot.start_time,
      end: new Date(startMs + durationMinutes * 60 * 1000).toISOString(),
    });
  }

  const bookableStarts = selectedService
    ? computeBookableStarts(allAtomicSlots, occupiedRanges, selectedService.duration_minutes)
    : [];
  const bookableStartIds = new Set(bookableStarts.map(s => s.id));

  const filteredSlots = allAtomicSlots.filter(s => bookableStartIds.has(s.id) || bookedSlotIds.has(s.id) || waitlistSlotIds.has(s.id));

  return (
    <div className="tn-glow min-h-screen">
      <BookingCalendar
        professional={professional}
        allSlots={filteredSlots}
        bookedSlotIds={Array.from(bookedSlotIds)}
        waitlistSlotIds={Array.from(waitlistSlotIds)}
        serviceId={selectedService.id}
      />
    </div>
  );
}
