/**
 * Lógica para generar slots de disponibilidad.
 * Días: 0 = Lunes, 6 = Domingo (orden español).
 */

/**
 * Granularidad atómica de los slots generados. Los servicios pueden tener
 * cualquier duración (múltiplo de esto, idealmente); la disponibilidad real
 * para cada servicio se calcula dinámicamente con `computeBookableStarts`,
 * buscando rachas continuas y libres de slots atómicos.
 */
export const SLOT_GRANULARITY_MINUTES = 15;

export const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;

export type WeekdayConfig = {
  active: boolean;
  startTime: string; // "09:00"
  endTime: string;   // "18:00"
};

/** Configuración semanal: índice 0 = Lunes, 6 = Domingo */
export type WeeklyConfig = WeekdayConfig[];

/** Dado un Date, devuelve el índice en nuestra semana (0=Lun, 6=Dom) */
export function getWeekdayIndex(d: Date): number {
  const jsDay = d.getDay(); // 0=Dom, 1=Lun, ..., 6=Sab
  return jsDay === 0 ? 6 : jsDay - 1;
}

/**
 * Genera las fechas de inicio de cada slot para las próximas N semanas.
 * startTime/endTime en formato "HH:mm". durationMinutes = duración de cada slot.
 * Devuelve { start: ISO, end: ISO } en hora local del servidor (luego se guardan como ISO).
 */
export function generateSlotTimes(
  weeklyConfig: WeeklyConfig,
  durationMinutes: number,
  weeksAhead: number = 4
): { start: string; end: string }[] {
  const slots: { start: string; end: string }[] = [];
  const now = new Date();
  const startDate = new Date(now);
  startDate.setHours(0, 0, 0, 0);

  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + weeksAhead * 7);

  for (let d = new Date(startDate); d < endDate; d.setDate(d.getDate() + 1)) {
    const weekdayIndex = getWeekdayIndex(d);
    const dayConfig = weeklyConfig[weekdayIndex];
    if (!dayConfig?.active) continue;

    const [startH, startM] = dayConfig.startTime.split(":").map(Number);
    const [endH, endM] = dayConfig.endTime.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    for (let min = startMinutes; min + durationMinutes <= endMinutes; min += durationMinutes) {
      const slotStart = new Date(d);
      slotStart.setHours(Math.floor(min / 60), min % 60, 0, 0);
      if (slotStart <= now) continue; // no generar slots en el pasado

      const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);
      slots.push({
        start: slotStart.toISOString(),
        end: slotEnd.toISOString(),
      });
    }
  }

  return slots;
}

/** Crea una config semanal por defecto (Lun–Vie 9–18) */
export function defaultWeeklyConfig(): WeeklyConfig {
  return WEEKDAY_LABELS.map((_, i) => ({
    active: i < 5,
    startTime: "09:00",
    endTime: "18:00",
  }));
}

// ────────────────────────────────────────────────────────────────────────────
// Cálculo dinámico de disponibilidad por servicio
// ────────────────────────────────────────────────────────────────────────────

export type SlotLike = { id: string; start_time: string; end_time: string; is_blocked?: boolean };

/** Rango de tiempo ya ocupado por un turno existente (inicio + duración real del servicio). */
export type OccupiedRange = { start: string; end: string };

/**
 * Dados los slots atómicos de un profesional (grano fino, ej. 15 min) y los
 * rangos ya ocupados por turnos existentes (con la duración real de cada
 * servicio, no el tamaño del slot), calcula qué slots son puntos de inicio
 * válidos para un turno nuevo de `serviceDurationMinutes`.
 *
 * No asume que los slots ya vienen en el grano correcto para el servicio:
 * busca rachas continuas (slot[i].end_time === slot[i+1].start_time) que no
 * estén bloqueadas ni se crucen con ningún rango ocupado, y devuelve los
 * slots de esa racha desde los que alcanza el tiempo para completar la
 * duración pedida.
 */
export function computeBookableStarts(
  slots: SlotLike[],
  occupiedRanges: OccupiedRange[],
  serviceDurationMinutes: number
): SlotLike[] {
  const sorted = [...slots].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  const occupied = occupiedRanges
    .map(r => ({ start: new Date(r.start).getTime(), end: new Date(r.end).getTime() }))
    .sort((a, b) => a.start - b.start);

  function overlapsOccupied(startMs: number, endMs: number): boolean {
    return occupied.some(o => startMs < o.end && endMs > o.start);
  }

  const durationMs = serviceDurationMinutes * 60 * 1000;
  const result: SlotLike[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const slot = sorted[i]!;
    if (slot.is_blocked) continue;

    const startMs = new Date(slot.start_time).getTime();
    const neededEndMs = startMs + durationMs;

    // Verificar que exista una racha continua y libre desde `slot` hasta cubrir la duración
    let coveredUntil = new Date(slot.end_time).getTime();
    let ok = !overlapsOccupied(startMs, Math.min(coveredUntil, neededEndMs));
    let j = i;
    while (ok && coveredUntil < neededEndMs) {
      const next = sorted[j + 1];
      if (!next || next.is_blocked || new Date(next.start_time).getTime() !== coveredUntil) {
        ok = false;
        break;
      }
      const nextEndMs = new Date(next.end_time).getTime();
      if (overlapsOccupied(coveredUntil, Math.min(nextEndMs, neededEndMs))) {
        ok = false;
        break;
      }
      coveredUntil = nextEndMs;
      j++;
    }

    if (ok && coveredUntil >= neededEndMs) {
      result.push(slot);
    }
  }

  return result;
}

/**
 * Dado un conjunto de slots atómicos ya filtrados (futuros, no bloqueados),
 * devuelve la duración (en minutos) de la racha continua más larga.
 * Sirve para advertir si un servicio de cierta duración nunca va a tener
 * horarios reservables con la disponibilidad configurada actual.
 */
export function getMaxContiguousWindowMinutes(slots: SlotLike[]): number {
  if (slots.length === 0) return 0;

  const sorted = [...slots].sort(
    (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
  );

  let max = 0;
  let runStart = new Date(sorted[0]!.start_time).getTime();
  let runEnd = new Date(sorted[0]!.end_time).getTime();

  for (let i = 1; i < sorted.length; i++) {
    const startMs = new Date(sorted[i]!.start_time).getTime();
    const endMs = new Date(sorted[i]!.end_time).getTime();
    if (startMs === runEnd) {
      runEnd = endMs;
    } else {
      max = Math.max(max, (runEnd - runStart) / 60000);
      runStart = startMs;
      runEnd = endMs;
    }
  }
  max = Math.max(max, (runEnd - runStart) / 60000);

  return max;
}
