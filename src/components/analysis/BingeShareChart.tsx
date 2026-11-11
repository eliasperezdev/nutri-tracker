"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { fmt } from "@/lib/format";

export type ShareRow = { label: string; marked: number; rest: number; pct: number | null };

type TipProps = { active?: boolean; payload?: ReadonlyArray<{ payload: ShareRow }> };

function Tip({ active, payload }: TipProps) {
  const d = active ? payload?.[0]?.payload : undefined;
  if (!d) return null;
  return (
    <div className="rounded-lg bg-white p-2.5 text-xs shadow-lg ring-1 ring-neutral-200">
      <div className="mb-1 font-semibold">Semana del {d.label}</div>
      <div>Comidas marcadas: {fmt(d.marked)} kcal</div>
      <div>Resto: {fmt(d.rest)} kcal</div>
      <div className="mt-0.5 font-semibold">{d.pct === null ? "—" : `${fmt(d.pct, 1)} % del total`}</div>
    </div>
  );
}

/** Calorías semanales: comidas marcadas gula/roto vs. el resto. */
export function BingeShareChart({ data }: { data: ShareRow[] }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} width={48} tickFormatter={(v: number) => fmt(v)} />
          <Tooltip content={<Tip />} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Bar dataKey="rest" name="Resto" stackId="a" fill="#d4d4d4" isAnimationActive={false} />
          <Bar dataKey="marked" name="Comidas marcadas" stackId="a" fill="#8b5cf6" isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
