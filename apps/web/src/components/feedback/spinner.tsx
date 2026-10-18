export function Spinner({ label = "Carregando…" }: { label?: string }) {
  return <p className="py-8 text-center text-sm text-text-muted">{label}</p>;
}
