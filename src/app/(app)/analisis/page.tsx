import clsx from "clsx";
import Link from "next/link";
import { BingeShareChart, type ShareRow } from "@/components/analysis/BingeShareChart";
import { EpisodesList } from "@/components/analysis/EpisodesList";
import { MacrosStackedChart, type MacroDay } from "@/components/analysis/MacrosStackedChart";
import { PatternCharts, type CountRow } from "@/components/analysis/PatternCharts";
import { WeeklySummary } from "@/components/analysis/WeeklySummary";
import { Card, SectionTitle } from "@/components/ui/Card";
import { NO_TAG_LABEL } from "@/lib/constants";
import {
  addDaysStr,
  eachDay,
  formatDayShort,
  hourOf,
  localDayOf,
  todayStr,
  weekdayMon0,
  weekStart,
} from "@/lib/dates";
import { getDailyTotals, getEpisodes, getSettings, getWeighIns } from "@/lib/queries";
import { buildWeeks, movingAverage } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";

const WEEKDAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

export default async function AnalisisPage({
  searchParams,
}: {
  searchParams: Promise<{ w?: string }>;
}) {
  const { w } = await searchParams;
  const weeksCount = w === "4" ? 4 : 8;

  const today = todayStr();
  const lastWeek = weekStart(today);
  const firstWeek = addDaysStr(lastWeek, -7 * (weeksCount - 1));
  const weekStarts = Array.from({ length: weeksCount }, (_, i) => addDaysStr(firstWeek, i * 7));

  const supabase = await createClient();
  const [settings, weighIns, daily, episodes] = await Promise.all([
    getSettings(supabase),
    getWeighIns(supabase),
    getDailyTotals(supabase, firstWeek),
    getEpisodes(supabase, firstWeek),
  ]);

  const ma = movingAverage(weighIns.map((x) => ({ date: x.measured_at, weight: x.weight_kg })));
  const weeks = buildWeeks(weekStarts, daily, ma, settings.kcal_goal);

  const share: ShareRow[] = weeks.map((x) => ({
    label: formatDayShort(x.start),
    marked: x.bingeKcal,
    rest: Math.max(0, x.totalKcal - x.bingeKcal),
    pct: x.bingePct,
  }));

  // Patrones
  const hourCounts = Array.from({ length: 24 }, () => 0);
  const weekdayCounts = Array.from({ length: 7 }, () => 0);
  const tagCounts = new Map<string, number>();
  for (const e of episodes) {
    hourCounts[hourOf(e.eaten_at)] += 1;
    weekdayCounts[weekdayMon0(localDayOf(e.eaten_at))] += 1;
    const tags = e.binge_tags.length > 0 ? e.binge_tags : [NO_TAG_LABEL];
    for (const t of tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  }
  const byHour: CountRow[] = hourCounts.map((count, h) => ({ label: `${h}`, count }));
  const byWeekday: CountRow[] = weekdayCounts.map((count, i) => ({ label: WEEKDAYS[i], count }));
  const byTag: CountRow[] = [...tagCounts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  const filterTags = byTag.map((t) => t.label).filter((t) => t !== NO_TAG_LABEL);

  // Macros diarios
  const byDay = new Map(daily.map((d) => [d.day, d]));
  const macroDays: MacroDay[] = eachDay(firstWeek, today).map((day) => {
    const d = byDay.get(day);
    return d && d.meals_count > 0
      ? { day, protein: Math.round(d.protein_g), carbs: Math.round(d.carbs_g), fat: Math.round(d.fat_g) }
      : { day, protein: null, carbs: null, fat: null };
  });

  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Análisis</h1>
        <div className="flex gap-1 rounded-xl bg-neutral-200/70 p-1">
          {[4, 8].map((n) => (
            <Link
              key={n}
              href={`/analisis?w=${n}`}
              replace
              className={clsx(
                "flex h-9 items-center rounded-lg px-3 text-sm font-medium",
                weeksCount === n ? "bg-white shadow-sm" : "text-neutral-600",
              )}
            >
              {n} semanas
            </Link>
          ))}
        </div>
      </div>

      <SectionTitle>Resumen semanal</SectionTitle>
      <WeeklySummary weeks={weeks} />

      <SectionTitle>Aporte de las comidas marcadas gula / roto</SectionTitle>
      <Card className="px-2 py-3">
        <BingeShareChart data={share} />
      </Card>

      <PatternCharts byHour={byHour} byWeekday={byWeekday} byTag={byTag} />

      <SectionTitle>Episodios recientes</SectionTitle>
      <EpisodesList episodes={episodes} tags={filterTags} />

      <SectionTitle>Macros diarios</SectionTitle>
      <Card className="px-2 py-3">
        <MacrosStackedChart data={macroDays} proteinGoal={settings.protein_goal_g} />
      </Card>
    </>
  );
}
