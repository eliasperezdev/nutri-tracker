"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDayShort, formatDayWithWeekday } from "@/lib/dates";
import { fmt } from "@/lib/format";

export type CalorieDay = {
  day: string;
  kcal: number | null;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

type TipProps = { active?: boolean; payload?: ReadonlyArray<{ payload: CalorieDay }> };

function Tip({ active, payload }: TipProps) {
  const d = active ? payload?.[0]?.payload : undefined;
  if (!d || d.kcal === null) return null;
  return (
    <div className="rounded-lg bg-white p-2.5 text-xs shadow-lg ring-1 ring-neutral-200">
      <div className="mb-1 font-semibold capitalize">{formatDayWithWeekday(d.day)}</div>
      <div className="text-sm font-semibold">{fmt(d.kcal)} kcal</div>
      <div className="text-neutral-600">
        P {fmt(d.protein_g)} g · C {fmt(d.carbs_g)} g · G {fmt(d.fat_g)} g
      </div>
    </div>
  );
}

/** Calorías diarias vs. meta: sobre la meta en naranja, dentro en verde. */
export function CaloriesChart({ data, goal }: { data: CalorieDay[]; goal: number }) {
  if (!data.some((d) => d.kcal !== null)) {
    return <p className="py-10 text-center text-sm text-neutral-500">Todavía no hay comidas en este rango.</p>;
  }
  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
          <XAxis
            dataKey="day"
            tickFormatter={(d: string) => formatDayShort(d)}
            tick={{ fontSize: 11 }}
            minTickGap={24}
          />
          <YAxis tick={{ fontSize: 11 }} width={44} tickFormatter={(v: number) => fmt(v)} />
          <Tooltip content={<Tip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
          <ReferenceLine
            y={goal}
            stroke="#525252"
            strokeDasharray="5 4"
            label={{ value: `Meta ${fmt(goal)}`, position: "insideTopRight", fontSize: 11, fill: "#525252" }}
          />
          <Bar dataKey="kcal" radius={[3, 3, 0, 0]} isAnimationActive={false}>
            {data.map((d) => (
              <Cell key={d.day} fill={d.kcal !== null && d.kcal > goal ? "#f97316" : "#34d399"} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
