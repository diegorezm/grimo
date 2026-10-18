export function Spinner({ label = "Carregando…" }: { label?: string }) {
  return (
    <p className="py-8 text-center font-mono text-xs uppercase tracking-wider text-text-muted">
      {label}
    </p>
  );
}
