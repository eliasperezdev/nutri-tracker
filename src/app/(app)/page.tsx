import { Composer } from "@/components/today/Composer";
import { DayNavigator } from "@/components/today/DayNavigator";
import { DaySummary } from "@/components/today/DaySummary";
import { MealList } from "@/components/today/MealList";
import { isValidDay, todayStr } from "@/lib/dates";
import { getMealsForDay, getSettings } from "@/lib/queries";
import { sumItems } from "@/lib/stats";
import { createClient } from "@/lib/supabase/server";

export default async function HoyPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const { d } = await searchParams;
  const today = todayStr();
  const day = isValidDay(d) ? d : today;

  const supabase = await createClient();
  const [settings, meals] = await Promise.all([
    getSettings(supabase),
    getMealsForDay(supabase, day),
  ]);
  const totals = sumItems(meals.flatMap((m) => m.meal_items));

  return (
    <>
      <DayNavigator day={day} today={today} />
      <DaySummary totals={totals} settings={settings} />
      <MealList meals={meals} />
      {/* espacio para el input fijo */}
      <div className="h-36" />
      <Composer day={day} today={today} meals={meals} />
    </>
  );
}
