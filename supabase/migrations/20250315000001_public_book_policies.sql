-- Políticas para la página pública de reservas (app/book/[slug]).
-- Ejecutar en el SQL Editor de Supabase después de tener las tablas y RLS básico.

-- Cualquiera puede leer un professional (para mostrar nombre, servicio, precio).
CREATE POLICY "Público puede leer professionals"
  ON professionals FOR SELECT
  USING (true);

-- Cualquiera puede leer availability_slots (solo los no bloqueados se muestran en la app).
CREATE POLICY "Público puede leer availability_slots"
  ON availability_slots FOR SELECT
  USING (true);

-- Cualquiera puede crear una reserva (booking). La app valida professional_id y slot_id.
CREATE POLICY "Público puede crear bookings"
  ON bookings FOR INSERT
  WITH CHECK (true);

-- Los profesionales siguen pudiendo ver/editar sus datos con las políticas que los vinculan por user_id.
