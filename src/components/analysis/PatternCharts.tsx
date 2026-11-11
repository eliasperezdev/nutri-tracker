"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Card, SectionTitle } from "@/components/ui/Card";

export type CountRow = { label: string; count: number };

const COLOR = "#8b5cf6";

function Vertical({ data, height }: { data: CountRow[]; height: string }) {
  return (
    <div className={`${height} w-full`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e5e5" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={data.length > 12 ? 2 : 0} />
          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={44} />
          <Tooltip formatter={(v) => [`${v}`, "Episodios"]} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
          <Bar dataKey="count" fill={COLOR} radius={[3, 3, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Patrones de episodios: hora del día, día de la semana y etiqueta. */
export function PatternCharts({
  byHour,
  byWeekday,
  byTag,
}: {
  byHour: CountRow[];
  byWeekday: CountRow[];
  byTag: CountRow[];
}) {
  if (byTag.length === 0) {
    return (
      <Card>
        <p className="py-4 text-center text-sm text-neutral-500">
          Todavía no hay episodios registrados en este período.
        </p>
      </Card>
    );
  }
  return (
    <>
      <SectionTitle>Por hora del día</SectionTitle>
      <Card className="px-2 py-3">
        <Vertical data={byHour} height="h-48" />
      </Card>

      <SectionTitle>Por día de la semana</SectionTitle>
      <Card className="px-2 py-3">
        <Vertical data={byWeekday} height="h-48" />
      </Card>

      <SectionTitle>Por etiqueta</SectionTitle>
      <Card className="px-2 py-3">
        <div className="w-full" style={{ height: Math.max(120, byTag.length * 38 + 20) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byTag} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 4 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e5e5" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="label" width={112} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => [`${v}`, "Episodios"]} cursor={{ fill: "rgba(0,0,0,0.04)" }} />
              <Bar dataKey="count" fill={COLOR} radius={[0, 3, 3, 0]} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </>
  );
}
