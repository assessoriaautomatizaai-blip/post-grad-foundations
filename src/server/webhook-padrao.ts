import { obterAgente } from "./agente-padrao";
import { createWebhookHandler } from "./webhook";

let handler: ((requisicao: Request) => Promise<Response>) | undefined;

/**
 * Webhook de produção: segredo em WEBHOOK_SECRET e o mesmo agente do simulador.
 * O log registra só a mensagem do erro, nunca o número nem o texto do usuário.
 */
export function obterWebhook(): (requisicao: Request) => Promise<Response> {
  handler ??= createWebhookHandler({
    segredo: process.env["WEBHOOK_SECRET"]?.trim(),
    agente: obterAgente(),
    // Provisório até a H10: falha de propósito, para o webhook nunca fingir que respondeu.
    enviar: async () => {
      throw new Error("envio pela Evolution API ainda não implementado (H10)");
    },
    registrarErro: (erro) =>
      console.error(
        "[webhook] falha ao responder:",
        erro instanceof Error ? erro.message : "erro desconhecido",
      ),
  });
  return handler;
}
