"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { inputClass } from "@/components/ui/styles";
import { formatDayWithWeekday } from "@/lib/dates";
import { fmt } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import type { WeighIn } from "@/lib/types";

const toNumber = (s: string) => {
  const n = Number(s.trim().replace(",", "."));
  return Number.isFinite(n) ? n : NaN;
};

/** Formulario rápido de peso (y cintura) + lista editable/borrable. */
export function WeighInSection({ weighIns, today }: { weighIns: WeighIn[]; today: string }) {
  const router = useRouter();
  const [date, setDate] = useState(today);
  const [weight, setWeight] = useState("");
  const [waist, setWaist] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function startEdit(w: WeighIn) {
    setDate(w.measured_at);
    setWeight(String(w.weight_kg));
    setWaist(w.waist_cm === null ? "" : String(w.waist_cm));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const w = toNumber(weight);
    const c = waist.trim() ? toNumber(waist) : null;
    if (!(w > 20 && w < 400)) return setError("Ingresá un peso válido (en kg).");
    if (c !== null && !(c > 20 && c < 300)) return setError("Ingresá una cintura válida (en cm).");

    setSaving(true);
    try {
      const sb = createClient();
      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) throw new Error("Tu sesión expiró. Volvé a ingresar.");

      // Un registro por día: si ya existe, se actualiza.
      const { error: dbError } = await sb.from("weigh_ins").upsert(
        { user_id: user.id, measured_at: date, weight_kg: w, waist_cm: c },
        { onConflict: "user_id,measured_at" },
      );
      if (dbError) throw new Error(dbError.message);

      setWeight("");
      setWaist("");
      setDate(today);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  }

  async function remove(w: WeighIn) {
    if (!window.confirm("¿Borrar este registro de peso?")) return;
    const { error: dbError } = await createClient().from("weigh_ins").delete().eq("id", w.id);
    if (dbError) return setError(dbError.message);
    router.refresh();
  }

  return (
    <>
      <Card>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Peso (kg)</span>
              <input
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                inputMode="decimal"
                placeholder="72,4"
                className={inputClass}
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium">Cintura (cm)</span>
              <input
                value={waist}
                onChange={(e) => setWaist(e.target.value)}
                inputMode="decimal"
                placeholder="Opcional"
                className={inputClass}
              />
            </label>
          </div>
          <label className="block">
            <span className="mb-1 block text-sm font-medium">Fecha</span>
            <input
              type="date"
              value={date}
              max={today}
              onChange={(e) => e.target.value && setDate(e.target.value)}
              className={inputClass}
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <Button type="submit" disabled={saving} className="w-full">
            {saving ? "Guardando…" : "Guardar peso"}
          </Button>
        </form>
      </Card>

      {weighIns.length > 0 && (
        <Card className="mt-3 divide-y divide-neutral-100 p-0">
          {weighIns.map((w) => (
            <div key={w.id} className="flex items-center justify-between px-4 py-2.5">
              <div>
                <div className="text-sm capitalize text-neutral-500">
                  {formatDayWithWeekday(w.measured_at)}
                </div>
                <div className="tabular-nums">
                  <strong>{fmt(w.weight_kg, 1)} kg</strong>
                  {w.waist_cm !== null && (
                    <span className="ml-2 text-sm text-neutral-500">cintura {fmt(w.waist_cm, 1)} cm</span>
                  )}
                </div>
              </div>
              <div className="flex">
                <button
                  type="button"
                  onClick={() => startEdit(w)}
                  aria-label="Editar registro"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-500"
                >
                  <Pencil size={17} />
                </button>
                <button
                  type="button"
                  onClick={() => remove(w)}
                  aria-label="Borrar registro"
                  className="flex h-10 w-10 items-center justify-center rounded-full text-neutral-500"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}
        </Card>
      )}
    </>
  );
}
