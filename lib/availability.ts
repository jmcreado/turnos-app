/**
 * Lógica para generar slots de disponibilidad.
 * Días: 0 = Lunes, 6 = Domingo (orden español).
 */

export const SLOT_GRANULARITY_MINUTES = 15;

export const WEEKDAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;

export type WeekdayConfig = {
  active: boolean;
  startTime: string;  // "09:00"
  endTime: string;    // "18:00"
  serviceId?: string | null; // restricción opcional por servicio
};

/** Configuración semanal: índice 0 = Lunes, 6 = Domingo */
export type WeeklyConfig = WeekdayConfig[];

export function getWeekdayIndex(d: Date): number {
  const jsDay = d.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

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
      if (slotStart <= now) continue;

      const slotEnd = new Date(slotStart.getTime() + durationMinutes * 60 * 1000);
      slots.push({ start: slotStart.toISOString(), end: slotEnd.toISOString() });
    }
  }

  return slots;
}

/** Crea una config semanal por defecto (Lun-Vie 9-18, sin restricción de servicio) */
export function defaultWeeklyConfig(): WeeklyConfig {
  return WEEKDAY_LABELS.map((_, i) => ({
    active: i < 5,
    startTime: "09:00",
    endTime: "18:00",
    serviceId: null,
  }));
}

export type SlotLike = { id: string; start_time: string; end_time: string; is_blocked?: boolean };
export type OccupiedRange = { start: string; end: string };

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

    let coveredUntil = new Date(slot.end_time).getTime();
    let ok = !overlapsOccupied(startMs, Math.min(coveredUntil, neededEndMs));
    let j = i;
    while (ok && coveredUntil < neededEndMs) {
      const next = sorted[j + 1];
      if (!next || next.is_blocked || new Date(next.start_time).getTime() !== coveredUntil) {
        ok = false; break;
      }
      const nextEndMs = new Date(next.end_time).getTime();
      if (overlapsOccupied(coveredUntil, Math.min(nextEndMs, neededEndMs))) {
        ok = false; break;
      }
      coveredUntil = nextEndMs;
      j++;
    }

    if (ok && coveredUntil >= neededEndMs) result.push(slot);
  }

  return result;
}

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
