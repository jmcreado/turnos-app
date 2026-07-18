-- ============================================================
-- Waitlist de lanzamiento (landing coming-soon)
-- Distinta de slot_waitlist (que es lista de espera por slot).
-- ============================================================

CREATE TABLE IF NOT EXISTS launch_waitlist (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email      text NOT NULL UNIQUE,
  source     text NOT NULL DEFAULT 'coming_soon',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS activado y SIN policies públicas: solo el service role
-- (server action) puede insertar/leer. Anon no toca esta tabla.
ALTER TABLE launch_waitlist ENABLE ROW LEVEL SECURITY;
