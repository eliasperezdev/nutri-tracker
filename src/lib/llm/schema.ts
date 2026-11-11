import { z } from "zod";
import { CONFIDENCE_LEVELS, MEAL_TYPES } from "@/lib/constants";

/* ------------------------------------------------------------------ */
/* Respuesta del modelo                                                */
/* ------------------------------------------------------------------ */

const lower = (v: unknown) => (typeof v === "string" ? v.trim().toLowerCase() : v);
const round1 = (n: number) => Math.round(n * 10) / 10;

// coerce: tolera "250" (string) en el modo fallback sin JSON schema estricto.
const kcal = z.coerce.number().min(0).max(10000);
const grams = z.coerce.number().min(0).max(1000);

const ItemSchema = z.object({
  name: z.string().trim().min(1).max(200),
  quantity_text: z.string().trim().max(200).default(""),
  kcal,
  protein_g: grams,
  carbs_g: grams,
  fat_g: grams,
});

export const ParsedMealSchema = z
  .object({
    meal_type: z.preprocess(lower, z.enum(MEAL_TYPES)),
    items: z.array(ItemSchema).min(1).max(20),
    confidence: z.preprocess(lower, z.enum(CONFIDENCE_LEVELS)),
    notes: z.string().trim().max(1000).default(""),
  })
  .transform((m) => ({
    ...m,
    items: m.items.map((i) => ({
      ...i,
      kcal: Math.round(i.kcal),
      protein_g: round1(i.protein_g),
      carbs_g: round1(i.carbs_g),
      fat_g: round1(i.fat_g),
    })),
  }));

export type ParsedMeal = z.output<typeof ParsedMealSchema>;
export type ParsedItem = ParsedMeal["items"][number];

/**
 * JSON Schema para response_format (modo estricto de OpenAI/OpenRouter).
 * En modo estricto no se admiten minItems/maxItems/minimum: esos límites
 * se validan con zod después.
 */
export const mealJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["meal_type", "items", "confidence", "notes"],
  properties: {
    meal_type: { type: "string", enum: [...MEAL_TYPES] },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "quantity_text", "kcal", "protein_g", "carbs_g", "fat_g"],
        properties: {
          name: { type: "string" },
          quantity_text: { type: "string" },
          kcal: { type: "number" },
          protein_g: { type: "number" },
          carbs_g: { type: "number" },
          fat_g: { type: "number" },
        },
      },
    },
    confidence: { type: "string", enum: [...CONFIDENCE_LEVELS] },
    notes: { type: "string" },
  },
} as const;

/* ------------------------------------------------------------------ */
/* Request de POST /api/parse-meal                                     */
/* ------------------------------------------------------------------ */

const TodayMealSchema = z.object({
  meal_type: z.enum(MEAL_TYPES),
  items: z
    .array(
      z.object({
        name: z.string().max(200),
        quantity_text: z.string().max(200).default(""),
        kcal: z.number(),
        protein_g: z.number(),
        carbs_g: z.number(),
        fat_g: z.number(),
      }),
    )
    .max(30),
});

export const ParseMealRequestSchema = z.object({
  text: z.string().trim().min(1).max(500),
  currentTimeISO: z.string().max(40),
  mealTypeOverride: z.enum(MEAL_TYPES).optional(),
  todayMeals: z.array(TodayMealSchema).max(30).default([]),
});

export type ParseMealRequest = z.output<typeof ParseMealRequestSchema>;
export type TodayMeal = ParseMealRequest["todayMeals"][number];
