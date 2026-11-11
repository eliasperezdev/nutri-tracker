import { CaloriesChart, type CalorieDay } from "@/components/progress/CaloriesChart";
import { RANGES, RangeSelector } from "@/components/progress/RangeSelector";
import { CalorieStats, WeightStats } from "@/components/progress/StatsGrid";
import { WeighInSection } from "@/components/progress/WeighInSection";
import { WeightChart } from "@/components/progress/WeightChart";
import { Card, SectionTitle } from "@/components/ui/Card";
import { addDaysStr, eachDay, todayStr } from "@/lib/dates";
import { getDailyTotals, getSettings, getWeighIns } from "@/lib/queries";
import {
  caloriesSummary,
  estimateExpenditure,
  movingAverage,
  weightSummary,
} from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";

export default async function ProgresoPage({
  searchParams,
}: {
  searchParams: Promise<{ r?: string }>;
}) {
  const { r } = await searchParams;
  const range = RANGES.some((x) => x.key === r) ? (r as string) : "30";
  const today = todayStr();
  const fromDay = range === "all" ? undefined : addDaysStr(today, -(Number(range) - 1));

  const supabase = await createClient();
  const [settings, weighIns, dailyAll] = await Promise.all([
    getSettings(supabase),
    getWeighIns(supabase),
    getDailyTotals(supabase, fromDay),
  ]);

  // La media móvil se calcula con toda la historia y luego se recorta al rango.
  const allPoints = movingAverage(
    weighIns.map((w) => ({ date: w.measured_at, weight: w.weight_kg })),
  );
  const points = fromDay ? allPoints.filter((p) => p.date >= fromDay) : allPoints;
  const daily = dailyAll.filter((d) => d.meals_count > 0);

  const start = fromDay ?? [daily[0]?.day, points[0]?.date].filter(Boolean).sort()[0] ?? today;
  const byDay = new Map(daily.map((d) => [d.day, d]));
  const calorieDays: CalorieDay[] = eachDay(start, today).map((day) => {
    const d = byDay.get(day);
    return {
      day,
      kcal: d ? d.kcal : null,
      protein_g: d?.protein_g ?? 0,
      carbs_g: d?.carbs_g ?? 0,
      fat_g: d?.fat_g ?? 0,
    };
  });

  const inRangeWeighIns = (fromDay ? weighIns.filter((w) => w.measured_at >= fromDay) : weighIns)
    .slice()
    .reverse()
    .slice(0, 30);

  return (
    <>
      <h1 className="mb-3 text-xl font-semibold">Progreso</h1>
      <RangeSelector current={range} />

      <SectionTitle>Registrar peso</SectionTitle>
      <WeighInSection weighIns={inRangeWeighIns} today={today} />

      <SectionTitle>Peso</SectionTitle>
      <Card className="px-2 py-3">
        <WeightChart points={points} target={settings.target_weight_kg} />
      </Card>
      <WeightStats summary={weightSummary(points)} />

      <SectionTitle>Calorías diarias</SectionTitle>
      <Card className="px-2 py-3">
        <CaloriesChart data={calorieDays} goal={settings.kcal_goal} />
        <div className="mt-1 flex justify-center gap-4 text-xs text-neutral-500">
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-400" /> Dentro de la meta
          </span>
          <span className="flex items-center gap-1.5">
            <i className="inline-block h-2.5 w-2.5 rounded-sm bg-orange-500" /> Sobre la meta
          </span>
        </div>
      </Card>
      <CalorieStats
        summary={caloriesSummary(daily, settings.kcal_goal)}
        expenditure={estimateExpenditure(daily, points)}
      />
    </>
  );
}
