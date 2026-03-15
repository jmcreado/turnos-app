-- Tabla professionals (MVP Turnos App)
-- Ejecutar en el SQL Editor de Supabase si la tabla no existe o le faltan columnas.

-- Si ya tenés la tabla solo con columnas básicas, agregá las que falten con ALTER TABLE:
-- ALTER TABLE professionals ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id);
-- ALTER TABLE professionals ADD COLUMN IF NOT EXISTS service_name text;
-- ALTER TABLE professionals ADD COLUMN IF NOT EXISTS slug text UNIQUE;

-- Creación desde cero (opcional):
/*
CREATE TABLE IF NOT EXISTS professionals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  service_name text,
  slug text UNIQUE,
  session_duration_minutes integer NOT NULL DEFAULT 60,
  session_price numeric(10,2) NOT NULL DEFAULT 0,
  requires_payment boolean NOT NULL DEFAULT false,
  mp_access_token text,
  telegram_chat_id text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS availability_slots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  is_blocked boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  slot_id uuid NOT NULL REFERENCES availability_slots(id) ON DELETE CASCADE,
  client_name text NOT NULL,
  client_email text NOT NULL,
  client_phone text,
  status text NOT NULL CHECK (status IN ('PENDING','CONFIRMED','CANCELLED')),
  payment_id text,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- RLS: profesionales solo ven sus propios datos
ALTER TABLE professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profesionales ven y editan su perfil"
  ON professionals FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Profesionales gestionan sus slots"
  ON availability_slots FOR ALL USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  );

CREATE POLICY "Profesionales ven sus bookings"
  ON bookings FOR ALL USING (
    professional_id IN (SELECT id FROM professionals WHERE user_id = auth.uid())
  );

-- Clientes deben poder leer professional por slug y crear bookings (políticas adicionales según necesidad)
*/
