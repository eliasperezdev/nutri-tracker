"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { addDaysStr, formatDayLong, isValidDay } from "@/lib/dates";

const href = (day: string, today: string) => (day === today ? "/" : `/?d=${day}`);

export function DayNavigator({ day, today }: { day: string; today: string }) {
  const router = useRouter();
  const isToday = day === today;

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between gap-2">
        <Link
          href={href(addDaysStr(day, -1), today)}
          aria-label="Día anterior"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white ring-1 ring-neutral-200"
        >
          <ChevronLeft size={22} />
        </Link>

        {/* Tocar el título abre el selector de fecha nativo */}
        <label className="relative flex-1 text-center">
          <span className="block text-lg font-semibold capitalize">
            {isToday ? "Hoy" : formatDayLong(day)}
          </span>
          {isToday && (
            <span className="block text-xs capitalize text-neutral-500">{formatDayLong(day)}</span>
          )}
          <input
            type="date"
            value={day}
            max={addDaysStr(today, 365)}
            onChange={(e) => {
              if (isValidDay(e.target.value)) router.push(href(e.target.value, today));
            }}
            aria-label="Elegir fecha"
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>

        <Link
          href={href(addDaysStr(day, 1), today)}
          aria-label="Día siguiente"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-white ring-1 ring-neutral-200"
        >
          <ChevronRight size={22} />
        </Link>
      </div>
      {!isToday && (
        <div className="mt-2 text-center">
          <Link href="/" className="text-sm font-medium text-neutral-700 underline">
            Volver a hoy
          </Link>
        </div>
      )}
    </div>
  );
}
