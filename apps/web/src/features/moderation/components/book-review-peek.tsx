import { errorMessage, useBookReview, useDecideBook } from "@grimo/client";
import { GENRE_LABELS, type Genre } from "@grimo/core";
import { Link, useNavigate } from "@tanstack/react-router";
import { useCallback } from "react";
import { Spinner } from "@/components/feedback/spinner";
import { SidePeek } from "@/components/layout/side-peek";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StaffBadge } from "@/components/ui/staff-badge";
import { ago, LABEL, plural } from "./shared";

/**
 * A hand-added book under review in a side peek (`?review=<openLibraryId>`): what was typed, who
 * added it and what happened to their other books, with approve and reject pinned at the bottom.
 */
export function BookReviewPeek({ openLibraryId }: { openLibraryId: string }) {
  const navigate = useNavigate();
  const detail = useBookReview(openLibraryId);
  const decide = useDecideBook();
  const close = useCallback(
    () =>
      void navigate({
        to: ".",
        search: (prev) => ({ ...prev, review: undefined }),
        resetScroll: false,
      }),
    [navigate],
  );
  const book = detail.data;

  return (
    <SidePeek
      label="Livro cadastrado"
      onClose={close}
      footer={
        book ? (
          <div className="flex w-full flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                disabled={decide.isPending}
                onClick={() =>
                  decide.mutate({ openLibraryId, approve: true }, { onSuccess: close })
                }
              >
                Aprovar
              </Button>
              <Button
                variant="ghost"
                disabled={decide.isPending}
                onClick={() =>
                  decide.mutate({ openLibraryId, approve: false }, { onSuccess: close })
                }
              >
                Recusar
              </Button>
            </div>
            {decide.error && <p className="text-sm text-danger">{errorMessage(decide.error)}</p>}
          </div>
        ) : undefined
      }
    >
      {book ? (
        <div className="flex flex-col gap-7 pt-2">
          <header className="flex flex-col gap-2">
            <p className={LABEL}>Livro cadastrado à mão · {ago(book.addedAt)}</p>
            <h2 className="font-serif text-3xl font-medium italic leading-tight">{book.title}</h2>
            <p className="text-text-muted">{book.authors.join(", ")}</p>
          </header>

          <section className="flex flex-col gap-3">
            <h3 className={LABEL}>O que foi informado</h3>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-1.5 text-sm">
              <dt className="text-text-muted">Páginas</dt>
              <dd>{book.pageCount ?? "não informado"}</dd>
              <dt className="text-text-muted">Ano</dt>
              <dd>{book.publishedYear ?? "não informado"}</dd>
              <dt className="text-text-muted">Gêneros</dt>
              <dd>
                {book.genres.length > 0
                  ? book.genres.map((genre) => GENRE_LABELS[genre as Genre] ?? genre).join(", ")
                  : "não informado"}
              </dd>
              <dt className="text-text-muted">Estantes</dt>
              <dd>{plural(book.readers, "leitor tem", "leitores têm")} na estante</dd>
            </dl>
            <p className="text-sm text-text-muted">
              Aprovado, o livro aparece na busca de todo mundo. Recusado, continua só na estante de
              quem cadastrou.
            </p>
          </section>

          <section className="flex flex-col gap-3">
            <h3 className={LABEL}>Quem cadastrou</h3>
            {book.addedBy ? (
              <>
                <div className="flex items-center gap-3">
                  <Avatar src={book.addedBy.image} name={book.addedBy.name} size="size-12" />
                  <div className="min-w-0">
                    <Link
                      to="/u/$username"
                      params={{ username: book.addedBy.username }}
                      className="block truncate font-serif text-xl font-medium italic leading-tight hover:underline"
                    >
                      {book.addedBy.name}
                    </Link>
                    <p className="flex flex-wrap items-center gap-2 font-mono text-[11px] text-text-muted">
                      @{book.addedBy.username}
                      <StaffBadge role={book.addedBy.role} />
                    </p>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5 text-sm">
                  <p className="text-text-muted">
                    Conta criada {ago(book.addedBy.joinedAt)} ·{" "}
                    {plural(book.addedBy.bookCount, "livro", "livros")} ·{" "}
                    {plural(book.addedBy.followers, "seguidor", "seguidores")}
                  </p>
                  <p>
                    <strong className="font-semibold">
                      {plural(book.theirBooks.total, "livro cadastrado", "livros cadastrados")}
                    </strong>
                    <span className="text-text-muted">
                      {" "}
                      · {plural(book.theirBooks.approved, "aprovado", "aprovados")} ·{" "}
                      {plural(book.theirBooks.rejected, "recusado", "recusados")} ·{" "}
                      {plural(book.theirBooks.pending, "pendente", "pendentes")}
                    </span>
                  </p>
                  {book.addedBy.history && book.addedBy.history.reports > 0 && (
                    <p className="text-text-muted">
                      {plural(book.addedBy.history.reports, "denúncia", "denúncias")} sobre essa
                      conta ({plural(book.addedBy.history.actioned, "acionada", "acionadas")},{" "}
                      {plural(book.addedBy.history.dismissed, "dispensada", "dispensadas")}).
                    </p>
                  )}
                  {book.addedBy.suspended && (
                    <p className="text-danger">Essa conta está suspensa.</p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-text-muted">Conta excluída.</p>
            )}
          </section>
        </div>
      ) : detail.isPending ? (
        <Spinner />
      ) : (
        <p className="py-10 text-center text-text-muted">
          Esse livro já foi revisado (ou não existe mais).
        </p>
      )}
    </SidePeek>
  );
}
