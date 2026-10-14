import { GoogleGenAI } from "@google/genai";

import type { LlmAdapter } from "@/core/answer";

// Resposta curta para WhatsApp e custo previsível. No Gemini 3.x o raciocínio interno
// também conta neste limite; se as respostas vierem cortadas, é aqui que se ajusta.
const MAX_OUTPUT_TOKENS = 1024;
// Baixa variação: a resposta deve parafrasear a lei, não criar.
const TEMPERATURA = 0.2;

/** A parte do cliente do SDK `@google/genai` que o adaptador usa. */
export interface GeminiClient {
  models: {
    generateContent(requisicao: {
      model: string;
      contents: string;
      config?: {
        systemInstruction?: string;
        maxOutputTokens?: number;
        temperature?: number;
        abortSignal?: AbortSignal;
      };
    }): Promise<{ text?: string | undefined }>;
  };
}

export function createGeminiAdapter(opcoes: { client: GeminiClient; model: string }): LlmAdapter {
  const { client, model } = opcoes;
  return {
    async gerar(prompt, { signal } = {}) {
      const resposta = await client.models.generateContent({
        model,
        contents: prompt.usuario,
        config: {
          systemInstruction: prompt.sistema,
          maxOutputTokens: MAX_OUTPUT_TOKENS,
          temperature: TEMPERATURA,
          ...(signal ? { abortSignal: signal } : {}),
        },
      });
      const texto = resposta.text;
      if (!texto || texto.trim() === "") {
        // Ex.: resposta bloqueada por filtro de segurança ou cortada pelo limite de tokens.
        throw new Error("Gemini não devolveu texto");
      }
      return texto;
    },
  };
}

/** Lê a configuração do ambiente. A mensagem de erro cita a variável, nunca o valor. */
export function geminiConfigFromEnv(env: Record<string, string | undefined>): {
  apiKey: string;
  model: string;
} {
  const apiKey = env["GEMINI_API_KEY"]?.trim();
  const model = env["GEMINI_MODEL"]?.trim();
  if (!apiKey) throw new Error("Variável de ambiente GEMINI_API_KEY não configurada");
  if (!model) throw new Error("Variável de ambiente GEMINI_MODEL não configurada");
  return { apiKey, model };
}

/** Adaptador pronto para uso no servidor, configurado pelo ambiente. */
export function createGeminiFromEnv(
  env: Record<string, string | undefined> = process.env,
): LlmAdapter {
  const { apiKey, model } = geminiConfigFromEnv(env);
  return createGeminiAdapter({ client: new GoogleGenAI({ apiKey }), model });
}
