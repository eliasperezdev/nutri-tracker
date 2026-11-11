"use client";

import { useCallback, useRef, useState } from "react";
import type { MealType } from "@/lib/constants";
import { atTypicalTime, localDayOf } from "@/lib/dates";
import { emptyItem, type DraftItem, type MealDraft } from "@/lib/draft";

/**
 * Estado de la tarjeta de confirmación / edición.
 * `adjustTimeOnTypeChange`: en comidas nuevas de días pasados, al cambiar el
 * tipo de comida se ajusta la hora típica (mientras no la hayas editado).
 */
export function useMealDraft(
  initial: MealDraft,
  opts: { adjustTimeOnTypeChange?: boolean } = {},
) {
  const [draft, setDraft] = useState<MealDraft>(initial);
  const timeTouched = useRef(false);
  const adjust = opts.adjustTimeOnTypeChange ?? false;

  const patch = useCallback(
    (p: Partial<MealDraft>) => setDraft((d) => ({ ...d, ...p })),
    [],
  );

  const setMealType = useCallback(
    (t: MealType) =>
      setDraft((d) => ({
        ...d,
        meal_type: t,
        eaten_at:
          adjust && !timeTouched.current
            ? atTypicalTime(localDayOf(d.eaten_at), t)
            : d.eaten_at,
      })),
    [adjust],
  );

  const setEatenAt = useCallback((iso: string) => {
    timeTouched.current = true;
    setDraft((d) => ({ ...d, eaten_at: iso }));
  }, []);

  const updateItem = useCallback(
    (key: string, p: Partial<DraftItem>) =>
      setDraft((d) => ({
        ...d,
        items: d.items.map((i) => (i.key === key ? { ...i, ...p } : i)),
      })),
    [],
  );

  const addItem = useCallback(
    () => setDraft((d) => ({ ...d, items: [...d.items, emptyItem()] })),
    [],
  );

  const removeItem = useCallback(
    (key: string) =>
      setDraft((d) => ({ ...d, items: d.items.filter((i) => i.key !== key) })),
    [],
  );

  const toggleTag = useCallback(
    (tag: string) =>
      setDraft((d) => ({
        ...d,
        binge_tags: d.binge_tags.includes(tag)
          ? d.binge_tags.filter((t) => t !== tag)
          : [...d.binge_tags, tag],
      })),
    [],
  );

  return { draft, patch, setMealType, setEatenAt, updateItem, addItem, removeItem, toggleTag };
}
