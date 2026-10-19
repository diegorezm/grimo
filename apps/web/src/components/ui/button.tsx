import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

type Variant = "primary" | "secondary" | "ghost";

const variants: Record<Variant, string> = {
  primary: "bg-accent-gradient text-accent-foreground shadow-md shadow-accent/30 hover:opacity-90",
  secondary: "glass text-text hover:opacity-90",
  ghost: "text-text-muted hover:text-text hover:bg-surface-muted",
};

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 font-mono text-xs font-medium uppercase tracking-wider transition disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
