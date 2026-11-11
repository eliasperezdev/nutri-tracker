export const MEAL_TYPES = [
  "desayuno",
  "almuerzo",
  "merienda",
  "cena",
  "snack",
] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  desayuno: "Desayuno",
  almuerzo: "Almuerzo",
  merienda: "Merienda",
  cena: "Cena",
  snack: "Snack",
};

export const CONFIDENCE_LEVELS = ["alta", "media", "baja"] as const;
export type Confidence = (typeof CONFIDENCE_LEVELS)[number];

/** Etiquetas rápidas para comidas marcadas como "gula / roto". */
export const BINGE_TAGS = [
  "estrés",
  "aburrimiento",
  "social",
  "hambre acumulada",
  "cansancio",
  "ansiedad",
  "tristeza",
  "celebración",
  "otro",
] as const;

export const NO_TAG_LABEL = "sin etiqueta";

/** Constante de conversión para la estimación de gasto (kcal por kg). */
export const KCAL_PER_KG = 7700;
