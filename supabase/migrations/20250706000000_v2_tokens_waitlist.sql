-- ============================================================
-- Tornu v2 Migration
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

-- 1. Token único para magic link de gestión de turnos (cliente)
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS management_token uuid DEFAULT gen_random_uuid();

CREATE UNIQUE INDEX IF NOT EXISTS bookings_management_token_idx
  ON bookings(management_token);

-- Asegurar que service_id existe (puede ya estar)
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES services(id);

-- 2. Tabla de lista de espera (máximo un entry por slot por email)
CREATE TABLE IF NOT EXISTS slot_waitlist (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slot_id         uuid NOT NULL REFERENCES availability_slots(id) ON DELETE CASCADE,
  professional_id uuid NOT NULL REFERENCES professionals(id) ON DELETE CASCADE,
  client_name     text NOT NULL,
  client_email    text NOT NULL,
  notified        boolean NOT NULL DEFAULT false,
  created_at      timestamptz DEFAULT now(),
  UNIQUE(slot_id, client_email)
);

ALTER TABLE slot_waitlist ENABLE ROW LEVEL SECURITY;

-- Cualquier cliente puede anotarse en la lista de espera
CREATE POLICY "Público puede insertarse en waitlist"
  ON slot_waitlist FOR INSERT
  WITH CHECK (true);

-- Lectura pública (para chequear si ya está anotado)
CREATE POLICY "Público puede leer waitlist"
  ON slot_waitlist FOR SELECT
  USING (true);

-- Profesionales gestionan su propia waitlist
CREATE POLICY "Profesionales gestionan su waitlist"
  ON slot_waitlist FOR ALL USING (
    professional_id IN (
      SELECT id FROM professionals WHERE user_id = auth.uid()
    )
  );

-- 3. Permitir que clientes lean/actualicen su booking por token
--    (La validación real la hace el admin client en el server action)
CREATE POLICY IF NOT EXISTS "Público puede leer bookings"
  ON bookings FOR SELECT
  USING (true);
