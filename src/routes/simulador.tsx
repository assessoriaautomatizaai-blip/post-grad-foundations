import { createFileRoute } from "@tanstack/react-router";

import { SiteLayout } from "@/components/layout/SiteLayout";
import { Simulador } from "@/components/Simulador";
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

function PaginaSimulador() {
  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14">
        <header className="mx-auto mb-8 max-w-3xl">
          <h1 className="text-3xl font-semibold text-foreground sm:text-4xl">Simulador</h1>
          <p className="mt-3 text-muted-foreground">
            A mesma conversa do WhatsApp, no navegador. As respostas usam só a LC 214/2025 e a EC
            132/2023 e citam o artigo de onde vieram; fora da base, o agente recusa.
          </p>
        </header>
        <Simulador perguntar={(pergunta) => perguntarAoAgente({ data: { pergunta } })} />
      </div>
    </SiteLayout>
  );
}
