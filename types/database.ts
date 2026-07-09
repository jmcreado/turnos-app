/**
 * types/database.ts
 * Tipos del modelo de datos (Supabase) — Tornu v2
 */

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export interface Professional {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  service_name: string | null;
  slug: string | null;
  session_duration_minutes: number;
  session_price: number;
  requires_payment: boolean;
  mp_access_token: string | null;
  telegram_chat_id: string | null;
  is_active: boolean;
  deactivated_at: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AvailabilitySlot {
  id: string;
  professional_id: string;
  start_time: string;
  end_time: string;
  is_blocked: boolean;
}

export interface Booking {
  id: string;
  professional_id: string;
  slot_id: string;
  service_id: string | null;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  status: BookingStatus;
  payment_id: string | null;
  expires_at: string | null;
  management_token: string | null;
  created_at: string;
  /** Joins */
  slot?: { start_time: string; end_time: string };
  service?: { name: string; price: number; duration_minutes: number } | null;
}

export interface SlotWaitlist {
  id: string;
  slot_id: string;
  professional_id: string;
  client_name: string;
  client_email: string;
  notified: boolean;
  created_at: string;
}
