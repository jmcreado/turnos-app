/**
 * Formateo de fechas determinista (mismo resultado en servidor y cliente)
 * para evitar errores de hydration. Usa los componentes UTC del ISO string.
 */

const MESES = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

const DIAS_SEMANA = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];

/** Índice 0 = Lunes, 6 = Domingo (igual que WEEKDAY_LABELS en availability) */
export const WEEKDAY_LABELS_UTC = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"] as const;

function parseIso(iso: string): { y: number; m: number; d: number; h: number; min: number; dayOfWeek: number } {
  const d = new Date(iso);
  return {
    y: d.getUTCFullYear(),
    m: d.getUTCMonth(),
    d: d.getUTCDate(),
    h: d.getUTCHours(),
    min: d.getUTCMinutes(),
    dayOfWeek: d.getUTCDay(),
  };
}

/** Índice 0 = Lunes, 6 = Domingo. Determinista (UTC). */
export function getWeekdayIndexFromIso(iso: string): number {
  const day = new Date(iso).getUTCDay();
  return day === 0 ? 6 : day - 1;
}

/** Clave YYYY-MM-DD de la semana (lunes) para agrupar slots. UTC. */
export function getWeekKeyFromIso(iso: string): string {
  const d = new Date(iso);
  const day = d.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + diff));
  return `${monday.getUTCFullYear()}-${String(monday.getUTCMonth() + 1).padStart(2, "0")}-${String(monday.getUTCDate()).padStart(2, "0")}`;
}

/**
 * Hora en formato "09:00" (siempre 2 dígitos).
 */
export function formatSlotTime(iso: string): string {
  const { h, min } = parseIso(iso);
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/**
 * Fecha corta con día de semana: "lun 17 mar".
 */
export function formatSlotDateShort(iso: string): string {
  const { d, m, dayOfWeek } = parseIso(iso);
  return `${DIAS_SEMANA[dayOfWeek]} ${d} ${MESES[m]}`;
}

/**
 * Fecha para mensajes: "lun 17 mar, 09:00".
 */
export function formatSlotDateTime(iso: string): string {
  return `${formatSlotDateShort(iso)}, ${formatSlotTime(iso)}`;
}
