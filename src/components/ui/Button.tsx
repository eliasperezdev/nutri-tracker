import clsx from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-neutral-900 text-white disabled:opacity-50",
  secondary: "bg-white text-neutral-900 ring-1 ring-neutral-300 disabled:opacity-50",
  ghost: "bg-transparent text-neutral-700 disabled:opacity-50",
  danger: "bg-white text-red-600 ring-1 ring-red-200 disabled:opacity-50",
};

export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: "sm" | "md";
}) {
  return (
    <button
      type={type}
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-xl font-medium",
        size === "md" ? "h-12 px-4 text-base" : "h-9 px-3 text-sm",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
