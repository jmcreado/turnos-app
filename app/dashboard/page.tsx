import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { WelcomePanel } from "./components/WelcomePanel";
import { ServiceSection } from "./components/ServiceSection";
import {
  TurnosSectionProvider,
  TurnosSummaryCards,
  TurnosList,
} from "./components/TurnosSummary";
import { ShareLinkSection } from "./components/ShareLinkSection";
import { ProfileForm } from "./components/ProfileForm";
import type { Professional } from "@/types/database";
import type { Booking } from "@/types/database";

/**
 * Obtiene el profesional asociado al usuario actual (por email o user_id si existe).
 */
async function getProfessional(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  userEmail: string
): Promise<Professional | null> {
  // Intentar por email primero (siempre está en el modelo)
  const { data: byEmail } = await supabase
    .from("professionals")
    .select("*")
    .eq("email", userEmail)
    .maybeSingle();

  if (byEmail) return byEmail as Professional;

  // Si la tabla tiene user_id, intentar por ahí (útil si el email cambió)
  const { data: byUser, error: _ } = await supabase
    .from("professionals")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (byUser) return byUser as Professional;
  return null;
}

/**
 * Cuenta bookings por estado para un profesional.
 */
async function getBookingCounts(
  supabase: Awaited<ReturnType<typeof createClient>>,
  professionalId: string
): Promise<{ confirmed: number; pending: number; cancelled: number }> {
  const { data } = await supabase
    .from("bookings")
    .select("status")
    .eq("professional_id", professionalId);

  const list = data ?? [];
  return {
    confirmed: list.filter((b) => b.status === "CONFIRMED").length,
    pending: list.filter((b) => b.status === "PENDING").length,
    cancelled: list.filter((b) => b.status === "CANCELLED").length,
  };
}

/**
 * Todos los turnos del profesional con join al slot (para fecha/hora).
 * Orden: por start_time del slot ascendente.
 */
async function getAllBookingsWithSlots(
  supabase: Awaited<ReturnType<typeof createClient>>,
  professionalId: string
): Promise<Booking[]> {
  const { data } = await supabase
    .from("bookings")
    .select(
      "id, professional_id, slot_id, client_name, client_email, client_phone, status, payment_id, expires_at, created_at, availability_slots(start_time, end_time)"
    )
    .eq("professional_id", professionalId)
    .order("created_at", { ascending: false });

  if (!data) return [];

  const withSlot = data.map((b) => {
    const { availability_slots, ...rest } = b as {
      availability_slots?: { start_time: string; end_time: string }[];
    } & Omit<Booking, "slot">;
    return { ...rest, slot: availability_slots?.[0] ?? undefined } as Booking;
  });

  const now = new Date().getTime();
  const sorted = [...withSlot].sort((a, b) => {
    const ta = new Date(a.slot?.start_time ?? 0).getTime();
    const tb = new Date(b.slot?.start_time ?? 0).getTime();
    const aUpcoming = ta >= now;
    const bUpcoming = tb >= now;
    if (aUpcoming && bUpcoming) return ta - tb;
    if (!aUpcoming && !bUpcoming) return tb - ta;
    return aUpcoming ? -1 : 1;
  });
  return sorted;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const professional = await getProfessional(
    supabase,
    user.id,
    user.email ?? ""
  );

  if (!professional) {
    return (
      <div className="min-h-screen bg-zinc-50 py-10">
        <ProfileForm userEmail={user.email ?? ""} userId={user.id} />
      </div>
    );
  }

  const [counts, allBookings] = await Promise.all([
    getBookingCounts(supabase, professional.id),
    getAllBookingsWithSlots(supabase, professional.id),
  ]);

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  return (
    <div className="min-h-screen bg-zinc-50 py-8">
      <div className="mx-auto max-w-6xl space-y-8 px-4">
        {/* 1. Arriba: bienvenida + botón disponibilidad */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <WelcomePanel professional={professional} />
          <a
            href="/dashboard/availability"
            className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
          >
            Configurar disponibilidad
          </a>
        </div>

        {/* 2. Segunda fila: Mi servicio (izq) | 4 tarjetas de resumen (der) */}
        <TurnosSectionProvider counts={counts} bookings={allBookings}>
          <section className="grid gap-8 lg:grid-cols-2">
            <ServiceSection professional={professional} />
            <TurnosSummaryCards />
          </section>

          {/* 3. Tercera sección: Mi link ancho completo */}
          <ShareLinkSection professional={professional} baseUrl={baseUrl} />

          {/* 4. Cuarta sección: lista de turnos con buscador y tabla, ancho completo */}
          <TurnosList />
        </TurnosSectionProvider>
      </div>
    </div>
  );
}
