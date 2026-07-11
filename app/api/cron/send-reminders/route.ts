import { createServiceClient } from "@/lib/supabase/service";
import { sendReminderEmail } from "@/lib/email";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date();
  const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000).toISOString();
  const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000).toISOString();

  // Obtener bookings confirmados sin reminder, con su slot y datos relacionados
  const { data: bookings, error } = await supabase
    .from("bookings")
    .select(`
      id, client_name, client_email, management_token,
      availability_slots(start_time),
      services(name),
      professionals(name)
    `)
    .eq("status", "CONFIRMED")
    .is("reminder_sent_at", null);

  if (error) {
    console.error("send-reminders cron error:", error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  // Filtrar en código los que tienen turno en la ventana 23-25h
  type RawBooking = typeof bookings extends (infer T)[] | null ? T : never;
  const toRemind = (bookings ?? []).filter((b: RawBooking) => {
    const slotArr = b.availability_slots as unknown as Array<{ start_time: string }>;
    const startTime = slotArr?.[0]?.start_time;
    if (!startTime) return false;
    return startTime >= in23h && startTime <= in25h;
  });

  let sent = 0;
  let failed = 0;

  for (const booking of toRemind) {
    const slotArr = booking.availability_slots as unknown as Array<{ start_time: string }>;
    const serviceArr = booking.services as unknown as Array<{ name: string }>;
    const profArr = booking.professionals as unknown as Array<{ name: string }>;

    const startTime = slotArr?.[0]?.start_time;
    const managementToken = booking.management_token as string | null;

    if (!startTime || !managementToken) continue;

    try {
      await sendReminderEmail({
        clientName: booking.client_name,
        clientEmail: booking.client_email,
        professionalName: profArr?.[0]?.name ?? "Tu profesional",
        serviceName: serviceArr?.[0]?.name ?? "Tu turno",
        slotStartTime: startTime,
        managementToken,
      });

      await supabase
        .from("bookings")
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq("id", booking.id);

      sent++;
    } catch (e) {
      console.error("Error sending reminder for booking", booking.id, e);
      failed++;
    }
  }

  console.log(`send-reminders: sent=${sent} failed=${failed}`);
  return Response.json({ ok: true, sent, failed });
}
