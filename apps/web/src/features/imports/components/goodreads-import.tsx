import { errorMessage, useLatestImport, useStartImport } from "@grimo/client";
import { type ImportedBook, importSummary, parseGoodreadsCsv } from "@grimo/core";
import { Link } from "@tanstack/react-router";
import { type ChangeEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { ProgressBar } from "@/components/ui/progress-bar";

/**
 * Brings a Goodreads library over: the CSV is read here in the browser, the reader confirms,
 * and the server finds each book in Open Library and shelves it (quietly: no feed lines). The
 * progress and the books it couldn't find come live from `imports.latest`.
 */
export function GoodreadsImport() {
  const latest = useLatestImport().data;
  const start = useStartImport();
  const [parsed, setParsed] = useState<{ books: ImportedBook[]; skipped: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pick(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError(null);
    const result = parseGoodreadsCsv(await file.text());
    if (!result.ok) {
      setParsed(null);
      return setError(result.error);
    }
    setParsed({ books: result.books, skipped: result.skipped });
  }

  function confirm() {
    if (!parsed) return;
    start.mutate(parsed.books, {
      onSuccess: () => setParsed(null),
      onError: (failure) => setError(errorMessage(failure)),
    });
  }

  if (latest?.status === "running") {
    const percent = Math.round((latest.processed / latest.total) * 100);
    return (
      <section className="flex max-w-xl flex-col gap-3 rounded-xl bg-surface-muted p-6">
        <h2 className="text-2xl font-medium italic">Importando…</h2>
        <p className="text-text-muted">
          {latest.processed} de {latest.total} livros. Pode fechar esta página: a importação
          continua e os livros vão aparecendo nas suas estantes.
        </p>
        <ProgressBar percent={percent} />
      </section>
    );
  }

  return (
    <div className="flex max-w-xl flex-col gap-8">
      {latest?.status === "done" && <Result latest={latest} />}

      <section className="flex flex-col gap-4">
        <h2 className="text-2xl font-medium italic">Do Goodreads</h2>
        <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-text-muted">
          <li>
            No Goodreads (no computador), abra <strong>My Books</strong> e, no menu da esquerda,{" "}
            <strong>Import and export</strong>.
          </li>
          <li>
            Toque em <strong>Export Library</strong> e baixe o arquivo <code>.csv</code> quando
            ficar pronto.
          </li>
          <li>Escolha o arquivo aqui. Ele é lido no seu navegador.</li>
        </ol>
        {!parsed && (
          <label className="bg-accent-gradient w-fit cursor-pointer rounded-full px-6 py-3 font-mono text-xs font-medium uppercase tracking-wider text-accent-foreground shadow-md shadow-accent/30 hover:opacity-90">
            Escolher arquivo
            <input type="file" accept=".csv,text/csv" onChange={pick} className="sr-only" />
          </label>
        )}
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </section>

      {parsed && (
        <section className="flex flex-col gap-4 rounded-xl border border-border p-5">
          <p>
            Achamos <strong>{parsed.books.length} livros</strong>: {importSummary(parsed.books)}.
            {parsed.skipped > 0 && ` ${parsed.skipped} linhas sem título ficaram de fora.`}
          </p>
          <p className="text-sm text-text-muted">
            Cada livro é procurado no Open Library e vai para a estante certa, com a sua nota e a
            data em que você terminou. Quem já está na sua estante fica como está. Nada disso
            aparece no feed de quem segue você.
          </p>
          <div className="flex gap-2">
            <Button onClick={confirm} disabled={start.isPending}>
              Importar {parsed.books.length} livros
            </Button>
            <Button variant="ghost" onClick={() => setParsed(null)}>
              Cancelar
            </Button>
          </div>
        </section>
      )}

      <p className="text-sm text-text-muted">
        Vem do Skoob? O Skoob não tem exportação oficial. Por enquanto, busque seus livros e
        adicione à estante; se algum não aparecer, cadastre ele à mão.
      </p>
    </div>
  );
}

function Result({ latest }: { latest: NonNullable<ReturnType<typeof useLatestImport>["data"]> }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl bg-surface-muted p-6">
      <h2 className="text-2xl font-medium italic">Importação concluída</h2>
      <p className="text-text-muted">
        {latest.added} {latest.added === 1 ? "livro entrou" : "livros entraram"} nas suas estantes
        {latest.skipped > 0 && `, ${latest.skipped} já estavam lá`}
        {latest.notFoundCount > 0 &&
          ` e ${latest.notFoundCount} ${latest.notFoundCount === 1 ? "não foi encontrado" : "não foram encontrados"}`}
        .
      </p>
      <Link to="/shelves" className="w-fit font-semibold text-accent hover:underline">
        Ver estantes
      </Link>
      {latest.notFound.length > 0 && (
        <details className="text-sm">
          <summary className="cursor-pointer text-text-muted">
            Livros que não encontramos no Open Library
          </summary>
          <ul className="mt-2 list-disc pl-5">
            {latest.notFound.map((title, index) => (
              <li key={`${index}-${title}`}>
                <Link
                  to="/search"
                  search={{ q: title }}
                  className="underline-offset-4 hover:underline"
                >
                  {title}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
