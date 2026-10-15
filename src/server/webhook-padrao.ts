import { createEvolutionFromEnv, type EnviarMensagem } from "@/adapters/evolution/evolution";

import { obterAgente } from "./agente-padrao";
import { createWebhookHandler } from "./webhook";

let handler: ((requisicao: Request) => Promise<Response>) | undefined;
let evolution: EnviarMensagem | undefined;

// O cliente da Evolution só é criado no primeiro envio: configuração faltando vira erro
// registrado no log (e 500 para a Evolution tentar de novo), em vez de derrubar o webhook.
const enviarPelaEvolution: EnviarMensagem = (para, texto) => {
  evolution ??= createEvolutionFromEnv();
  return evolution(para, texto);
};

/**
 * Webhook de produção: segredo em WEBHOOK_SECRET, o mesmo agente do simulador e envio
 * pela Evolution API. O log registra só a mensagem do erro, nunca o número nem o texto.
 */
export function obterWebhook(): (requisicao: Request) => Promise<Response> {
  handler ??= createWebhookHandler({
    segredo: process.env["WEBHOOK_SECRET"]?.trim(),
    agente: obterAgente(),
    enviar: enviarPelaEvolution,
    registrarErro: (erro) =>
      console.error(
        "[webhook] falha ao responder:",
        erro instanceof Error ? erro.message : "erro desconhecido",
      ),
  });
  return handler;
}
