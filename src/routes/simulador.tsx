import { createFileRoute } from "@tanstack/react-router";

import { SiteLayout } from "@/components/layout/SiteLayout";
import { Simulador, type GrupoRoteiro } from "@/components/Simulador";
import { perguntarAoAgente } from "@/lib/simulador.functions";

export const Route = createFileRoute("/simulador")({
  head: () => ({
    meta: [
      { title: "Simulador — Inciso" },
      {
        name: "description",
        content:
          "Converse com o agente que responde dúvidas básicas sobre a reforma tributária, citando a lei.",
      },
    ],
  }),
  component: PaginaSimulador,
});

// Roteiro da apresentação (prompt 04): uma pergunta para cada comportamento do agente.
const ROTEIRO: GrupoRoteiro[] = [
  {
    titulo: "Com a lei",
    descricao: "Resposta que cita o artigo da base.",
    perguntas: ["Quando o ISS deixa de existir?", "Ônibus e metrô vão pagar imposto?"],
  },
  {
    titulo: "Com a web",
    descricao: "Complemento com link, separado do que é lei.",
    perguntas: ["O IPVA acaba com a reforma?", "Quando as notas fiscais passam a ter IBS e CBS?"],
  },
  {
    titulo: "Fora do tema",
    descricao: "Mensagem que explica o foco do agente.",
    perguntas: ["Qual a previsão do tempo amanhã?"],
  },
];

function PaginaSimulador() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-10">
        <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-mono text-[0.68rem] tracking-[0.16em] text-muted-foreground uppercase">
              Consultor · demonstração ao vivo
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
              Simulador
            </h1>
          </div>
          <p className="max-w-md text-sm text-muted-foreground">
            As respostas citam o artigo da LC 214/2025 ou da EC 132/2023 de onde vieram e, quando a
            lei não basta, completam com fontes da web, identificadas como não conferidas.
          </p>
        </header>
        <Simulador
          perguntar={(pergunta) => perguntarAoAgente({ data: { pergunta } })}
          roteiro={ROTEIRO}
        />
      </div>
    </SiteLayout>
  );
}
