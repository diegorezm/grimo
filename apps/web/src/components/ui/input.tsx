import type { InputHTMLAttributes } from "react";
import { cn } from "@/utils/cn";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-sm border border-border bg-surface px-3 py-2 text-sm outline-none placeholder:text-text-muted focus:border-primary",
        className,
      )}
      {...props}
    />
  );
}
