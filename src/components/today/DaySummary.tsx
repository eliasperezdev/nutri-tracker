import { Card } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { fmt } from "@/lib/format";
import type { Settings, Totals } from "@/lib/types";

export function DaySummary({ totals, settings }: { totals: Totals; settings: Settings }) {
  const remaining = settings.kcal_goal - totals.kcal;
  return (
    <Card className="space-y-4">
      <div>
        <div className="flex items-baseline justify-between">
          <div>
            <span className="text-3xl font-bold tabular-nums">{fmt(totals.kcal)}</span>
            <span className="ml-1 text-sm text-neutral-500">/ {fmt(settings.kcal_goal)} kcal</span>
          </div>
          <span className="text-sm text-neutral-500">
            {remaining >= 0
              ? `Restan ${fmt(remaining)} kcal`
              : `${fmt(-remaining)} kcal sobre la meta`}
          </span>
        </div>
        <div className="mt-2">
          <ProgressBar label="Calorías" value={totals.kcal} goal={settings.kcal_goal} unit="kcal" thick />
        </div>
      </div>
      <div className="grid gap-3">
        <ProgressBar label="Proteína" value={totals.protein_g} goal={settings.protein_goal_g} unit="g" color="bg-sky-600" />
        <ProgressBar label="Carbohidratos" value={totals.carbs_g} goal={settings.carbs_goal_g} unit="g" color="bg-amber-500" />
        <ProgressBar label="Grasas" value={totals.fat_g} goal={settings.fat_goal_g} unit="g" color="bg-rose-400" />
      </div>
    </Card>
  );
}
