"use server";

import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";

export async function cancelBookingByToken(token: string): Promise<void> {
  const supabase = createServiceClient();

  const { data: booking } = await supabase
    .from("bookings")
    .select("id, status, slot_id, availability_slots(start_time)")
    .eq("management_token", token)
    .maybeSingle();

  if (!booking) {
    redirect(`/manage/${token}?error=not_found`);
  }

  if (booking.status === "CANCELLED") {
    redirect(`/manage/${token}?error=already_cancelled`);
  }

  const slotArr = booking.availability_slots as unknown as Array<{ start_time: string }>;
  const startTime = slotArr?.[0]?.start_time;

  if (startTime && new Date(startTime) < new Date()) {
    redirect(`/manage/${token}?error=past_booking`);
  }

  const { error } = await supabase
    .from("bookings")
    .update({ status: "CANCELLED" })
    .eq("id", booking.id);

  if (error) {
    redirect(`/manage/${token}?error=server_error`);
  }

  redirect(`/manage/${token}?cancelled=true`);
}
