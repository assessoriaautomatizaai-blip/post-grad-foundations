import { Link } from "@tanstack/react-router";
import { Github } from "lucide-react";
import type { ReactNode } from "react";

import { LogoAssinatura } from "@/components/marca/Logo";

import { ThemeToggle } from "./ThemeToggle";

export const URL_REPOSITORIO =
  "https://github.com/assessoriaautomatizaai-blip/post-grad-foundations";

const ESTILO_LINK =
  "rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground aria-[current=page]:text-foreground aria-[current=page]:bg-secondary";

/** Estrutura comum: pular para o conteúdo, cabeçalho com navegação e tema, rodapé com aviso. */
export function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>

      <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-md"
            title="Inciso — página inicial"
          >
            <LogoAssinatura className="h-10" />
            <span className="hidden border-l pl-3 text-xs leading-tight text-muted-foreground md:block">
              Tira-dúvidas da
              <br />
              reforma tributária
            </span>
          </Link>

          <div className="flex items-center gap-1">
            <nav aria-label="Principal" className="flex items-center gap-1">
              <Link to="/" activeOptions={{ exact: true }} className={ESTILO_LINK}>
                Início
              </Link>
              <Link to="/simulador" className={ESTILO_LINK}>
                Simulador
              </Link>
              <a
                href={URL_REPOSITORIO}
                target="_blank"
                rel="noopener noreferrer"
                className={`${ESTILO_LINK} inline-flex items-center gap-1.5`}
              >
                <Github className="size-4" aria-hidden="true" />
                <span className="hidden sm:inline">Código</span>
                <span className="sr-only sm:hidden">Código</span>
              </a>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="conteudo" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>

      <footer className="border-t bg-secondary/40">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:px-6 md:flex-row md:items-center md:justify-between">
          <p className="max-w-prose">
            <strong className="font-semibold text-foreground">Informativo.</strong> As respostas do
            Inciso citam a EC 132/2023 e a LC 214/2025, mas a resposta não substitui a orientação de
            um contador ou advogado.
          </p>
          <p className="shrink-0">
            Inciso · Mini-projeto C4 · UFG/AKCIT ·{" "}
            <a
              href={`${URL_REPOSITORIO}/blob/main/LICENSE`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-foreground"
            >
              Licença MIT
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
