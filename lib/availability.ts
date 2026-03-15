/**
 * Lógica para generar slots de disponibilidad.
 * Días: 0 = Lunes, 6 = Domingo (orden español).
 */

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
