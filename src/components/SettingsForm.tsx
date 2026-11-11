"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { inputClass } from "@/components/ui/styles";
import { createClient } from "@/lib/supabase/client";
import type { Settings } from "@/lib/types";

type Key = "kcal_goal" | "protein_goal_g" | "carbs_goal_g" | "fat_goal_g" | "target_weight_kg" | "height_cm";

const FIELDS: { key: Key; label: string; unit: string; optional?: boolean; decimal?: boolean }[] = [
  { key: "kcal_goal", label: "Calorías diarias", unit: "kcal" },
  { key: "protein_goal_g", label: "Proteína", unit: "g" },
  { key: "carbs_goal_g", label: "Carbohidratos", unit: "g" },
  { key: "fat_goal_g", label: "Grasas", unit: "g" },
  { key: "target_weight_kg", label: "Peso objetivo", unit: "kg", optional: true, decimal: true },
  { key: "height_cm", label: "Altura", unit: "cm", optional: true, decimal: true },
];

export function SettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  const [values, setValues] = useState<Record<Key, string>>(
    () =>
      Object.fromEntries(
        FIELDS.map((f) => [f.key, settings[f.key] === null ? "" : String(settings[f.key])]),
      ) as Record<Key, string>,
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setMessage(null);

    const parsed: Partial<Record<Key, number | null>> = {};
    for (const f of FIELDS) {
      const raw = values[f.key].trim().replace(",", ".");
      if (!raw) {
        if (!f.optional) return setMessage({ ok: false, text: `Completá: ${f.label}.` });
        parsed[f.key] = null;
        continue;
      }
      const n = Number(raw);
      if (!Number.isFinite(n) || n <= 0) return setMessage({ ok: false, text: `Valor inválido en: ${f.label}.` });
      parsed[f.key] = f.decimal ? n : Math.round(n);
    }

    setSaving(true);
    try {
      const sb = createClient();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) throw new Error("Tu sesión expiró. Volvé a ingresar.");
      const { error } = await sb.from("settings").upsert({ user_id: user.id, ...parsed });
      if (error) throw new Error(error.message);
      setMessage({ ok: true, text: "Metas guardadas." });
      router.refresh();
    } catch (err) {
      setMessage({ ok: false, text: err instanceof Error ? err.message : "No se pudo guardar." });
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <Card className="space-y-4">
        {FIELDS.map((f) => (
          <label key={f.key} className="block">
            <span className="mb-1 block text-sm font-medium">
              {f.label} <span className="font-normal text-neutral-500">({f.unit})</span>
              {f.optional && <span className="font-normal text-neutral-400"> · opcional</span>}
            </span>
            <input
              value={values[f.key]}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              inputMode="decimal"
              className={inputClass}
            />
          </label>
        ))}
        {message && (
          <p role={message.ok ? "status" : "alert"} className={message.ok ? "text-sm text-emerald-700" : "text-sm text-red-600"}>
            {message.text}
          </p>
        )}
        <Button type="submit" disabled={saving} className="w-full">
          {saving ? "Guardando…" : "Guardar metas"}
        </Button>
      </Card>
    </form>
  );
}
