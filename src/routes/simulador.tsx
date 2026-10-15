import { createFileRoute } from "@tanstack/react-router";

import { Simulador } from "@/components/Simulador";
import { perguntarAoAgente } from "@/lib/simulador.functions";

export const Route = createFileRoute("/simulador")({
  head: () => ({
    meta: [
      { title: "Simulador — Tira-dúvidas da reforma tributária" },
      {
        name: "description",
        content:
          "Converse com o agente que responde dúvidas básicas sobre a reforma tributária, citando a lei.",
      },
    ],
  }),
  component: PaginaSimulador,
});

function PaginaSimulador() {
  return (
    <main className="min-h-screen bg-background px-4 py-8">
      <header className="mx-auto mb-6 max-w-2xl">
        <h1 className="text-2xl font-semibold text-foreground">
          Tira-dúvidas da reforma tributária
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Simulador do agente de WhatsApp. As respostas usam só a LC 214/2025 e a EC 132/2023 e
          citam o artigo de onde vieram. Informativo: não substitui um contador ou advogado.
        </p>
      </header>
      <Simulador perguntar={(pergunta) => perguntarAoAgente({ data: { pergunta } })} />
    </main>
  );
}
