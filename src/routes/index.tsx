import { createFileRoute } from "@tanstack/react-router";

import { SiteLayout } from "@/components/layout/SiteLayout";
import { PaginaInicial } from "@/components/PaginaInicial";

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
  component: () => (
    <SiteLayout>
      <PaginaInicial />
    </SiteLayout>
  ),
});
