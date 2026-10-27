import { describe, expect, it, vi } from "vitest";

import { createGeminiAdapter, geminiConfigFromEnv, type GeminiClient } from "./gemini";

// Especificação do adaptador do Gemini (H07, ADR-003; busca no Google pelo ADR-007).
// O cliente do SDK é trocado por um falso com a mesma forma de chamada
// (ai.models.generateContent → response.text e candidates[0].groundingMetadata):
// nenhum teste acessa a rede nem precisa de chave.

type RespostaFalsa = {
  text?: string;
  candidates?: {
    groundingMetadata?: { groundingChunks?: { web?: { uri?: string; title?: string } }[] };
  }[];
};

function clienteFalso(resposta: RespostaFalsa | Error) {
  const generateContent = vi.fn(async () => {
    if (resposta instanceof Error) throw resposta;
    return resposta;
  });
  return { client: { models: { generateContent } } satisfies GeminiClient, generateContent };
}

describe("createGeminiAdapter", () => {
  it("envia o prompt de sistema como systemInstruction e a mensagem do usuário como contents", async () => {
    const { client, generateContent } = clienteFalso({ text: "ok [fx-1]" });
    const llm = createGeminiAdapter({ client, model: "gemini-3.8-flash" });

    await llm.gerar({ sistema: "REGRAS", usuario: "PERGUNTA" });

    expect(generateContent).toHaveBeenCalledTimes(1);
    expect(generateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        model: "gemini-3.8-flash",
        contents: "PERGUNTA",
        config: expect.objectContaining({ systemInstruction: "REGRAS" }),
      }),
    );
  });

  it("limita o tamanho da resposta (custo e WhatsApp)", async () => {
    const { client, generateContent } = clienteFalso({ text: "ok" });
    await createGeminiAdapter({ client, model: "m" }).gerar({ sistema: "s", usuario: "u" });

    const config = (
      generateContent.mock.calls[0] as unknown as [{ config: { maxOutputTokens?: number } }]
    )[0].config;
    expect(config.maxOutputTokens).toBeGreaterThan(0);
    expect(config.maxOutputTokens).toBeLessThanOrEqual(2048);
  });

  it("pede raciocínio baixo ao modelo (resposta mais rápida com a busca na web)", async () => {
    const { client, generateContent } = clienteFalso({ text: "ok" });
    await createGeminiAdapter({ client, model: "m" }).gerar({ sistema: "s", usuario: "u" });

    expect(generateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({ thinkingConfig: { thinkingLevel: "LOW" } }),
      }),
    );
  });

  it("devolve o texto gerado, sem fontes da web quando a busca não foi usada", async () => {
    const { client } = clienteFalso({ text: "Resposta [fx-1]." });
    await expect(
      createGeminiAdapter({ client, model: "m" }).gerar({ sistema: "s", usuario: "u" }),
    ).resolves.toEqual({ texto: "Resposta [fx-1].", fontesWeb: [] });
  });

  it("liga a busca no Google (ADR-007)", async () => {
    const { client, generateContent } = clienteFalso({ text: "ok" });
    await createGeminiAdapter({ client, model: "m" }).gerar({ sistema: "s", usuario: "u" });

    expect(generateContent).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({ tools: [{ googleSearch: {} }] }),
      }),
    );
  });

  it("devolve as fontes da busca (título e endereço) junto com o texto", async () => {
    const { client } = clienteFalso({
      text: "*Complemento:* texto.",
      candidates: [
        {
          groundingMetadata: {
            groundingChunks: [
              { web: { uri: "https://www.gov.br/receitafederal/x", title: "gov.br" } },
              { web: { uri: "https://cgibs.gov.br/y", title: "cgibs.gov.br" } },
            ],
          },
        },
      ],
    });
    const geracao = await createGeminiAdapter({ client, model: "m" }).gerar({
      sistema: "s",
      usuario: "u",
    });

    expect(geracao.fontesWeb).toEqual([
      { titulo: "gov.br", url: "https://www.gov.br/receitafederal/x" },
      { titulo: "cgibs.gov.br", url: "https://cgibs.gov.br/y" },
    ]);
  });

  it("ignora pedaço da busca sem endereço e usa o endereço como título quando falta o título", async () => {
    const { client } = clienteFalso({
      text: "ok",
      candidates: [
        {
          groundingMetadata: {
            groundingChunks: [
              {},
              { web: { title: "sem endereço" } },
              { web: { uri: "https://a.gov.br" } },
            ],
          },
        },
      ],
    });
    const geracao = await createGeminiAdapter({ client, model: "m" }).gerar({
      sistema: "s",
      usuario: "u",
    });

    expect(geracao.fontesWeb).toEqual([{ titulo: "https://a.gov.br", url: "https://a.gov.br" }]);
  });

  it("lança erro quando o modelo não devolve texto (ex.: bloqueio de segurança)", async () => {
    const { client } = clienteFalso({});
    await expect(
      createGeminiAdapter({ client, model: "m" }).gerar({ sistema: "s", usuario: "u" }),
    ).rejects.toThrow();
  });

  it("deixa passar o erro do provedor, para o núcleo responder com a mensagem de falha", async () => {
    const { client } = clienteFalso(new Error("429 cota excedida"));
    await expect(
      createGeminiAdapter({ client, model: "m" }).gerar({ sistema: "s", usuario: "u" }),
    ).rejects.toThrow("429");
  });
});

describe("geminiConfigFromEnv", () => {
  it("lê a chave e o modelo das variáveis de ambiente", () => {
    expect(
      geminiConfigFromEnv({ GEMINI_API_KEY: "chave-teste", GEMINI_MODEL: "gemini-3.8-flash" }),
    ).toEqual({
      apiKey: "chave-teste",
      model: "gemini-3.8-flash",
    });
  });

  it("acusa a variável que falta, pelo nome", () => {
    expect(() => geminiConfigFromEnv({ GEMINI_MODEL: "m" })).toThrow("GEMINI_API_KEY");
    expect(() => geminiConfigFromEnv({ GEMINI_API_KEY: "k" })).toThrow("GEMINI_MODEL");
  });

  it("nunca coloca o valor da chave na mensagem de erro", () => {
    expect(() => geminiConfigFromEnv({ GEMINI_API_KEY: "segredo-123", GEMINI_MODEL: "" })).toThrow(
      expect.objectContaining({ message: expect.not.stringContaining("segredo-123") }),
    );
  });
});
