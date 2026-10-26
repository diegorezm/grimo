import { Button } from "@/components/ui/button";

/** Shown when a screen throws while rendering, instead of a blank page. */
export function ErrorScreen({ reset }: { reset?: () => void }) {
  return (
    <div role="alert" className="mx-auto flex max-w-md flex-col items-start gap-4 px-6 py-16">
      <h1 className="text-3xl font-medium italic">Algo deu errado</h1>
      <p className="text-text-muted">
        Essa tela não carregou direito. Seus dados estão salvos; tente de novo ou recarregue a
        página.
      </p>
      <div className="flex gap-2">
        {reset && <Button onClick={reset}>Tentar de novo</Button>}
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Recarregar
        </Button>
      </div>
    </div>
  );
}
