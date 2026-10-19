import { useMonthlySummary } from "@grimo/client";
import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { BookOpenIcon, HeartIcon, PagesIcon } from "@/components/ui/icons";
import { BookCover } from "@/features/books";

const monthName = new Intl.DateTimeFormat("pt-BR", { month: "long" });

/** "Este mês" as a short list of highlights. */
export function MonthList() {
  const { data } = useMonthlySummary();
  const month = monthName.format(new Date());
  const books = data?.booksRead ?? 0;
  const pages = data?.pagesRead ?? 0;

  return (
    <section aria-labelledby="month-title" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 id="month-title" className="text-2xl font-medium italic">
          Este mês
        </h2>
        <Link
          to="/card"
          className="rounded-full border border-border px-4 py-1.5 font-mono text-[11px] uppercase tracking-wider text-text-muted transition hover:bg-surface-muted hover:text-text"
        >
          Criar card
        </Link>
      </div>
      <ul className="flex flex-col gap-2.5">
        <Row
          icon={<BookOpenIcon />}
          tint="bg-shelf-read-bg text-shelf-read-fg"
          title={`${books} ${books === 1 ? "livro terminado" : "livros terminados"}`}
          detail={`Lidos em ${month}`}
        />
        <Row
          icon={<PagesIcon />}
          tint="bg-shelf-want-to-read-bg text-shelf-want-to-read-fg"
          title={`${pages.toLocaleString("pt-BR")} páginas`}
          detail="Cada uma conta"
        />
        {data?.favoriteBook ? (
          <Row
            icon={
              <BookCover
                src={data.favoriteBook.coverUrl}
                title={data.favoriteBook.title}
                className="w-8"
              />
            }
            title={data.favoriteBook.title}
            detail="Favorito do mês"
          />
        ) : (
          <Row
            icon={<HeartIcon />}
            tint="bg-shelf-reading-bg text-shelf-reading-fg"
            title="Sem favorito ainda"
            detail="Avalie um livro lido este mês"
          />
        )}
      </ul>
    </section>
  );
}

function Row({
  icon,
  tint,
  title,
  detail,
}: {
  icon: ReactNode;
  tint?: string;
  title: string;
  detail: string;
}) {
  return (
    <li className="flex items-center gap-4 rounded-lg p-2.5 transition hover:bg-surface-muted/60">
      <span className={`grid size-12 shrink-0 place-items-center rounded-md ${tint ?? ""}`}>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block truncate font-serif font-medium">{title}</span>
        <span className="block truncate text-sm text-text-muted">{detail}</span>
      </span>
    </li>
  );
}
