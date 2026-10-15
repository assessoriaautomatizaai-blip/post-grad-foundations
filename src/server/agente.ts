import base from "../../knowledge/base.json";
import { answerQuestion, type LlmAdapter, type Resposta } from "@/core/answer";
import type { Limites } from "@/core/decision";
import { parseKnowledgeBase } from "@/core/knowledge";
import { MAX_PERGUNTA, perguntaSchema } from "@/core/pergunta";
import { buildIndex } from "@/core/retrieval";
import { SINONIMOS } from "@/core/sinonimos";

export { MAX_PERGUNTA, perguntaSchema };

export interface Agente {
  perguntar(pergunta: string): Promise<Resposta>;
}

/**
 * Serviço único do agente, usado pelo simulador web e pelo webhook do WhatsApp.
 * A base é validada e indexada uma vez, na criação; cada pergunta só busca e decide.
 */
export function createAgente(dependencias: {
  llm: LlmAdapter;
  registrarErro?: (erro: unknown) => void;
  limites?: Limites;
}): Agente {
  const indice = buildIndex(parseKnowledgeBase(base), { sinonimos: SINONIMOS });
  const { llm, registrarErro, limites } = dependencias;
  return {
    perguntar: (pergunta) =>
      answerQuestion(pergunta, {
        indice,
        llm,
        ...(limites ? { limites } : {}),
        ...(registrarErro ? { registrarErro } : {}),
      }),
  };
}
