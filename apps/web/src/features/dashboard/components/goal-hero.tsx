import { useYearOverview } from "@grimo/client";
import { goalProgress } from "@grimo/core";
import { Link } from "@tanstack/react-router";
import { BookStack } from "@/components/ui/book-stack";
import { Sparkle } from "@/components/ui/sparkle";

/** Hero card: the yearly goal next to a pile of books. */
export function GoalHero() {
  const { data } = useYearOverview();
  if (!data) return null;
  const goal = data.goal ? goalProgress(data.goal.target, data.goal.done) : null;

  return (
    <section className="relative flex flex-col gap-6 overflow-hidden rounded-xl bg-surface-muted p-6 sm:flex-row sm:items-center sm:gap-10 sm:p-8">
      <BookStack />

      <div className="flex flex-1 flex-col gap-3">
        <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-text-muted">
          Meta de leitura
        </span>
        <h2 className="text-3xl leading-tight font-medium italic">
          {goal ? (
            <>
              {goal.done} de {goal.target} livros em {data.year}
            </>
          ) : (
            <>Quantos livros em {data.year}?</>
          )}
        </h2>
        {goal ? (
          <>
            <p className="text-text-muted">
              {goal.done >= goal.target
                ? "Meta batida! Tudo daqui pra frente é bônus."
                : `Faltam ${goal.target - goal.done}. Você está em ${goal.percent}% do caminho.`}
            </p>
            <div className="relative mt-1 h-2.5 rounded-full bg-surface">
              <div
                className="bg-accent-gradient h-full rounded-full"
                style={{ width: `${goal.percent}%` }}
              />
              <Sparkle
                className="absolute -top-1.5 size-5.5"
                style={{ left: `calc(${goal.percent}% - 11px)` }}
              />
            </div>
          </>
        ) : (
          <p className="text-text-muted">Defina uma meta no seu perfil e acompanhe aqui.</p>
        )}
        <Link
          to={goal ? "/card" : "/me"}
          className="bg-accent-gradient mt-2 w-fit rounded-full px-5 py-2.5 font-mono text-xs font-medium uppercase tracking-wider text-accent-foreground shadow-md shadow-accent/30 hover:opacity-90"
        >
          {goal ? "Ver resumo do mês" : "Definir meta"}
        </Link>
      </div>
    </section>
  );
}
