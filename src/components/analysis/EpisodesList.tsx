"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Chip } from "@/components/ui/Chip";
import { MEAL_TYPE_LABELS } from "@/lib/constants";
import { formatDayWithWeekday, localDayOf, timeOf } from "@/lib/dates";
import { fmt } from "@/lib/format";
import type { Episode } from "@/lib/types";

/** Episodios recientes, filtrables por etiqueta. */
export function EpisodesList({ episodes, tags }: { episodes: Episode[]; tags: string[] }) {
  const [filter, setFilter] = useState<string | null>(null);

  if (episodes.length === 0) {
    return (
      <Card>
        <p className="py-4 text-center text-sm text-neutral-500">No hay episodios registrados en este período.</p>
      </Card>
    );
  }

  const shown = (filter ? episodes.filter((e) => e.binge_tags.includes(filter)) : episodes).slice(0, 30);

  return (
    <>
      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4">
        <Chip selected={filter === null} onClick={() => setFilter(null)}>
          Todos
        </Chip>
        {tags.map((t) => (
          <Chip key={t} selected={filter === t} onClick={() => setFilter(filter === t ? null : t)}>
            {t}
          </Chip>
        ))}
      </div>

      {shown.length === 0 ? (
        <p className="text-sm text-neutral-500">Ningún episodio con esa etiqueta.</p>
      ) : (
        <div className="space-y-2">
          {shown.map((e) => (
            <Card key={e.id} className="p-3">
              <div className="flex items-baseline justify-between gap-2">
                <div className="text-sm">
                  <span className="font-semibold capitalize">{formatDayWithWeekday(localDayOf(e.eaten_at))}</span>
                  <span className="ml-1.5 text-neutral-500">
                    {timeOf(e.eaten_at)} · {MEAL_TYPE_LABELS[e.meal_type]}
                  </span>
                </div>
                <strong className="shrink-0 text-sm tabular-nums">{fmt(e.kcal)} kcal</strong>
              </div>
              {e.binge_tags.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {e.binge_tags.map((t) => (
                    <span key={t} className="rounded-full bg-violet-50 px-2 py-0.5 text-xs text-violet-700">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {e.binge_note && <p className="mt-1.5 text-sm italic text-neutral-600">{e.binge_note}</p>}
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
