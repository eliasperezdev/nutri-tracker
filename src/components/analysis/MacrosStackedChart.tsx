"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDayShort, formatDayWithWeekday } from "@/lib/dates";
import { fmt } from "@/lib/format";

export type MacroDay = { day: string; protein: number | null; carbs: number | null; fat: number | null };

type TipProps = { active?: boolean; payload?: ReadonlyArray<{ payload: MacroDay }> };

function Tip({ active, payload }: TipProps) {
  const d = active ? payload?.[0]?.payload : undefined;
  if (!d || d.protein === null) return null;
  return (
    <div className="rounded-lg bg-white p-2.5 text-xs shadow-lg ring-1 ring-neutral-200">
      <div className="mb-1 font-semibold capitalize">{formatDayWithWeekday(d.day)}</div>
      <div className="font-semibold text-sky-700">Proteína {fmt(d.protein ?? 0)} g</div>
      <div>Carbohidratos {fmt(d.carbs ?? 0)} g</div>
      <div>Grasas {fmt(d.fat ?? 0)} g</div>
    </div>
  );
}

/**
 * Macros diarios apilados (g). La proteína va abajo y resaltada: la línea
 * punteada marca su meta, así se compara directo con la altura de ese tramo.
 */
export function MacrosStackedChart({ data, proteinGoal }: { data: MacroDay[]; proteinGoal: number }) {
  if (!data.some((d) => d.protein !== null)) {
    return <p className="py-10 text-center text-sm text-neutral-500">Todavía no hay comidas en este período.</p>;
  }
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
          <XAxis dataKey="day" tickFormatter={(d: string) => formatDayShort(d)} tick={{ fontSize: 11 }} minTickGap={24} />
          <YAxis tick={{ fontSize: 11 }} width={44} tickFormatter={(v: number) => fmt(v)} />
          <Tooltip content={<Tip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <ReferenceLine
            y={proteinGoal}
            stroke="#0369a1"
            strokeDasharray="5 4"
            label={{ value: `Meta proteína ${fmt(proteinGoal)} g`, position: "insideTopRight", fontSize: 11, fill: "#0369a1" }}
          />
          <Bar dataKey="protein" name="Proteína" stackId="m" fill="#0284c7" isAnimationActive={false} />
          <Bar dataKey="carbs" name="Carbohidratos" stackId="m" fill="#e5e5e5" isAnimationActive={false} />
          <Bar dataKey="fat" name="Grasas" stackId="m" fill="#cfcfcf" isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
