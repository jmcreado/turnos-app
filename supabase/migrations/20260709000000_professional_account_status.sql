-- ============================================================
-- Tornu — Estado de cuenta del profesional (desactivar/reactivar)
-- Ejecutar en Supabase → SQL Editor
-- ============================================================

ALTER TABLE professionals
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

ALTER TABLE professionals
  ADD COLUMN IF NOT EXISTS deactivated_at timestamptz;
