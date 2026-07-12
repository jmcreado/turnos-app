/**
 * app/dashboard/availability/page.tsx — Tornu v2
 */
import { createClient } from "@/lib/supabase/server";
import { getProfessionalForUser } from "@/lib/professional";
import { redirect } from "next/navigation";
import { AvailabilityConfigForm } from "./components/AvailabilityConfigForm";
import { SlotsCalendar } from "./components/SlotsCalendar";
import type { SlotWaitlist } from "@/types/database";

export default async function AvailabilityPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const professional = await getProfessionalForUser(supabase, user.id, user.email ?? "");
  if (!professional) redirect("/dashboard");

  const now = new Date().toISOString();
  const fourWeeksLater = new Date();
  fourWeeksLater.setDate(fourWeeksLater.getDate() + 28);
  const endIso = fourWeeksLater.toISOString();

  const [slotsRes, bookingsRes, waitlistRes, servicesRes] = await Promise.all([
    supabase
      .from("availability_slots")
      .select("id, professional_id, start_time, end_time, is_blocked")
      .eq("professional_id", professional.id)
      .gte("start_time", now)
      .lte("start_time", endIso)
      .order("start_time", { ascending: true }),

    supabase
      .from("bookings")
      .select("id, slot_id, client_name, client_email, client_phone, status, service_id, services(name, duration_minutes)")
      .eq("professional_id", professional.id)
      .in("status", ["CONFIRMED", "PENDING"]),

    supabase
      .from("slot_waitlist")
      .select("id, slot_id, client_name, client_email, notified, created_at")
      .eq("professional_id", professional.id),

    supabase
      .from("services")
      .select("id, name")
      .eq("professional_id", professional.id)
      .eq("is_active", true),
  ]);

  const slots = slotsRes.data ?? [];
  const slotsById = new Map(slots.map(s => [s.id, s]));
  const services = servicesRes.data ?? [];

  type BookingRow = {
    id: string; slot_id: string; client_name: string; client_email: string;
    client_phone: string | null; status: string;
    services: { name: string; duration_minutes: number } | { name: string; duration_minutes: number }[] | null;
  };

  const bookingsBySlot: Record<string, {
    id: string; client_name: string; client_email: string;
    client_phone: string | null; status: string; service_name: string | null;
  }> = {};

  for (const raw of (bookingsRes.data ?? []) as BookingRow[]) {
    const serviceInfo = Array.isArray(raw.services) ? raw.services[0] : raw.services;
    bookingsBySlot[raw.slot_id] = {
      id: raw.id,
      client_name: raw.client_name,
      client_email: raw.client_email,
      client_phone: raw.client_phone ?? null,
      status: raw.status,
      service_name: serviceInfo?.name ?? null,
    };
  }

  const waitlistBySlot: Record<string, SlotWaitlist> = {};
  for (const entry of (waitlistRes.data ?? []) as SlotWaitlist[]) {
    waitlistBySlot[entry.slot_id] = entry;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Disponibilidad</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Configurá tu agenda y gestioná tus turnos disponibles.
        </p>
      </div>

      <AvailabilityConfigForm professionalId={professional.id} services={services} />

      <SlotsCalendar
        slots={slots}
        bookingsBySlot={bookingsBySlot}
        waitlistBySlot={waitlistBySlot}
        professionalId={professional.id}
      />
    </div>
  );
}
