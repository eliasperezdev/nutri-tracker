"use client";

import clsx from "clsx";
import { BarChart3, Settings, TrendingUp, Utensils } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Hoy", Icon: Utensils },
  { href: "/progreso", label: "Progreso", Icon: TrendingUp },
  { href: "/analisis", label: "Análisis", Icon: BarChart3 },
  { href: "/ajustes", label: "Ajustes", Icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <ul className="mx-auto flex h-14 max-w-lg">
        {LINKS.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={clsx(
                  "flex h-full flex-col items-center justify-center gap-0.5 text-xs",
                  active ? "font-semibold text-neutral-900" : "text-neutral-500",
                )}
              >
                <Icon size={21} strokeWidth={active ? 2.4 : 1.8} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
