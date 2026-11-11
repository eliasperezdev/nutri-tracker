import { Bookmark, Pencil, Trash2 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { timeOf } from "@/lib/dates";
import { fmt } from "@/lib/format";
import { sumItems } from "@/lib/stats";
import type { MealWithItems } from "@/lib/types";

export function MealCard({
  meal,
  onEdit,
  onDelete,
  busy,
}: {
  meal: MealWithItems;
  onEdit: () => void;
  onDelete: () => void;
  busy: boolean;
}) {
  const t = sumItems(meal.meal_items);
  return (
    <Card className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 text-sm text-neutral-500">
          <span className="tabular-nums">{timeOf(meal.eaten_at)}</span>
          {meal.is_binge && (
            <span title="Episodio registrado" aria-label="Episodio registrado" className="text-violet-500">
              <Bookmark size={15} fill="currentColor" />
            </span>
          )}
        </div>
        <div className="flex">
          <button
            type="button"
            onClick={onEdit}
            disabled={busy}
            aria-label="Editar comida"
            className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 disabled:opacity-40"
          >
            <Pencil size={18} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            disabled={busy}
            aria-label="Borrar comida"
            className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-500 disabled:opacity-40"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      <ul className="-mt-1 space-y-1.5">
        {meal.meal_items.map((i) => (
          <li key={i.id} className="flex items-baseline justify-between gap-3 text-[15px]">
            <span>
              {i.name}
              {i.quantity_text && <span className="text-neutral-500"> · {i.quantity_text}</span>}
            </span>
            <span className="shrink-0 tabular-nums text-neutral-600">{fmt(Number(i.kcal))}</span>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex items-baseline justify-between border-t border-neutral-100 pt-2 text-sm">
        <span className="tabular-nums text-neutral-500">
          P {fmt(t.protein_g, 1)} · C {fmt(t.carbs_g, 1)} · G {fmt(t.fat_g, 1)}
        </span>
        <strong className="tabular-nums">{fmt(t.kcal)} kcal</strong>
      </div>

      {meal.is_binge && (meal.binge_tags.length > 0 || meal.binge_note) && (
        <div className="mt-2 text-xs text-neutral-500">
          {meal.binge_tags.length > 0 && <span>{meal.binge_tags.join(" · ")}</span>}
          {meal.binge_note && <p className="mt-0.5 italic">{meal.binge_note}</p>}
        </div>
      )}
    </Card>
  );
}
