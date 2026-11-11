import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { es } from "date-fns/locale";
import type { MealType } from "./constants";

/**
 * Zona horaria de la app. Fuente única para TypeScript.
 * (La función SQL public.local_day tiene la misma zona fija.)
 *
 * Convención: un "día" es un string "YYYY-MM-DD" en hora de Buenos Aires.
 * Las fechas guardadas en la base son instantes UTC (ISO).
 */
export const APP_TIMEZONE = "America/Argentina/Buenos_Aires";

const DAY_RE = /^\d{4}-\d{2}-\d{2}$/;
const MS_DAY = 86_400_000;

/** Fecha como Date a mediodía UTC: evita saltos por huso al sumar días. */
const noonUtc = (day: string) => new Date(`${day}T12:00:00Z`);

export function isValidDay(value: string | undefined | null): value is string {
  if (!value || !DAY_RE.test(value)) return false;
  const d = noonUtc(value);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

/** Día actual (YYYY-MM-DD) en hora de Buenos Aires. */
export function todayStr(now: Date = new Date()): string {
  return formatInTimeZone(now, APP_TIMEZONE, "yyyy-MM-dd");
}

/** Día local (BA) de un instante ISO/UTC. */
export function localDayOf(iso: string | Date): string {
  return formatInTimeZone(iso, APP_TIMEZONE, "yyyy-MM-dd");
}

export function addDaysStr(day: string, n: number): string {
  return new Date(noonUtc(day).getTime() + n * MS_DAY).toISOString().slice(0, 10);
}

export function diffDays(a: string, b: string): number {
  return Math.round((noonUtc(b).getTime() - noonUtc(a).getTime()) / MS_DAY);
}

/** Lista de días desde `from` hasta `to`, ambos inclusive. */
export function eachDay(from: string, to: string): string[] {
  const out: string[] = [];
  for (let d = from; d <= to; d = addDaysStr(d, 1)) out.push(d);
  return out;
}

/** Inicio (UTC, ISO) de un día de BA. */
export function dayStartUtc(day: string): string {
  return fromZonedTime(`${day}T00:00:00`, APP_TIMEZONE).toISOString();
}

/** Rango UTC [start, end) que cubre exactamente un día de BA. */
export function dayToUtcRange(day: string): { start: string; end: string } {
  return { start: dayStartUtc(day), end: dayStartUtc(addDaysStr(day, 1)) };
}

/** Instante UTC (ISO) de una hora local de BA en un día dado. */
export function atLocalTime(day: string, hour: number, minute = 0): string {
  const hh = String(hour).padStart(2, "0");
  const mm = String(minute).padStart(2, "0");
  return fromZonedTime(`${day}T${hh}:${mm}:00`, APP_TIMEZONE).toISOString();
}

/** Hora típica de cada comida, para cargar comidas en días pasados. */
export const TYPICAL_HOUR: Record<MealType, number> = {
  desayuno: 9,
  almuerzo: 13,
  merienda: 17,
  cena: 21,
  snack: 16,
};

export function atTypicalTime(day: string, type: MealType): string {
  return atLocalTime(day, TYPICAL_HOUR[type]);
}

/** Valor para <input type="datetime-local"> (hora de BA). */
export function toInputValue(iso: string): string {
  return formatInTimeZone(iso, APP_TIMEZONE, "yyyy-MM-dd'T'HH:mm");
}

/** Convierte el valor de <input type="datetime-local"> (hora BA) a ISO UTC. */
export function fromInputValue(value: string): string | null {
  if (!value) return null;
  const d = fromZonedTime(value, APP_TIMEZONE);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

export function timeOf(iso: string): string {
  return formatInTimeZone(iso, APP_TIMEZONE, "HH:mm");
}

export function hourOf(iso: string): number {
  return Number(formatInTimeZone(iso, APP_TIMEZONE, "H"));
}

/** Lunes = 0 … Domingo = 6 */
export function weekdayMon0(day: string): number {
  return (noonUtc(day).getUTCDay() + 6) % 7;
}

/** Lunes de la semana a la que pertenece `day`. */
export function weekStart(day: string): string {
  return addDaysStr(day, -weekdayMon0(day));
}

const fmtDay = (day: string, pattern: string) =>
  formatInTimeZone(noonUtc(day), "UTC", pattern, { locale: es });

/** "martes 10 de noviembre" */
export const formatDayLong = (day: string) => fmtDay(day, "EEEE d 'de' MMMM");
/** "10 nov" */
export const formatDayShort = (day: string) => fmtDay(day, "d MMM");
/** "mar 10 nov" */
export const formatDayWithWeekday = (day: string) => fmtDay(day, "EEE d MMM");

/** Ej.: "martes 10 de noviembre 2026, 23:30" en hora de Buenos Aires. */
export function formatAppDateTime(date: Date | string): string {
  return formatInTimeZone(date, APP_TIMEZONE, "EEEE d 'de' MMMM yyyy, HH:mm", {
    locale: es,
  });
}

/** Tipo de comida sugerido según la hora local (para carga manual). */
export function guessMealType(date: Date = new Date()): MealType {
  const h = hourOf(date.toISOString());
  if (h >= 5 && h < 11) return "desayuno";
  if (h >= 11 && h < 15) return "almuerzo";
  if (h >= 15 && h < 19) return "merienda";
  if (h >= 19) return "cena";
  return "snack";
}
