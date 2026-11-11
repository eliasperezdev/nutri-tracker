"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { MEAL_TYPES, MEAL_TYPE_LABELS } from "@/lib/constants";
import { draftFromMeal } from "@/lib/draft";
import { fmt } from "@/lib/format";
import { deleteMeal, saveMeal } from "@/lib/mealActions";
import { sumItems } from "@/lib/stats";
import type { MealWithItems } from "@/lib/types";
import { ConfirmCard } from "./ConfirmCard";
import { MealCard } from "./MealCard";

/** Comidas del día agrupadas por tipo, con edición y borrado. */
export function MealList({ meals }: { meals: MealWithItems[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<MealWithItems | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function remove(meal: MealWithItems) {
    if (!window.confirm("¿Borrar esta comida?")) return;
    setBusyId(meal.id);
    setError(null);
    try {
      await deleteMeal(meal.id);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo borrar.");
    } finally {
      setBusyId(null);
    }
  }

  if (meals.length === 0) {
    return (
      <p className="mt-8 text-center text-sm text-neutral-500">
        Todavía no hay comidas registradas este día.
        <br />
        Escribí abajo qué comiste.
      </p>
    );
  }

  return (
    <div className="mt-2">
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}
      {MEAL_TYPES.map((type) => {
        const group = meals.filter((m) => m.meal_type === type);
        if (group.length === 0) return null;
        const subtotal = sumItems(group.flatMap((m) => m.meal_items));
        return (
          <section key={type}>
            <div className="mb-2 mt-5 flex items-baseline justify-between">
              <h2 className="text-sm font-semibold text-neutral-500">{MEAL_TYPE_LABELS[type]}</h2>
              <span className="text-xs tabular-nums text-neutral-500">{fmt(subtotal.kcal)} kcal</span>
            </div>
            <div className="space-y-2">
              {group.map((meal) => (
                <MealCard
                  key={meal.id}
                  meal={meal}
                  busy={busyId === meal.id}
                  onEdit={() => setEditing(meal)}
                  onDelete={() => remove(meal)}
                />
              ))}
            </div>
          </section>
        );
      })}

      <Sheet open={editing !== null} onClose={() => setEditing(null)} title="Editar comida">
        {editing && (
          <ConfirmCard
            key={editing.id}
            initial={draftFromMeal(editing)}
            onCancel={() => setEditing(null)}
            onSave={async (d) => {
              await saveMeal(d);
              setEditing(null);
              router.refresh();
            }}
          />
        )}
      </Sheet>
    </div>
  );
}
