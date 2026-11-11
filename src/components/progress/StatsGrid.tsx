import { Card } from "@/components/ui/Card";
import { fmt, fmtSigned } from "@/lib/format";
import type { CaloriesSummary, WeightSummary } from "@/lib/stats";

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <div className="text-xs text-neutral-500">{label}</div>
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      {hint && <div className="text-[11px] text-neutral-400">{hint}</div>}
    </div>
  );
}

export function WeightStats({ summary }: { summary: WeightSummary | null }) {
  if (!summary) return null;
  const { initial, current, change, ratePerWeek } = summary;
  return (
    <Card className="mt-3 grid grid-cols-2 gap-4">
      <Stat label="Peso inicial" value={`${fmt(initial, 1)} kg`} />
      <Stat label="Peso actual" value={`${fmt(current, 1)} kg`} />
      <Stat
        label={change <= 0 ? "Total perdido" : "Total ganado"}
        value={`${fmt(Math.abs(change), 1)} kg`}
        hint={change === 0 ? "sin cambios" : undefined}
      />
      <Stat
        label="Ritmo por semana"
        value={ratePerWeek === null ? "—" : `${fmtSigned(ratePerWeek, 2)} kg`}
        hint={ratePerWeek === null ? "necesita 7+ días de datos" : "sobre la media móvil"}
      />
    </Card>
  );
}

export function CalorieStats({
  summary,
  expenditure,
}: {
  summary: CaloriesSummary;
  expenditure: { kcal: number; days: number } | null;
}) {
  return (
    <>
      <Card className="mt-3 grid grid-cols-3 gap-3">
        <Stat label="Dentro de meta" value={`${summary.daysWithin}`} hint="días" />
        <Stat label="Sobre la meta" value={`${summary.daysOver}`} hint="días" />
        <Stat
          label="Promedio diario"
          value={summary.avgKcal === null ? "—" : `${fmt(summary.avgKcal)}`}
          hint="kcal"
        />
      </Card>
      <Card className="mt-3">
        <div className="text-xs text-neutral-500">Gasto calórico estimado</div>
        {expenditure ? (
          <>
            <div className="text-lg font-semibold tabular-nums">≈ {fmt(expenditure.kcal)} kcal/día</div>
            <p className="mt-1 text-xs text-neutral-500">
              Estimación a partir de {expenditure.days} días con peso y calorías: variación de la media móvil de
              peso (≈ 7700 kcal por kg) y promedio de calorías registradas. Si hay comidas sin cargar, el
              valor real puede ser mayor.
            </p>
          </>
        ) : (
          <p className="mt-1 text-sm text-neutral-500">
            Se muestra cuando hay al menos 14 días con peso y calorías registrados en el rango.
          </p>
        )}
      </Card>
    </>
  );
}
