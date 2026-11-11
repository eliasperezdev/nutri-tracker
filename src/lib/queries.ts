import type { SupabaseClient } from "@supabase/supabase-js";
import { dayStartUtc, dayToUtcRange } from "./dates";
import type {
  DailyTotal,
  Episode,
  MealWithItems,
  Settings,
  WeighIn,
} from "./types";
import type { MealType } from "./constants";

export const DEFAULT_SETTINGS: Settings = {
  user_id: "",
  kcal_goal: 2000,
  protein_goal_g: 120,
  carbs_goal_g: 200,
  fat_goal_g: 60,
  target_weight_kg: null,
  height_cm: null,
};

function fail(error: { message: string } | null): never {
  throw new Error(error?.message ?? "Error al leer datos");
}

export async function getSettings(sb: SupabaseClient): Promise<Settings> {
  const { data, error } = await sb.from("settings").select("*").maybeSingle();
  if (error) fail(error);
  return (data as Settings | null) ?? DEFAULT_SETTINGS;
}

export async function getMealsForDay(
  sb: SupabaseClient,
  day: string,
): Promise<MealWithItems[]> {
  const { start, end } = dayToUtcRange(day);
  const { data, error } = await sb
    .from("meals")
    .select("*, meal_items(*)")
    .gte("eaten_at", start)
    .lt("eaten_at", end)
    .order("eaten_at", { ascending: true });
  if (error) fail(error);
  return (data ?? []) as MealWithItems[];
}

export async function getDailyTotals(
  sb: SupabaseClient,
  fromDay?: string,
): Promise<DailyTotal[]> {
  let q = sb.from("daily_totals").select("*").order("day", { ascending: true });
  if (fromDay) q = q.gte("day", fromDay);
  const { data, error } = await q;
  if (error) fail(error);
  return ((data ?? []) as DailyTotal[]).map((d) => ({
    ...d,
    kcal: Number(d.kcal),
    protein_g: Number(d.protein_g),
    carbs_g: Number(d.carbs_g),
    fat_g: Number(d.fat_g),
    binge_kcal: Number(d.binge_kcal),
  }));
}

export async function getWeighIns(sb: SupabaseClient): Promise<WeighIn[]> {
  const { data, error } = await sb
    .from("weigh_ins")
    .select("*")
    .order("measured_at", { ascending: true });
  if (error) fail(error);
  return ((data ?? []) as WeighIn[]).map((w) => ({
    ...w,
    weight_kg: Number(w.weight_kg),
    waist_cm: w.waist_cm === null ? null : Number(w.waist_cm),
  }));
}

/** Comidas marcadas (gula/roto) desde un día local, más recientes primero. */
export async function getEpisodes(
  sb: SupabaseClient,
  fromDay: string,
): Promise<Episode[]> {
  const { data, error } = await sb
    .from("meals")
    .select("id, eaten_at, meal_type, binge_tags, binge_note, meal_items(kcal)")
    .eq("is_binge", true)
    .gte("eaten_at", dayStartUtc(fromDay))
    .order("eaten_at", { ascending: false });
  if (error) fail(error);

  type Row = {
    id: string;
    eaten_at: string;
    meal_type: MealType;
    binge_tags: string[] | null;
    binge_note: string | null;
    meal_items: { kcal: number }[];
  };
  return ((data ?? []) as Row[]).map((r) => ({
    id: r.id,
    eaten_at: r.eaten_at,
    meal_type: r.meal_type,
    binge_tags: r.binge_tags ?? [],
    binge_note: r.binge_note,
    kcal: Math.round(r.meal_items.reduce((s, i) => s + Number(i.kcal), 0)),
  }));
}
