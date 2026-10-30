import { type BookDetail, errorMessage, useCreatePost, useToggleLike } from "@grimo/client";
import { createPostSchema, firstIssue, QUOTE_MAX_LENGTH, timeAgo } from "@grimo/core";
import { Link } from "@tanstack/react-router";
import { type FormEvent, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { QuoteText } from "./quote-text";

/** "Citações": passages readers saved from this book (Skoob's citações), and a box to add one. */
export function BookQuotes({ detail }: { detail: BookDetail }) {
  const toggleLike = useToggleLike();
  return (
    <section aria-labelledby="quotes" className="flex flex-col gap-5">
      <h2 id="quotes" className="text-2xl font-medium italic">
        Citações
      </h2>
      {detail.book.id ? (
        <QuoteComposer bookId={detail.book.id} pageCount={detail.book.pageCount} />
      ) : (
        <p className="text-sm text-text-muted">Adicione à estante para guardar citações.</p>
      )}
      {detail.quotes.length === 0 ? (
        <p className="text-sm text-text-muted">Ninguém guardou um trecho deste livro ainda.</p>
      ) : (
        <ul className="flex flex-col gap-6">
          {detail.quotes.map((quote) => (
            <li key={quote.id} className="flex flex-col gap-2.5">
              <QuoteText body={quote.body} page={quote.page} />
              <p className="flex items-center gap-2 pl-4 text-sm text-text-muted">
                <Avatar src={quote.author.image} name={quote.author.name} size="size-6" />
                {quote.author.username ? (
                  <Link
                    to="/u/$username"
                    params={{ username: quote.author.username }}
                    className="font-medium text-text hover:underline"
                  >
                    {quote.author.name}
                  </Link>
                ) : (
                  <span>{quote.author.name}</span>
                )}
                <span className="font-mono text-[10px]">{timeAgo(new Date(quote.createdAt))}</span>
                <button
                  type="button"
                  aria-pressed={quote.likedByMe}
                  onClick={() => toggleLike.mutate({ postId: quote.id, like: !quote.likedByMe })}
                  className="ml-auto font-mono text-[11px] hover:text-accent"
                >
                  {quote.likedByMe ? "♥" : "♡"} {quote.likeCount}
                </button>
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function QuoteComposer({ bookId, pageCount }: { bookId: string; pageCount: number | null }) {
  const create = useCreatePost();
  const [body, setBody] = useState("");
  const [page, setPage] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit(event: FormEvent) {
    event.preventDefault();
    const input = createPostSchema.safeParse({
      kind: "quote",
      bookId,
      body,
      page: page.trim() === "" ? null : Number(page),
    });
    if (!input.success) return setError(firstIssue(input.error));
    setError(null);
    create.mutate(input.data, {
      onSuccess: () => {
        setBody("");
        setPage("");
      },
      onError: (failure) => setError(errorMessage(failure)),
    });
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="flex flex-col gap-3 rounded-xl border border-border p-4"
    >
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        maxLength={QUOTE_MAX_LENGTH}
        placeholder="Um trecho que você quer guardar…"
        aria-label="Trecho do livro"
        className="w-full resize-none bg-transparent font-serif italic outline-none placeholder:text-text-muted"
      />
      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-text-muted">
          Página
          <input
            value={page}
            onChange={(e) => setPage(e.target.value.replace(/\D/g, ""))}
            inputMode="numeric"
            placeholder={pageCount ? `1–${pageCount}` : "—"}
            className="w-20 rounded-md border border-border bg-surface px-2 py-1 text-center text-sm text-text outline-none focus:border-accent"
          />
        </label>
        <Button type="submit" disabled={!body.trim() || create.isPending}>
          Guardar citação
        </Button>
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </form>
  );
}
