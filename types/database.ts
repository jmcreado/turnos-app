/**
 * Tipos del modelo de datos (Supabase).
 * professionals incluye slug y service_name para el dashboard (agregar a la tabla si no existen).
 */

export type BookingStatus = "PENDING" | "CONFIRMED" | "CANCELLED";

export interface Professional {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  /** Nombre del servicio que ofrece (ej. "Consulta psicológica") */
  service_name: string | null;
  /** Slug único para la URL de reserva (ej. "maria-lopez") */
  slug: string | null;
  session_duration_minutes: number;
  session_price: number;
  requires_payment: boolean;
  mp_access_token: string | null;
  telegram_chat_id: string | null;
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
  client_name: string;
  client_email: string;
  client_phone: string | null;
  status: BookingStatus;
  payment_id: string | null;
  expires_at: string | null;
  created_at: string;
  /** Joins: slot para start_time/end_time */
  slot?: { start_time: string; end_time: string };
}
