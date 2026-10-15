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
            Converse com o Agente de IA da reforma tributária. As respostas citam o artigo da LC
            214/2025 ou da EC 132/2023 de onde vieram e, quando a lei não basta, completam com
            fontes da web, identificadas como não conferidas.
          </p>
        </header>
        <Simulador perguntar={(pergunta) => perguntarAoAgente({ data: { pergunta } })} />
      </div>
    </SiteLayout>
  );
}
