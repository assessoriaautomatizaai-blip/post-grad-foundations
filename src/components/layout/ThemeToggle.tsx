import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

import { aplicarTema, temaAtual, type Tema } from "@/lib/tema";
import { cn } from "@/lib/utils";

/** Alterna entre tema claro e escuro. O rótulo diz o que o clique vai fazer. */
export function ThemeToggle({ className }: { className?: string }) {
  // No servidor não há documento: começa claro e sincroniza depois de montar.
  const [tema, setTema] = useState<Tema>(() =>
    typeof document === "undefined" ? "claro" : temaAtual(),
  );
  useEffect(() => setTema(temaAtual()), []);

  const proximo: Tema = tema === "escuro" ? "claro" : "escuro";
  const Icone = tema === "escuro" ? Sun : Moon;

  return (
    <button
      type="button"
      onClick={() => {
        aplicarTema(proximo);
        setTema(proximo);
      }}
      aria-label={`Ativar tema ${proximo}`}
      title={`Ativar tema ${proximo}`}
      className={cn(
        "vidro inline-flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      <Icone className="size-4" aria-hidden="true" />
    </button>
  );
}
