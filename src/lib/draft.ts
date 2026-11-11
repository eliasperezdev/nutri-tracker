import type { Confidence, MealType } from "./constants";
import type { ParsedMeal } from "./llm/schema";
import type { MealWithItems, Totals } from "./types";

/** Ítem editable: los números son strings para poder escribir con comodidad. */
export type DraftItem = {
  key: string;
  name: string;
  quantity_text: string;
  kcal: string;
  protein_g: string;
  carbs_g: string;
  fat_g: string;
};

export type MealDraft = {
  id?: string;
  meal_type: MealType;
  eaten_at: string; // ISO UTC
  raw_text: string;
  items: DraftItem[];
  is_binge: boolean;
  binge_tags: string[];
  binge_note: string;
  confidence?: Confidence;
  notes?: string;
};

const newKey = () => Math.random().toString(36).slice(2, 10);
const str = (n: number) => (Number.isInteger(n) ? String(n) : String(Math.round(n * 10) / 10));

export function toNum(s: string): number {
  const n = Number(s.trim().replace(",", "."));
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function emptyItem(): DraftItem {
  return { key: newKey(), name: "", quantity_text: "", kcal: "", protein_g: "", carbs_g: "", fat_g: "" };
}

export function draftFromParsed(
  parsed: ParsedMeal,
  opts: { raw_text: string; eaten_at: string },
): MealDraft {
  return {
    meal_type: parsed.meal_type,
    eaten_at: opts.eaten_at,
    raw_text: opts.raw_text,
    items: parsed.items.map((i) => ({
      key: newKey(),
      name: i.name,
      quantity_text: i.quantity_text,
      kcal: str(i.kcal),
      protein_g: str(i.protein_g),
      carbs_g: str(i.carbs_g),
      fat_g: str(i.fat_g),
    })),
    is_binge: false,
    binge_tags: [],
    binge_note: "",
    confidence: parsed.confidence,
    notes: parsed.notes,
  };
}

export function draftFromMeal(meal: MealWithItems): MealDraft {
  return {
    id: meal.id,
    meal_type: meal.meal_type,
    eaten_at: meal.eaten_at,
    raw_text: meal.raw_text ?? "",
    items: meal.meal_items.map((i) => ({
      key: i.id,
      name: i.name,
      quantity_text: i.quantity_text,
      kcal: str(Number(i.kcal)),
      protein_g: str(Number(i.protein_g)),
      carbs_g: str(Number(i.carbs_g)),
      fat_g: str(Number(i.fat_g)),
    })),
    is_binge: meal.is_binge,
    binge_tags: meal.binge_tags ?? [],
    binge_note: meal.binge_note ?? "",
  };
}

export function emptyDraft(type: MealType, eaten_at: string): MealDraft {
  return {
    meal_type: type,
    eaten_at,
    raw_text: "",
    items: [emptyItem()],
    is_binge: false,
    binge_tags: [],
    binge_note: "",
  };
}

export function draftTotals(d: MealDraft): Totals {
  return d.items.reduce<Totals>(
    (t, i) => ({
      kcal: t.kcal + toNum(i.kcal),
      protein_g: t.protein_g + toNum(i.protein_g),
      carbs_g: t.carbs_g + toNum(i.carbs_g),
      fat_g: t.fat_g + toNum(i.fat_g),
    }),
    { kcal: 0, protein_g: 0, carbs_g: 0, fat_g: 0 },
  );
}
