import { Card } from "@/components/ui/Card";
import { formatDayShort } from "@/lib/dates";
import { fmt, fmtSigned } from "@/lib/format";
import type { WeekSummary } from "@/lib/stats";

function Metric({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div>
      <div className="text-[11px] text-neutral-500">{label}</div>
      <div className="font-semibold tabular-nums">{value}</div>
      {hint && <div className="text-[11px] text-neutral-400">{hint}</div>}
    </div>
  );
}

/** Una tarjeta por semana (lunes a domingo), la más reciente primero. */
export function WeeklySummary({ weeks }: { weeks: WeekSummary[] }) {
  return (
    <div className="space-y-2">
      {weeks
        .slice()
        .reverse()
        .map((w) => (
          <Card key={w.start} className="p-3">
            <div className="mb-2 text-sm font-semibold">
              {formatDayShort(w.start)} – {formatDayShort(w.end)}
              <span className="ml-2 font-normal text-neutral-400">{w.daysLogged} días con registro</span>
            </div>
            {w.daysLogged === 0 ? (
              <p className="text-sm text-neutral-500">Sin comidas registradas.</p>
            ) : (
              <div className="grid grid-cols-3 gap-x-3 gap-y-3">
                <Metric label="Promedio" value={w.avgKcal === null ? "—" : `${fmt(w.avgKcal)} kcal`} />
                <Metric label="Días sobre la meta" value={`${w.daysOver} de ${w.daysLogged}`} />
                <Metric label="Episodios registrados" value={`${w.bingeCount}`} />
                <Metric
                  label="Cambio de peso"
                  value={w.weightChange === null ? "—" : `${fmtSigned(w.weightChange, 2)} kg`}
                  hint="media móvil"
                />
                <Metric label="Proteína prom." value={w.avgProtein === null ? "—" : `${fmt(w.avgProtein)} g`} />
                <Metric
                  label="Comidas marcadas"
                  value={w.bingePct === null ? "—" : `${fmt(w.bingePct, 1)} %`}
                  hint={`${fmt(w.bingeKcal)} kcal`}
                />
              </div>
            )}
          </Card>
        ))}
    </div>
  );
}
