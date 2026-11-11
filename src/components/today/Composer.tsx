"use client";

import { Loader2, Pencil, SendHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { Sheet } from "@/components/ui/Sheet";
import { MEAL_TYPES, MEAL_TYPE_LABELS, type MealType } from "@/lib/constants";
import { atLocalTime, atTypicalTime, guessMealType } from "@/lib/dates";
import { draftFromParsed, emptyDraft, type MealDraft } from "@/lib/draft";
import type { ParsedMeal } from "@/lib/llm/schema";
import { saveMeal } from "@/lib/mealActions";
import type { MealWithItems } from "@/lib/types";
import { ConfirmCard } from "./ConfirmCard";

const FALLBACK_ERROR = "No pude interpretar la comida. Probá de nuevo o cargala a mano.";

/** Input de chat fijo abajo + tarjeta de confirmación en un panel. */
export function Composer({
  day,
  today,
  meals,
}: {
  day: string;
  today: string;
  meals: MealWithItems[];
}) {
  const router = useRouter();
  const isToday = day === today;

  const [text, setText] = useState("");
  const [typeOverride, setTypeOverride] = useState<MealType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<MealDraft | null>(null);

  async function submit(e?: FormEvent) {
    e?.preventDefault();
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      // En días pasados la hora real no sirve para deducir el tipo de comida.
      const currentTimeISO = isToday ? now.toISOString() : atLocalTime(day, 12);

      const res = await fetch("/api/parse-meal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: trimmed,
          currentTimeISO,
          mealTypeOverride: typeOverride ?? undefined,
          todayMeals: meals.map((m) => ({
            meal_type: m.meal_type,
            items: m.meal_items.map((i) => ({
              name: i.name,
              quantity_text: i.quantity_text,
              kcal: Number(i.kcal),
              protein_g: Number(i.protein_g),
              carbs_g: Number(i.carbs_g),
              fat_g: Number(i.fat_g),
            })),
          })),
        }),
      });

      if (res.status === 401) {
        router.push("/login");
        return;
      }
      const data: unknown = await res.json().catch(() => null);
      if (!res.ok || !data) {
        const msg = (data as { message?: string } | null)?.message;
        throw new Error(msg ?? FALLBACK_ERROR);
      }

      const parsed = data as ParsedMeal;
      setDraft(
        draftFromParsed(parsed, {
          raw_text: trimmed,
          eaten_at: isToday ? now.toISOString() : atTypicalTime(day, parsed.meal_type),
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : FALLBACK_ERROR);
    } finally {
      setLoading(false);
    }
  }

  function openManual() {
    setError(null);
    const now = new Date();
    const type = typeOverride ?? (isToday ? guessMealType(now) : "almuerzo");
    setDraft(emptyDraft(type, isToday ? now.toISOString() : atTypicalTime(day, type)));
  }

  return (
    <>
      <div
        className="fixed inset-x-0 z-20 border-t border-neutral-200 bg-white/95 backdrop-blur"
        style={{ bottom: "calc(3.5rem + env(safe-area-inset-bottom, 0px))" }}
      >
        <div className="mx-auto max-w-lg px-3 pb-2 pt-2">
          <div className="-mx-3 mb-2 flex items-center gap-2 overflow-x-auto px-3">
            <Chip selected={typeOverride === null} onClick={() => setTypeOverride(null)}>
              Auto
            </Chip>
            {MEAL_TYPES.map((t) => (
              <Chip
                key={t}
                selected={typeOverride === t}
                onClick={() => setTypeOverride(typeOverride === t ? null : t)}
              >
                {MEAL_TYPE_LABELS[t]}
              </Chip>
            ))}
          </div>

          {error && (
            <div role="alert" className="mb-2 rounded-xl bg-red-50 p-2.5 text-sm text-red-700">
              {error}
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => submit()} disabled={loading}>
                  Reintentar
                </Button>
                <Button size="sm" variant="secondary" onClick={openManual}>
                  Cargar a mano
                </Button>
              </div>
            </div>
          )}

          <form onSubmit={submit} className="flex items-center gap-2">
            <button
              type="button"
              onClick={openManual}
              aria-label="Cargar a mano"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-neutral-600 ring-1 ring-neutral-300"
            >
              <Pencil size={19} />
            </button>
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ej: 2 empanadas de carne y una coca zero"
              aria-label="Qué comiste"
              maxLength={500}
              enterKeyHint="send"
              className="h-12 min-w-0 flex-1 rounded-full border border-neutral-300 bg-white px-4 text-base outline-none focus:border-neutral-900"
            />
            <button
              type="submit"
              disabled={loading || !text.trim()}
              aria-label="Enviar"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-white disabled:opacity-40"
            >
              {loading ? <Loader2 size={20} className="animate-spin" /> : <SendHorizontal size={20} />}
            </button>
          </form>
        </div>
      </div>

      <Sheet open={draft !== null} onClose={() => setDraft(null)} title="Confirmar comida">
        {draft && (
          <ConfirmCard
            initial={draft}
            adjustTimeOnTypeChange={!isToday}
            onCancel={() => setDraft(null)}
            onSave={async (d) => {
              await saveMeal(d);
              setDraft(null);
              setText("");
              router.refresh();
            }}
          />
        )}
      </Sheet>
    </>
  );
}
