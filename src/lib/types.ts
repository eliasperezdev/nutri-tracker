import type { MealType } from "./constants";

export type Settings = {
  user_id: string;
  kcal_goal: number;
  protein_goal_g: number;
  carbs_goal_g: number;
  fat_goal_g: number;
  target_weight_kg: number | null;
  height_cm: number | null;
};

export type MealItem = {
  id: string;
  meal_id: string;
  name: string;
  quantity_text: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

export type Meal = {
  id: string;
  user_id: string;
  eaten_at: string;
  meal_type: MealType;
  raw_text: string | null;
  is_binge: boolean;
  binge_tags: string[];
  binge_note: string | null;
  created_at: string;
};

export type MealWithItems = Meal & { meal_items: MealItem[] };

export type WeighIn = {
  id: string;
  user_id: string;
  measured_at: string;
  weight_kg: number;
  waist_cm: number | null;
  note: string | null;
};

export type DailyTotal = {
  user_id: string;
  day: string;
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  binge_kcal: number;
  meals_count: number;
  binge_count: number;
};

export type Totals = {
  kcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

/** Episodio (comida marcada) con sus kcal, para /analisis. */
export type Episode = {
  id: string;
  eaten_at: string;
  meal_type: MealType;
  binge_tags: string[];
  binge_note: string | null;
  kcal: number;
};
