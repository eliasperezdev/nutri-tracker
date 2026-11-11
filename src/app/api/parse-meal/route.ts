import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ParseMealRequestSchema } from "@/lib/llm/schema";
import { buildSystemPrompt, buildUserMessage } from "@/lib/llm/prompt";
import { estimateMeal, LlmError } from "@/lib/llm/openrouter";

export const runtime = "nodejs";
export const maxDuration = 60;

const err = (status: number, error: string, message: string) =>
  NextResponse.json({ error, message }, { status });

export async function POST(request: Request) {
  // Defensa en profundidad: el middleware ya exige sesión, pero se verifica acá también.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return err(401, "unauthorized", "No autorizado.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return err(400, "invalid_request", "Solicitud inválida.");
  }

  const parsed = ParseMealRequestSchema.safeParse(body);
  if (!parsed.success) return err(400, "invalid_request", "Solicitud inválida.");

  const { text, currentTimeISO, mealTypeOverride, todayMeals } = parsed.data;
  const now = new Date(currentTimeISO);
  if (Number.isNaN(now.getTime())) {
    return err(400, "invalid_request", "Fecha inválida.");
  }

  try {
    const meal = await estimateMeal(
      buildSystemPrompt(),
      buildUserMessage({ text, now, mealTypeOverride, todayMeals }),
    );
    // Si el usuario eligió el tipo de comida, manda su elección.
    return NextResponse.json(
      mealTypeOverride ? { ...meal, meal_type: mealTypeOverride } : meal,
    );
  } catch (e) {
    if (e instanceof LlmError) {
      // No se loguea el texto del usuario, solo el código.
      console.error("[parse-meal]", e.code, e.status ?? "", e.message);
      const status = e.code === "config" ? 500 : e.code === "rate_limit" ? 429 : 502;
      return err(status, e.code, e.userMessage);
    }
    console.error("[parse-meal] error inesperado", e);
    return err(500, "internal", "Error inesperado.");
  }
}
