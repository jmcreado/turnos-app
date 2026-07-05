/**
 * app/manage/[token]/page.tsx — Tornu v2
 * Página de gestión de turno via magic link.
 */
import { notFound } from "next/navigation";
import { getBookingByToken } from "@/lib/actions/booking";
import { createAdminClient } from "@/lib/supabase/admin";
import { ManageBooking } from "./ManageBooking";

type Props = { params: Promise<{ token: string }> };

export default async function ManagePage({ params }: Props) {
  const { token } = await params;
  if (!token || token.length < 10) notFound();

  const booking = await getBookingByToken(token);
  if (!booking) notFound();

  // Fetch available slots for reschedule (only if booking is not cancelled)
  let availableSlots: { id: string; start_time: string; end_time: string }[] = [];

  if (booking.status !== "CANCELLED") {
    const admin = createAdminClient();
    const now = new Date().toISOString();
    const fourWeeksLater = new Date();
    fourWeeksLater.setDate(fourWeeksLater.getDate() + 28);

    const [slotsRes, bookedRes] = await Promise.all([
      admin
        .from("availability_slots")
        .select("id, start_time, end_time")
        .eq("professional_id", booking.professional_id)
        .eq("is_blocked", false)
        .gte("start_time", now)
        .lte("start_time", fourWeeksLater.toISOString())
        .order("start_time", { ascending: true }),
      admin
        .from("bookings")
        .select("slot_id")
        .eq("professional_id", booking.professional_id)
        .in("status", ["CONFIRMED", "PENDING"])
        .neq("management_token", token), // excluir el turno actual
    ]);

    const bookedIds = new Set((bookedRes.data ?? []).map(r => r.slot_id));
    availableSlots = (slotsRes.data ?? []).filter(s => !bookedIds.has(s.id) && s.id !== booking.slot_id);
  }

  return (
    <div className="min-h-screen py-8 px-4" style={{ backgroundColor: "#f7f5f0" }}>
      <div className="mx-auto max-w-md">
        <ManageBooking booking={booking} availableSlots={availableSlots} />
      </div>
    </div>
  );
}
