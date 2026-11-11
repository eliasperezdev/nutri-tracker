import { createClient } from "@/lib/supabase/client";
import { toNum, type MealDraft } from "./draft";

type DbError = { message: string } | null;
function check(error: DbError) {
  if (error) throw new Error(error.message);
}

/**
 * Inserta o actualiza una comida con sus ítems (desde el navegador, con RLS).
 * No es transaccional: al crear, si fallan los ítems se borra la comida;
 * al editar, se insertan los ítems nuevos antes de borrar los viejos.
 */
export async function saveMeal(draft: MealDraft): Promise<void> {
  const sb = createClient();

  const items = draft.items
    .filter((i) => i.name.trim())
    .map((i) => ({
      name: i.name.trim(),
      quantity_text: i.quantity_text.trim(),
      kcal: toNum(i.kcal),
      protein_g: toNum(i.protein_g),
      carbs_g: toNum(i.carbs_g),
      fat_g: toNum(i.fat_g),
    }));
  if (items.length === 0) throw new Error("Agregá al menos un ítem con nombre.");

  const note = draft.binge_note.trim();
  const mealRow = {
    eaten_at: draft.eaten_at,
    meal_type: draft.meal_type,
    raw_text: draft.raw_text.trim() || null,
    is_binge: draft.is_binge,
    binge_tags: draft.is_binge ? draft.binge_tags : [],
    binge_note: draft.is_binge && note ? note : null,
  };

  if (draft.id) {
    const mealId = draft.id;
    const upd = await sb.from("meals").update(mealRow).eq("id", mealId);
    check(upd.error);

    const old = await sb.from("meal_items").select("id").eq("meal_id", mealId);
    check(old.error);

    const ins = await sb.from("meal_items").insert(items.map((i) => ({ ...i, meal_id: mealId })));
    check(ins.error);

    const oldIds = (old.data ?? []).map((r: { id: string }) => r.id);
    if (oldIds.length > 0) {
      const del = await sb.from("meal_items").delete().in("id", oldIds);
      check(del.error);
    }
    return;
  }

  const created = await sb.from("meals").insert(mealRow).select("id").single();
  check(created.error);
  const mealId = (created.data as { id: string }).id;

  const ins = await sb.from("meal_items").insert(items.map((i) => ({ ...i, meal_id: mealId })));
  if (ins.error) {
    await sb.from("meals").delete().eq("id", mealId); // limpieza
    throw new Error(ins.error.message);
  }
}

export async function deleteMeal(id: string): Promise<void> {
  const sb = createClient();
  const { error } = await sb.from("meals").delete().eq("id", id);
  check(error);
}
