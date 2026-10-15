import { createFileRoute } from "@tanstack/react-router";

// Endpoint chamado pela Evolution API a cada evento do WhatsApp. A implementação fica em
// src/server/ (proibido no navegador) e só é carregada quando a requisição chega.
export const Route = createFileRoute("/api/whatsapp/webhook")({
  server: {
    handlers: {
      // Só POST: qualquer outro método recebe 405, em vez da página vazia do app.
      ANY: () => new Response("Method Not Allowed", { status: 405, headers: { Allow: "POST" } }),
      POST: async ({ request }) => {
        const { obterWebhook } = await import("@/server/webhook-padrao");
        return obterWebhook()(request);
      },
    },
  },
});
