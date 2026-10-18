import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import { LogoAssinatura } from "@/components/marca/Logo";

import { FundoVivo } from "./FundoVivo";
import { ThemeToggle } from "./ThemeToggle";

export const URL_REPOSITORIO =
  "https://github.com/assessoriaautomatizaai-blip/post-grad-foundations";

// Menu em cápsula de vidro; a página atual ganha a pílula de tinta com relevo
// (".nav-pilula" em src/styles.css, prompt 07).
const ESTILO_LINK =
  "nav-pilula rounded-full border border-transparent px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground";

/** Estrutura comum: pular para o conteúdo, cabeçalho com navegação e tema, rodapé com aviso. */
/** A página rolou além do topo: o cabeçalho ganha contorno e profundidade (prompt 05). */
function usePaginaRolada(): boolean {
  const [rolada, setRolada] = useState(false);
  useEffect(() => {
    const conferir = () => setRolada(window.scrollY > 8);
    conferir();
    window.addEventListener("scroll", conferir, { passive: true });
    return () => window.removeEventListener("scroll", conferir);
  }, []);
  return rolada;
}

export function SiteLayout({ children }: { children: ReactNode }) {
  const rolada = usePaginaRolada();
  return (
    <div className="flex min-h-dvh flex-col">
      <FundoVivo />
      <a
        href="#conteudo"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground"
      >
        Pular para o conteúdo
      </a>

      <header
        data-rolado={rolada}
        className="cabecalho sticky top-0 z-40 border-b border-transparent bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70 data-[rolado=true]:border-border"
      >
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
            <nav
              aria-label="Principal"
              className="vidro mr-2 flex items-center gap-0.5 rounded-full p-1"
            >
              <Link to="/" activeOptions={{ exact: true }} className={ESTILO_LINK}>
                Início
              </Link>
              <Link to="/simulador" className={ESTILO_LINK}>
                Simulador
              </Link>
            </nav>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="conteudo" tabIndex={-1} className="flex-1 focus:outline-none">
        {children}
      </main>

      <footer className="border-t">
        <div className="mx-auto max-w-6xl px-4 pt-14 pb-8 sm:px-6">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <LogoAssinatura decorativo className="-ml-3 h-16" />
              <p className="mt-3 max-w-md font-serif text-lg leading-relaxed text-muted-foreground">
                Dúvidas sobre a reforma tributária, respondidas com o artigo de lei citado.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-8 text-sm lg:col-span-5">
              <nav aria-label="Rodapé">
                <p className="font-mono text-xs tracking-[0.14em] text-muted-foreground uppercase">
                  Navegação
                </p>
                <ul className="mt-4 space-y-2">
                  <li>
                    <Link to="/" className="sublinhado py-0.5 text-foreground">
                      Início
                    </Link>
                  </li>
                  <li>
                    <Link to="/simulador" className="sublinhado py-0.5 text-foreground">
                      Simulador
                    </Link>
                  </li>
                </ul>
              </nav>
              <div>
                <p className="font-mono text-xs tracking-[0.14em] text-muted-foreground uppercase">
                  Projeto
                </p>
                <ul className="mt-4 space-y-2 text-foreground">
                  <li>Mini-projeto C4</li>
                  <li>UFG · AKCIT</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-12 flex flex-col gap-3 border-t pt-6 text-xs text-muted-foreground md:flex-row md:items-start md:justify-between">
            <p className="max-w-prose">
              <strong className="font-semibold text-foreground">Informativo.</strong> As respostas
              do Inciso citam a EC 132/2023 e a LC 214/2025, mas a resposta não substitui a
              orientação de um contador ou advogado.
            </p>
            <p className="shrink-0">
              © 2026 Inciso ·{" "}
              <a
                href={`${URL_REPOSITORIO}/blob/main/LICENSE`}
                target="_blank"
                rel="noopener noreferrer"
                className="sublinhado py-0.5 hover:text-foreground"
              >
                Licença MIT
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
