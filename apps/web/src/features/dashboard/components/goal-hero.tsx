import { useYearOverview } from "@grimo/client";
import { goalProgress } from "@grimo/core";
import { Link } from "@tanstack/react-router";
import { Sparkle } from "@/components/ui/sparkle";
import { cn } from "@/utils/cn";

/** Stack of lying books for the illustration (width, color). */
const stack = [
  ["w-36", "bg-shelf-read-fg"],
  ["w-40", "bg-accent"],
  ["w-32", "bg-shelf-want-to-read-fg"],
  ["w-38", "bg-shelf-reading-fg"],
  ["w-34", "bg-accent-start"],
  ["w-40", "bg-shelf-abandoned-fg"],
] as const;

/** Hero card: the yearly goal next to a pile of books. */
export function GoalHero() {
  const { data } = useYearOverview();
  if (!data) return null;
  const goal = data.goal ? goalProgress(data.goal.target, data.goal.done) : null;

  return (
    <section className="relative flex flex-col gap-6 overflow-hidden rounded-xl bg-surface-muted p-6 sm:flex-row sm:items-center sm:gap-10 sm:p-8">
      <div aria-hidden="true" className="relative flex shrink-0 flex-col items-center">
        <Sparkle className="absolute -top-2 -right-3 size-5" />
        {stack.map(([width, color], i) => (
          <span
            key={color}
            className={cn(
              "h-7 rounded-[3px] border-r-[6px] border-surface shadow-sm shadow-shadow",
              width,
              color,
              i % 2 === 1 ? "translate-x-2" : "-translate-x-1",
            )}
          />
        ))}
        <span className="ribbon absolute top-7 left-8 h-12 w-3" />
      </div>

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
          to="/me"
          className="bg-accent-gradient mt-2 w-fit rounded-full px-5 py-2.5 font-mono text-xs font-medium uppercase tracking-wider text-accent-foreground shadow-md shadow-accent/30 hover:opacity-90"
        >
          {goal ? "Ver resumo do mês" : "Definir meta"}
        </Link>
      </div>
    </section>
  );
}
