import clsx from "clsx";
import Link from "next/link";

export const RANGES = [
  { key: "7", label: "7 días" },
  { key: "30", label: "30 días" },
  { key: "90", label: "90 días" },
  { key: "all", label: "Todo" },
] as const;

export function RangeSelector({ current }: { current: string }) {
  return (
    <div className="grid grid-cols-4 gap-1 rounded-xl bg-neutral-200/70 p-1" role="tablist">
      {RANGES.map((r) => (
        <Link
          key={r.key}
          href={`/progreso?r=${r.key}`}
          role="tab"
          aria-selected={current === r.key}
          replace
          className={clsx(
            "flex h-10 items-center justify-center rounded-lg text-sm font-medium",
            current === r.key ? "bg-white shadow-sm" : "text-neutral-600",
          )}
        >
          {r.label}
        </Link>
      ))}
    </div>
  );
}
