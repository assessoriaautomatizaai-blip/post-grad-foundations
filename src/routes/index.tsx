import { createFileRoute, Link } from "@tanstack/react-router";

import { Button } from "@/components/ui/button";

const TITULO = "Tira-dúvidas da reforma tributária";
const DESCRICAO =
  "Agente de WhatsApp que responde dúvidas básicas sobre a reforma tributária, citando o artigo da lei de onde veio cada resposta.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITULO },
      { name: "description", content: DESCRICAO },
      { property: "og:title", content: TITULO },
      { property: "og:description", content: DESCRICAO },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-xl text-center">
        <h1 className="text-3xl font-semibold text-foreground">{TITULO}</h1>
        <p className="mt-3 text-muted-foreground">{DESCRICAO}</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Base: EC 132/2023 e LC 214/2025, conferidas no texto oficial do Planalto. Fora da base, o
          agente recusa em vez de inventar.
        </p>
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild>
            <Link to="/simulador">Abrir o simulador</Link>
          </Button>
          <Button asChild variant="outline">
            <a
              href="https://github.com/assessoriaautomatizaai-blip/post-grad-foundations"
              target="_blank"
              rel="noopener noreferrer"
            >
              Código e documentação
            </a>
          </Button>
        </div>
        <p className="mt-6 text-xs text-muted-foreground">
          Informativo: não substitui a orientação de um contador ou advogado. Mini-projeto do curso
          C4 da Especialização em Engenharia de Software — UFG/AKCIT.
        </p>
      </div>
    </main>
  );
}
