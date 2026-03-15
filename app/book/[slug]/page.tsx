import { createClient } from "@/lib/supabase/server";
import { getProfessionalBySlug, getProfessionalById } from "@/lib/professional";
import { notFound } from "next/navigation";
import { BookingCalendar } from "./BookingCalendar";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function BookPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();

  let professional = await getProfessionalBySlug(supabase, slug);
  if (!professional && slug.length >= 30) {
    professional = await getProfessionalById(supabase, slug);
  }
  if (!professional) {
    notFound();
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
  const bookedIds = new Set((bookedSlotIdsResult.data ?? []).map((r) => r.slot_id));
  const availableSlots = slots.filter((s) => !bookedIds.has(s.id));

  return (
    <div className="min-h-screen bg-zinc-50 py-8">
      <div className="mx-auto max-w-2xl px-4">
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-zinc-900">{professional.name}</h1>
          <p className="mt-1 text-zinc-600">
            {professional.service_name || "Sesión"}
          </p>
          <dl className="mt-4 flex flex-wrap gap-4 text-sm">
            <div>
              <dt className="text-zinc-500">Duración</dt>
              <dd className="font-medium text-zinc-900">{professional.session_duration_minutes} min</dd>
            </div>
            <div>
              <dt className="text-zinc-500">Precio</dt>
              <dd className="font-medium text-zinc-900">
                ${Number(professional.session_price).toLocaleString("es-AR")} ARS
              </dd>
            </div>
          </dl>
        </div>

        <BookingCalendar
          professional={professional}
          slots={availableSlots}
        />
      </div>
    </div>
  );
}
