import base from "../../knowledge/base.json";
import { answerQuestion, type LlmAdapter, type Resposta } from "@/core/answer";
import { parseKnowledgeBase } from "@/core/knowledge";
import { MAX_PERGUNTA, perguntaSchema } from "@/core/pergunta";

export { MAX_PERGUNTA, perguntaSchema };

export interface Agente {
  perguntar(pergunta: string): Promise<Resposta>;
}

/**
 * Serviço único do agente, usado pelo simulador web e pelo webhook do WhatsApp.
 * A base é validada uma vez, na criação; cada pergunta vai ao modelo com a base inteira
 * (ADR-007).
 */
export function createAgente(dependencias: {
  llm: LlmAdapter;
  registrarErro?: (erro: unknown) => void;
}): Agente {
  const trechos = parseKnowledgeBase(base);
  const { llm, registrarErro } = dependencias;
  return {
    perguntar: (pergunta) =>
      answerQuestion(pergunta, {
        base: trechos,
        llm,
        ...(registrarErro ? { registrarErro } : {}),
      }),
  };
}
