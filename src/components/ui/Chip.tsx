import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

export function Chip({
  selected,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { selected?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={clsx(
        "h-9 shrink-0 rounded-full px-3.5 text-sm font-medium ring-1 transition-colors",
        selected
          ? "bg-neutral-900 text-white ring-neutral-900"
          : "bg-white text-neutral-700 ring-neutral-300",
        className,
      )}
      {...props}
    />
  );
}
