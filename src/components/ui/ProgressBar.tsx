import clsx from "clsx";
import { fmt } from "@/lib/format";

export function ProgressBar({
  label,
  value,
  goal,
  unit,
  color = "bg-neutral-900",
  thick = false,
}: {
  label: string;
  value: number;
  goal: number;
  unit: string;
  color?: string;
  thick?: boolean;
}) {
  const pct = goal > 0 ? Math.min(100, (value / goal) * 100) : 0;
  const over = goal > 0 && value > goal;
  return (
    <div>
      <div className="mb-1 flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-neutral-500">
          {fmt(value)} / {fmt(goal)} {unit}
        </span>
      </div>
      <div className={clsx("w-full overflow-hidden rounded-full bg-neutral-100", thick ? "h-3" : "h-2")}>
        <div
          className={clsx("h-full rounded-full", over ? "bg-amber-500" : color)}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
