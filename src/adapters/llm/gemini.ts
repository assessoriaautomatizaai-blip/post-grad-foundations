import { GoogleGenAI } from "@google/genai";

import type { FonteWeb, LlmAdapter } from "@/core/answer";

// Resposta para WhatsApp e custo previsível. No Gemini 3.x o raciocínio interno também
// conta neste limite, e a busca na web (ADR-007) aumenta o texto: se as respostas vierem
// cortadas, é aqui que se ajusta.
const MAX_OUTPUT_TOKENS = 2048;
// Baixa variação: a resposta deve explicar a lei e as fontes, não criar.
const TEMPERATURA = 0.2;
// Busca no Google (ADR-007): o modelo completa o que a base não cobre, com fonte.
const FERRAMENTAS = [{ googleSearch: {} }];

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
        tools?: { googleSearch: Record<string, never> }[];
        abortSignal?: AbortSignal;
      };
    }): Promise<{
      text?: string | undefined;
      candidates?:
        | {
            groundingMetadata?:
              | {
                  groundingChunks?:
                    | {
                        web?: { uri?: string | undefined; title?: string | undefined } | undefined;
                      }[]
                    | undefined;
                }
              | undefined;
          }[]
        | undefined;
    }>;
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
          tools: FERRAMENTAS,
          ...(signal ? { abortSignal: signal } : {}),
        },
      });
      const texto = resposta.text;
      if (!texto || texto.trim() === "") {
        // Ex.: resposta bloqueada por filtro de segurança ou cortada pelo limite de tokens.
        throw new Error("Gemini não devolveu texto");
      }
      // Fontes da busca: pedaços sem endereço são descartados; sem título, usa o endereço.
      const fontesWeb: FonteWeb[] = (
        resposta.candidates?.[0]?.groundingMetadata?.groundingChunks ?? []
      ).flatMap(({ web }) =>
        web?.uri ? [{ titulo: web.title?.trim() || web.uri, url: web.uri }] : [],
      );
      return { texto, fontesWeb };
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
