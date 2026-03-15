import { createClient } from "@/lib/supabase/server";
import { getProfessionalForUser } from "@/lib/professional";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AvailabilityConfigForm } from "./components/AvailabilityConfigForm";
import { SlotsCalendar } from "./components/SlotsCalendar";

export default async function AvailabilityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const professional = await getProfessionalForUser(
    supabase,
    user.id,
    user.email ?? ""
  );

  if (!professional) {
    redirect("/dashboard");
  }

  const now = new Date().toISOString();
  const fourWeeksLater = new Date();
  fourWeeksLater.setDate(fourWeeksLater.getDate() + 28);
  const endIso = fourWeeksLater.toISOString();

  const { data: slots } = await supabase
    .from("availability_slots")
    .select("id, professional_id, start_time, end_time, is_blocked")
    .eq("professional_id", professional.id)
    .gte("start_time", now)
    .lte("start_time", endIso)
    .order("start_time", { ascending: true });

  return (
    <div className="min-h-screen bg-zinc-50 py-8">
      <div className="mx-auto max-w-4xl space-y-8 px-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-zinc-600 hover:text-zinc-900"
          >
            ← Volver al dashboard
          </Link>
        </div>

        <h1 className="text-2xl font-semibold text-zinc-900">Disponibilidad</h1>

        <AvailabilityConfigForm
          professionalId={professional.id}
          durationMinutes={professional.session_duration_minutes}
        />

        <SlotsCalendar professionalId={professional.id} slots={slots ?? []} />
      </div>
    </div>
  );
}
