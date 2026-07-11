import { createServiceClient } from "@/lib/supabase/service";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const supabase = createServiceClient();
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("bookings")
    .update({ status: "CANCELLED" })
    .eq("status", "PENDING")
    .lt("expires_at", now)
    .select("id");

  if (error) {
    console.error("cancel-pending cron error:", error);
    return Response.json({ ok: false, error: error.message }, { status: 500 });
  }

  console.log(`cancel-pending: cancelled ${data?.length ?? 0} bookings`);
  return Response.json({ ok: true, cancelled: data?.length ?? 0 });
}
