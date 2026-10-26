import { Link } from "@tanstack/react-router";
import { cn } from "@/utils/cn";

/** Links to the legal documents (landing footer, login, settings, legal pages). */
export function LegalLinks({ className }: { className?: string }) {
  const link = "hover:text-text underline-offset-4 hover:underline";
  return (
    <nav
      aria-label="Documentos legais"
      className={cn(
        "flex flex-wrap gap-x-5 gap-y-2 font-mono text-[11px] uppercase tracking-wider text-text-muted",
        className,
      )}
    >
      <Link to="/termos" className={link}>
        Termos de uso
      </Link>
      <Link to="/privacidade" className={link}>
        Privacidade
      </Link>
      <Link to="/privacidade" hash="armazenamento" className={link}>
        Cookies
      </Link>
      <Link to="/excluir-conta" className={link}>
        Excluir conta
      </Link>
    </nav>
  );
}
