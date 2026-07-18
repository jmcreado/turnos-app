import { createServiceClient } from "@/lib/supabase/service";
import { ManageBooking } from "./ManageBooking";
import { notFound } from "next/navigation";

type Props = {
  params: Promise<{ token: string }>;
};

export default async function ManagePage({ params }: Props) {
  const { token } = await params;
  const supabase = createServiceClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select(`
      id, professional_id, slot_id, management_token,
      client_name, client_email, status,
      availability_slots(start_time, end_time),
      services(name, requires_payment, session_duration_minutes),
      professionals(name, slug)
    `)
    .eq("management_token", token)
    .maybeSingle();

  if (!booking) return notFound();

  const slotArr = booking.availability_slots as unknown as Array<{ start_time: string; end_time: string }>;
  const serviceArr = booking.services as unknown as Array<{ name: string; requires_payment: boolean; session_duration_minutes: number }>;
  const profArr = booking.professionals as unknown as Array<{ name: string; slug: string | null }>;

  const bookingData = {
    id: booking.id,
    professional_id: booking.professional_id,
    slot_id: booking.slot_id,
    management_token: booking.management_token,
    client_name: booking.client_name,
    client_email: booking.client_email,
    status: booking.status as "CONFIRMED" | "PENDING" | "CANCELLED",
    slot: slotArr?.[0] ?? null,
    service: serviceArr?.[0]
      ? {
          name: serviceArr[0].name,
          price: 0,
          duration_minutes: serviceArr[0].session_duration_minutes ?? 60,
        }
      : null,
    professional: profArr?.[0] ?? null,
  };

  // Slots disponibles para reprogramar (futuros, no reservados, del mismo profesional)
  const now = new Date().toISOString();
  const { data: slotsRaw } = await supabase
    .from("availability_slots")
    .select("id, start_time, end_time")
    .eq("professional_id", booking.professional_id)
    .eq("is_blocked", false)
    .gte("start_time", now)
    .neq("id", booking.slot_id)
    .order("start_time");

  // Filtrar slots que no tienen reserva activa
  const bookedSlotIds = new Set<string>();
  if (slotsRaw && slotsRaw.length > 0) {
    const slotIds = slotsRaw.map((s) => s.id);
    const { data: activeBookings } = await supabase
      .from("bookings")
      .select("slot_id")
      .in("slot_id", slotIds)
      .in("status", ["CONFIRMED", "PENDING"]);
    for (const b of activeBookings ?? []) bookedSlotIds.add(b.slot_id);
  }

  const availableSlots = (slotsRaw ?? []).filter((s) => !bookedSlotIds.has(s.id));

  return (
    <div className="tn-glow flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md">
        <ManageBooking booking={bookingData} availableSlots={availableSlots} />
      </div>
    </div>
  );
}
