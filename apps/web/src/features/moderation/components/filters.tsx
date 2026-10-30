import { SearchIcon } from "@/components/ui/icons";
import { cn } from "@/utils/cn";

/** Search box in the same pill style as the readers directory. */
export function SearchField({
  value,
  onChange,
  placeholder,
  label,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  /** Sizing in the parent's layout (e.g. `flex-1 basis-64` in a wrapping row). */
  className?: string;
}) {
  return (
    <search className={cn("min-w-0", className)}>
      <label className="flex items-center gap-3 rounded-full bg-surface-muted px-5 py-2.5 focus-within:ring-2 focus-within:ring-accent/40">
        <SearchIcon className="text-text-muted" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          aria-label={label}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-text-muted"
        />
      </label>
    </search>
  );
}

/** A pill-shaped select; `placeholder` is the "no filter" option. */
export function SelectField<T extends string>({
  value,
  onChange,
  options,
  placeholder,
  label,
}: {
  value: T | "";
  onChange: (value: T | "") => void;
  options: readonly { value: T; label: string }[];
  placeholder?: string;
  label: string;
}) {
  return (
    <select
      value={value}
      aria-label={label}
      onChange={(event) => onChange(event.target.value as T | "")}
      className="rounded-full bg-surface-muted px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-accent/40"
    >
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
