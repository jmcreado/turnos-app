/**
 * app/dashboard/availability/page.tsx — Tornu v2
 */
import { createClient } from "@/lib/supabase/server";
import { getProfessionalForUser } from "@/lib/professional";
import { redirect } from "next/navigation";
import Link from "next/link";
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

  // Map: slot_id → booking info. Un turno puede abarcar varios slots atómicos
  // (si su servicio dura más que la granularidad); marcamos todos los slots
  // que caen dentro del rango real del turno, no solo el slot de inicio.
  type BookingRow = {
    id: string;
    slot_id: string;
    client_name: string;
    client_email: string;
    client_phone: string | null;
    status: string;
    services: { name: string; duration_minutes: number } | { name: string; duration_minutes: number }[] | null;
  };
  const bookingsBySlot: Record<string, { id: string; client_name: string; client_email: string; client_phone: string | null; status: string; service_name: string | null }> = {};
  for (const raw of (bookingsRes.data ?? []) as BookingRow[]) {
    const serviceInfo = Array.isArray(raw.services) ? raw.services[0] : raw.services;
    const info = {
      id: raw.id,
      client_name: raw.client_name,
      client_email: raw.client_email,
      client_phone: raw.client_phone ?? null,
      status: raw.status,
      service_name: serviceInfo?.name ?? null,
    };

    const startSlot = slotsById.get(raw.slot_id);
    const durationMinutes = serviceInfo?.duration_minutes;
    if (startSlot && durationMinutes) {
      const startMs = new Date(startSlot.start_time).getTime();
      const endMs = startMs + durationMinutes * 60 * 1000;
      for (const s of slots) {
        const sMs = new Date(s.start_time).getTime();
        if (sMs >= startMs && sMs < endMs) bookingsBySlot[s.id] = info;
      }
    } else {
      // Fallback si no encontramos el slot o el servicio: marcar solo el de inicio
      bookingsBySlot[raw.slot_id] = info;
    }
  }

  // Map: slot_id → first waitlist entry
  const waitlistBySlot: Record<string, SlotWaitlist> = {};
  for (const w of waitlistRes.data ?? []) {
    if (!waitlistBySlot[w.slot_id]) {
      waitlistBySlot[w.slot_id] = w as SlotWaitlist;
    }
  }

  return (
    <div className="min-h-screen py-8" style={{ backgroundColor: "#f7f5f0" }}>
      <div className="mx-auto max-w-4xl space-y-8 px-4">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">← Volver al dashboard</Link>
        </div>

        <h1 className="text-2xl font-semibold text-zinc-900">Disponibilidad</h1>

        <AvailabilityConfigForm
          professionalId={professional.id}
        />

        <SlotsCalendar
          professionalId={professional.id}
          slots={slots}
          bookingsBySlot={bookingsBySlot}
          waitlistBySlot={waitlistBySlot}
        />
      </div>
    </div>
  );
}
