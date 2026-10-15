import { createServerFn } from "@tanstack/react-start";

import { perguntaSchema } from "@/core/pergunta";

/**
 * Função de servidor do simulador. O navegador só enxerga a chamada (RPC); o handler
 * roda no servidor e é removido do código do cliente, junto com o import do agente.
 * A implementação fica em src/server/, que o TanStack Start proíbe no navegador:
 * a chave do Gemini e a base nunca chegam ao cliente.
 */
export const perguntarAoAgente = createServerFn({ method: "POST" })
  .validator(perguntaSchema)
  .handler(async ({ data }) => {
    const { obterAgente } = await import("@/server/agente-padrao");
    return obterAgente().perguntar(data.pergunta);
  });
