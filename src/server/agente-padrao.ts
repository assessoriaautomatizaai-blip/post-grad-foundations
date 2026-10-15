import type { LlmAdapter } from "@/core/answer";
import { createGeminiFromEnv } from "@/adapters/llm/gemini";

import { createAgente, type Agente } from "./agente";

let agente: Agente | undefined;
let gemini: LlmAdapter | undefined;

// O cliente do Gemini só é criado quando o modelo é realmente necessário. Assim,
// boas-vindas e recusas (que não chamam o modelo) funcionam mesmo sem a chave, e a
// falta de configuração aparece no log como erro do modelo, não derruba o agente.
const geminiSobDemanda: LlmAdapter = {
  gerar: (prompt, opcoes) => {
    gemini ??= createGeminiFromEnv();
    return gemini.gerar(prompt, opcoes);
  },
};

/**
 * Agente de produção: Gemini configurado pelo ambiente. Criado na primeira pergunta e
 * reaproveitado depois. O log registra só a mensagem do erro, nunca a pergunta do usuário.
 */
export function obterAgente(): Agente {
  agente ??= createAgente({
    llm: geminiSobDemanda,
    registrarErro: (erro) =>
      console.error(
        "[agente] falha ao gerar resposta:",
        erro instanceof Error ? erro.message : "erro desconhecido",
      ),
  });
  return agente;
}
