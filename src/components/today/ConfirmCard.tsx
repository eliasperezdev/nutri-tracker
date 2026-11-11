"use client";

import { Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Chip } from "@/components/ui/Chip";
import { inputClass } from "@/components/ui/styles";
import { MEAL_TYPES, MEAL_TYPE_LABELS } from "@/lib/constants";
import { fromInputValue, toInputValue } from "@/lib/dates";
import { draftTotals, type MealDraft } from "@/lib/draft";
import { fmt } from "@/lib/format";
import { useMealDraft } from "@/hooks/useMealDraft";
import { BingeToggle } from "./BingeToggle";
import { ItemRow } from "./ItemRow";

/**
 * Tarjeta editable usada para confirmar lo que interpretó la IA,
 * cargar una comida a mano y editar una comida existente.
 */
export function ConfirmCard({
  initial,
  adjustTimeOnTypeChange = false,
  saveLabel = "Guardar",
  onSave,
  onCancel,
}: {
  initial: MealDraft;
  adjustTimeOnTypeChange?: boolean;
  saveLabel?: string;
  onSave: (draft: MealDraft) => Promise<void>;
  onCancel: () => void;
}) {
  const { draft, patch, setMealType, setEatenAt, updateItem, addItem, removeItem, toggleTag } =
    useMealDraft(initial, { adjustTimeOnTypeChange });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const totals = draftTotals(draft);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await onSave(draft);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo guardar. Probá de nuevo.");
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4 pb-2">
      {(draft.confidence || draft.notes) && (
        <div className="rounded-2xl bg-sky-50 p-3 text-sm text-sky-900 ring-1 ring-sky-100">
          {draft.confidence && (
            <div>
              Confianza de la estimación: <strong>{draft.confidence}</strong>
            </div>
          )}
          {draft.notes && <div className="mt-1">{draft.notes}</div>}
          <div className="mt-1 text-xs text-sky-700">
            Son estimaciones: revisá y ajustá lo que quieras antes de guardar.
          </div>
        </div>
      )}

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {MEAL_TYPES.map((t) => (
          <Chip key={t} selected={draft.meal_type === t} onClick={() => setMealType(t)}>
            {MEAL_TYPE_LABELS[t]}
          </Chip>
        ))}
      </div>

      <label className="block">
        <span className="mb-1 block text-sm font-medium">Fecha y hora</span>
        <input
          type="datetime-local"
          value={toInputValue(draft.eaten_at)}
          onChange={(e) => {
            const iso = fromInputValue(e.target.value);
            if (iso) setEatenAt(iso);
          }}
          className={inputClass}
        />
      </label>

      <div className="space-y-2">
        {draft.items.map((item) => (
          <ItemRow
            key={item.key}
            item={item}
            onChange={(p) => updateItem(item.key, p)}
            onRemove={() => removeItem(item.key)}
            canRemove={draft.items.length > 1}
          />
        ))}
        <Button variant="secondary" size="sm" onClick={addItem} className="w-full">
          <Plus size={16} /> Agregar ítem
        </Button>
      </div>

      <div className="flex items-baseline justify-between rounded-2xl bg-white px-4 py-3 text-sm ring-1 ring-neutral-200">
        <span className="text-neutral-500">Total</span>
        <span className="tabular-nums">
          <strong className="text-base">{fmt(totals.kcal)} kcal</strong>
          <span className="ml-2 text-neutral-500">
            P {fmt(totals.protein_g, 1)} · C {fmt(totals.carbs_g, 1)} · G {fmt(totals.fat_g, 1)}
          </span>
        </span>
      </div>

      <BingeToggle
        isBinge={draft.is_binge}
        tags={draft.binge_tags}
        note={draft.binge_note}
        onToggle={(v) => patch({ is_binge: v })}
        onToggleTag={toggleTag}
        onNote={(v) => patch({ binge_note: v })}
      />

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="sticky bottom-0 -mx-4 flex gap-3 border-t border-neutral-200 bg-neutral-50 px-4 pb-1 pt-3">
        <Button variant="secondary" onClick={onCancel} disabled={saving} className="flex-1">
          Cancelar
        </Button>
        <Button onClick={save} disabled={saving} className="flex-1">
          {saving ? "Guardando…" : saveLabel}
        </Button>
      </div>
    </div>
  );
}
