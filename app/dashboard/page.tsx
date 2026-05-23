import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ProfileForm } from "./components/ProfileForm";
import { WelcomePanel } from "./components/WelcomePanel";
import { TurnosSectionProvider, TurnosSummaryCards, TurnosList } from "./components/TurnosSummary";
import { CopyButton } from "./components/CopyButton";
import type { Professional, Booking } from "@/types/database";

async function getProfessional(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, userEmail: string): Promise<Professional | null> {
  const { data: byEmail } = await supabase.from("professionals").select("*").eq("email", userEmail).maybeSingle();
  if (byEmail) return byEmail as Professional;
  const { data: byUser } = await supabase.from("professionals").select("*").eq("user_id", userId).maybeSingle();
  if (byUser) return byUser as Professional;
  return null;
}

async function getServices(supabase: Awaited<ReturnType<typeof createClient>>, professionalId: string) {
  const { data } = await supabase.from("services").select("*").eq("professional_id", professionalId).eq("is_active", true).order("created_at", { ascending: true });
  return data ?? [];
}

async function getServiceMetrics(supabase: Awaited<ReturnType<typeof createClient>>, professionalId: string) {
  const { data: bookings } = await supabase.from("bookings").select("service_id, client_email, status").eq("professional_id", professionalId);
  const list = bookings ?? [];
  const byService: Record<string, { total: number; emails: string[] }> = {};
  for (const b of list) {
    const sid = b.service_id ?? "legacy";
    if (!byService[sid]) byService[sid] = { total: 0, emails: [] };
    byService[sid].total++;
    if (b.client_email) byService[sid].emails.push(b.client_email);
  }
  const metrics: Record<string, { total: number; unique: number; returning: number }> = {};
  for (const [sid, val] of Object.entries(byService)) {
    const emailCounts: Record<string, number> = {};
    for (const e of val.emails) emailCounts[e] = (emailCounts[e] ?? 0) + 1;
    const unique = Object.keys(emailCounts).length;
    const returning = Object.values(emailCounts).filter((c) => c > 1).length;
    metrics[sid] = { total: val.total, unique, returning };
  }
  return metrics;
}

async function getBookingCounts(supabase: Awaited<ReturnType<typeof createClient>>, professionalId: string) {
  const { data } = await supabase.from("bookings").select("status").eq("professional_id", professionalId);
  const list = data ?? [];
  return {
    confirmed: list.filter((b) => b.status === "CONFIRMED").length,
    pending: list.filter((b) => b.status === "PENDING").length,
    cancelled: list.filter((b) => b.status === "CANCELLED").length,
  };
}

async function getAllBookingsWithSlots(supabase: Awaited<ReturnType<typeof createClient>>, professionalId: string): Promise<Booking[]> {
  const { data } = await supabase
    .from("bookings")
    .select("id, professional_id, slot_id, service_id, client_name, client_email, client_phone, status, payment_id, expires_at, created_at, availability_slots(start_time, end_time)")
    .eq("professional_id", professionalId)
    .order("created_at", { ascending: false });
  if (!data) return [];
  const now = new Date().getTime();
  return [...data]
    .map((b) => { const { availability_slots, ...rest } = b as any; return { ...rest, slot: availability_slots?.[0] ?? undefined } as Booking; })
    .sort((a, b) => {
      const ta = new Date(a.slot?.start_time ?? 0).getTime();
      const tb = new Date(b.slot?.start_time ?? 0).getTime();
      const aUp = ta >= now; const bUp = tb >= now;
      if (aUp && bUp) return ta - tb;
      if (!aUp && !bUp) return tb - ta;
      return aUp ? -1 : 1;
    });
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const professional = await getProfessional(supabase, user.id, user.email ?? "");

  if (!professional) {
    return (
      <div className="min-h-screen bg-zinc-50 py-10">
        <ProfileForm userEmail={user.email ?? ""} userId={user.id} />
      </div>
    );
  }

  const [services, metrics, counts, allBookings] = await Promise.all([
    getServices(supabase, professional.id),
    getServiceMetrics(supabase, professional.id),
    getBookingCounts(supabase, professional.id),
    getAllBookingsWithSlots(supabase, professional.id),
  ]);

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  return (
    <div className="min-h-screen bg-zinc-50 py-8">
      <div className="mx-auto max-w-6xl space-y-8 px-4">

        <div className="flex flex-wrap items-center justify-between gap-4">
          <WelcomePanel professional={professional} />
          <div className="flex gap-3">
            <a href="/dashboard/availability" className="rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-50">Disponibilidad</a>
            <a href="/dashboard/services/new" className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-700">+ Nuevo servicio</a>
          </div>
        </div>

        <div>
          <h2 className="mb-4 text-base font-semibold text-zinc-900">Mis servicios</h2>
          {services.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center">
              <p className="text-zinc-500">Todavía no tenés servicios.</p>
              <a href="/dashboard/services/new" className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white">Crear primer servicio</a>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => {
                const m = metrics[service.id] ?? { total: 0, unique: 0, returning: 0 };
                const shareUrl = `${baseUrl}/book/${professional.slug}/${service.id}`;
                return (
                  <div key={service.id} className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-zinc-900">{service.name}</h3>
                        <p className="mt-0.5 text-sm text-zinc-500">{service.duration_minutes} min · ${Number(service.price).toLocaleString("es-AR")} ARS</p>
                      </div>
                      <a href={`/dashboard/services/${service.id}`} className="rounded-lg border border-zinc-200 px-2.5 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50">Editar</a>
                    </div>
                    <div className="mt-4 grid grid-cols-3 divide-x divide-zinc-100 rounded-xl bg-zinc-50 py-3">
                      <div className="px-3 text-center">
                        <p className="text-lg font-semibold text-zinc-900">{m.total}</p>
                        <p className="text-xs text-zinc-500">turnos</p>
                      </div>
                      <div className="px-3 text-center">
                        <p className="text-lg font-semibold text-zinc-900">{m.unique}</p>
                        <p className="text-xs text-zinc-500">únicos</p>
                      </div>
                      <div className="px-3 text-center">
                        <p className="text-lg font-semibold text-zinc-900">{m.returning}</p>
                        <p className="text-xs text-zinc-500">recurrentes</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2">
                      <span className="flex-1 truncate text-xs text-zinc-500">{shareUrl}</span>
                      <CopyButton text={shareUrl} />
                    </div>
                    {service.requires_payment && <p className="mt-2 text-xs text-amber-600">Requiere pago previo</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-dashed border-zinc-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-zinc-700">Gestión de clientes</p>
              <p className="text-xs text-zinc-400">Recordatorios, fidelidad y promociones — próximamente</p>
            </div>
            <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-500">Próximo MVP</span>
          </div>
        </div>

        <TurnosSectionProvider counts={counts} bookings={allBookings}>
          <TurnosSummaryCards />
          <TurnosList />
        </TurnosSectionProvider>

      </div>
    </div>
  );
}