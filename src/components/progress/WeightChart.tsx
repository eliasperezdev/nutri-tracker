"use client";

import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDayShort, formatDayWithWeekday } from "@/lib/dates";
import { fmt } from "@/lib/format";
import type { WeightPoint } from "@/lib/stats";

const dayOfT = (t: number) => new Date(t).toISOString().slice(0, 10);

/** Peso diario (puntos), media móvil de 7 días (destacada) y peso objetivo. */
export function WeightChart({ points, target }: { points: WeightPoint[]; target: number | null }) {
  if (points.length === 0) {
    return <p className="py-10 text-center text-sm text-neutral-500">Todavía no hay pesajes en este rango.</p>;
  }

  const data = points.map((p) => ({
    t: new Date(`${p.date}T12:00:00Z`).getTime(),
    weight: p.weight,
    avg: p.avg,
  }));
  const values = [...points.map((p) => p.weight), ...points.map((p) => p.avg)];
  if (target !== null) values.push(target);
  const min = Math.floor(Math.min(...values) - 1);
  const max = Math.ceil(Math.max(...values) + 1);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
          <XAxis
            dataKey="t"
            type="number"
            scale="time"
            domain={["dataMin", "dataMax"]}
            tickFormatter={(t: number) => formatDayShort(dayOfT(t))}
            tick={{ fontSize: 11 }}
            minTickGap={28}
          />
          <YAxis domain={[min, max]} tick={{ fontSize: 11 }} width={44} tickFormatter={(v: number) => fmt(v)} />
          <Tooltip
            labelFormatter={(t) => formatDayWithWeekday(dayOfT(Number(t)))}
            formatter={(v, name) => [`${fmt(Number(v), 1)} kg`, String(name)]}
          />
          {target !== null && (
            <ReferenceLine
              y={target}
              stroke="#737373"
              strokeDasharray="5 4"
              label={{ value: `Objetivo ${fmt(target, 1)}`, position: "insideBottomRight", fontSize: 11, fill: "#737373" }}
            />
          )}
          <Line
            name="Peso"
            dataKey="weight"
            stroke="#a3a3a3"
            strokeWidth={1}
            dot={{ r: 3, fill: "#a3a3a3", strokeWidth: 0 }}
            activeDot={{ r: 4 }}
            isAnimationActive={false}
          />
          <Line
            name="Media móvil 7 días"
            dataKey="avg"
            stroke="#059669"
            strokeWidth={3}
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
