import { KCAL_PER_KG } from "./constants";
import { addDaysStr, diffDays } from "./dates";
import type { DailyTotal, MealItem, Totals } from "./types";

const round = (n: number, d = 1) => Math.round(n * 10 ** d) / 10 ** d;

/* ----------------------------- totales ----------------------------- */

export function sumItems(
  items: Pick<MealItem, "kcal" | "protein_g" | "carbs_g" | "fat_g">[],
): Totals {
  return items.reduce<Totals>(
    (t, i) => ({
      kcal: t.kcal + Number(i.kcal),
      protein_g: t.protein_g + Number(i.protein_g),
      carbs_g: t.carbs_g + Number(i.carbs_g),
      fat_g: t.fat_g + Number(i.fat_g),
    }),
    { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );
}

/* ----------------------------- peso ----------------------------- */

export type WeightPoint = { date: string; weight: number; avg: number };

/** Media móvil de `window` días corridos sobre pesajes ordenados por fecha. */
export function movingAverage(
  points: { date: string; weight: number }[],
  window = 7,
): WeightPoint[] {
  return points.map((p) => {
    const start = addDaysStr(p.date, -(window - 1));
    const inWindow = points.filter((q) => q.date >= start && q.date <= p.date);
    const avg = inWindow.reduce((s, q) => s + q.weight, 0) / inWindow.length;
    return { ...p, avg: round(avg, 2) };
  });
}

export type WeightSummary = {
  initial: number;
  current: number;
  change: number;
  /** kg por semana, calculado sobre la media móvil. null si hay < 7 días de datos. */
  ratePerWeek: number | null;
};

export function weightSummary(points: WeightPoint[]): WeightSummary | null {
  if (points.length === 0) return null;
  const first = points[0];
  const last = points[points.length - 1];
  const span = diffDays(first.date, last.date);
  return {
    initial: first.weight,
    current: last.weight,
    change: round(last.weight - first.weight, 2),
    ratePerWeek: span >= 7 ? round(((last.avg - first.avg) / span) * 7, 2) : null,
  };
}

/* ----------------------------- calorías ----------------------------- */

export type CaloriesSummary = {
  daysLogged: number;
  daysWithin: number;
  daysOver: number;
  avgKcal: number | null;
};

export function caloriesSummary(
  daily: Pick<DailyTotal, "kcal" | "meals_count">[],
  kcalGoal: number,
): CaloriesSummary {
  const logged = daily.filter((d) => d.meals_count > 0);
  const over = logged.filter((d) => Number(d.kcal) > kcalGoal).length;
  return {
    daysLogged: logged.length,
    daysWithin: logged.length - over,
    daysOver: over,
    avgKcal: logged.length
      ? Math.round(logged.reduce((s, d) => s + Number(d.kcal), 0) / logged.length)
      : null,
  };
}

/**
 * Gasto calórico estimado: intake − (variación de media móvil × 7700 / días).
 * Solo con ≥ 14 días que tengan peso y calorías registradas.
 */
export function estimateExpenditure(
  daily: Pick<DailyTotal, "day" | "kcal">[],
  points: WeightPoint[],
): { kcal: number; days: number } | null {
  const kcalByDay = new Map(daily.map((d) => [d.day, Number(d.kcal)]));
  const both = points.filter((p) => kcalByDay.has(p.date));
  if (both.length < 14) return null;

  const first = both[0];
  const last = both[both.length - 1];
  const span = diffDays(first.date, last.date);
  if (span < 13) return null;

  const inSpan = daily.filter((d) => d.day >= first.date && d.day <= last.date);
  const avgIntake = inSpan.reduce((s, d) => s + Number(d.kcal), 0) / inSpan.length;
  const delta = last.avg - first.avg;

  return {
    kcal: Math.round(avgIntake - (delta * KCAL_PER_KG) / span),
    days: both.length,
  };
}

/* ----------------------------- semanas ----------------------------- */

export type WeekSummary = {
  start: string;
  end: string;
  daysLogged: number;
  avgKcal: number | null;
  daysOver: number;
  bingeCount: number;
  bingeKcal: number;
  totalKcal: number;
  bingePct: number | null;
  weightChange: number | null;
  avgProtein: number | null;
};

export function buildWeeks(
  weekStarts: string[],
  daily: DailyTotal[],
  ma: WeightPoint[],
  kcalGoal: number,
): WeekSummary[] {
  return weekStarts.map((start) => {
    const end = addDaysStr(start, 6);
    const days = daily.filter((d) => d.day >= start && d.day <= end && d.meals_count > 0);
    const totalKcal = days.reduce((s, d) => s + Number(d.kcal), 0);
    const bingeKcal = days.reduce((s, d) => s + Number(d.binge_kcal), 0);

    const inWeek = ma.filter((p) => p.date >= start && p.date <= end);
    const before = ma.filter((p) => p.date < start);
    let weightChange: number | null = null;
    if (inWeek.length > 0) {
      const last = inWeek[inWeek.length - 1];
      const ref = before.length > 0 ? before[before.length - 1] : inWeek[0];
      if (ref.date !== last.date) weightChange = round(last.avg - ref.avg, 2);
    }

    return {
      start,
      end,
      daysLogged: days.length,
      avgKcal: days.length ? Math.round(totalKcal / days.length) : null,
      daysOver: days.filter((d) => Number(d.kcal) > kcalGoal).length,
      bingeCount: days.reduce((s, d) => s + d.binge_count, 0),
      bingeKcal: Math.round(bingeKcal),
      totalKcal: Math.round(totalKcal),
      bingePct: totalKcal > 0 ? round((bingeKcal / totalKcal) * 100, 1) : null,
      weightChange,
      avgProtein: days.length
        ? Math.round(days.reduce((s, d) => s + Number(d.protein_g), 0) / days.length)
        : null,
    };
  });
}
