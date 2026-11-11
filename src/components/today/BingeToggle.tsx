import { BINGE_TAGS } from "@/lib/constants";
import { Chip } from "@/components/ui/Chip";
import { Toggle } from "@/components/ui/Toggle";

export function BingeToggle({
  isBinge,
  tags,
  note,
  onToggle,
  onToggleTag,
  onNote,
}: {
  isBinge: boolean;
  tags: string[];
  note: string;
  onToggle: (v: boolean) => void;
  onToggleTag: (tag: string) => void;
  onNote: (v: string) => void;
}) {
  return (
    <div className="rounded-2xl bg-white p-4 ring-1 ring-neutral-200">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="font-medium">Gula / roto</div>
          <div className="text-xs text-neutral-500">Se registra para ver patrones más adelante.</div>
        </div>
        <Toggle checked={isBinge} onChange={onToggle} label="Marcar como gula / roto" />
      </div>

      {isBinge && (
        <div className="mt-4 space-y-3">
          <div className="flex flex-wrap gap-2">
            {BINGE_TAGS.map((t) => (
              <Chip key={t} selected={tags.includes(t)} onClick={() => onToggleTag(t)}>
                {t}
              </Chip>
            ))}
          </div>
          <textarea
            value={note}
            onChange={(e) => onNote(e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Contá qué pasó (opcional)"
            className="w-full rounded-xl border border-neutral-300 bg-white p-3 text-base outline-none focus:border-neutral-900"
          />
        </div>
      )}
    </div>
  );
}
