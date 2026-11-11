import { Trash2 } from "lucide-react";
import type { DraftItem } from "@/lib/draft";
import { inputClass } from "@/components/ui/styles";

const NUM_FIELDS = [
  { key: "kcal", label: "kcal" },
  { key: "protein_g", label: "Prot. (g)" },
  { key: "carbs_g", label: "Carb. (g)" },
  { key: "fat_g", label: "Grasa (g)" },
] as const;

export function ItemRow({
  item,
  onChange,
  onRemove,
  canRemove,
}: {
  item: DraftItem;
  onChange: (p: Partial<DraftItem>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  return (
    <div className="space-y-2 rounded-2xl bg-white p-3 ring-1 ring-neutral-200">
      <div className="flex items-center gap-2">
        <input
          value={item.name}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Alimento"
          aria-label="Nombre del alimento"
          maxLength={200}
          className={inputClass}
        />
        <button
          type="button"
          onClick={onRemove}
          disabled={!canRemove}
          aria-label="Quitar ítem"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-neutral-500 disabled:opacity-30"
        >
          <Trash2 size={19} />
        </button>
      </div>
      <input
        value={item.quantity_text}
        onChange={(e) => onChange({ quantity_text: e.target.value })}
        placeholder="Cantidad (ej. 2 unidades)"
        aria-label="Cantidad"
        maxLength={200}
        className={inputClass}
      />
      <div className="grid grid-cols-4 gap-2">
        {NUM_FIELDS.map(({ key, label }) => (
          <label key={key} className="block">
            <span className="mb-0.5 block text-[11px] text-neutral-500">{label}</span>
            <input
              value={item[key]}
              onChange={(e) => onChange({ [key]: e.target.value })}
              inputMode="decimal"
              placeholder="0"
              className="h-11 w-full rounded-xl border border-neutral-300 bg-white px-2 text-center text-base outline-none focus:border-neutral-900"
            />
          </label>
        ))}
      </div>
    </div>
  );
}
