import { describe, expect, it, vi } from "vitest";

import type { LlmAdapter } from "@/core/answer";

import { createAgente, MAX_PERGUNTA, perguntaSchema } from "./agente";

// Especificação do serviço do agente (H08). É a função única que o simulador web e,
// na H09, o webhook do WhatsApp usam: base real, sinônimos reais e o núcleo completo.
// O modelo é falso: nenhum teste chama o Gemini.

function modeloFalso(resposta: string | Error) {
  const gerar = vi.fn<LlmAdapter["gerar"]>(async () => {
    if (resposta instanceof Error) throw resposta;
    return resposta;
  });
  return { gerar };
}

describe("createAgente", () => {
  it("responde com a base real e cita o trecho certo", async () => {
    const agente = createAgente({
      llm: modeloFalso("Separa o tributo no pagamento [lc214-art31]."),
    });
    const resposta = await agente.perguntar("O que é o split payment?");

    expect(resposta.tipo).toBe("resposta");
    expect(resposta.fontes.map((t) => t.id)).toEqual(["lc214-art31"]);
  });

  it("recusa pergunta fora do escopo sem chamar o modelo", async () => {
    const llm = modeloFalso("não deveria ser chamado");
    const resposta = await createAgente({ llm }).perguntar("Qual o valor do IPVA do meu carro?");

    expect(resposta.tipo).toBe("recusa");
    expect(llm.gerar).not.toHaveBeenCalled();
  });

  it("entrega o erro do modelo para registro e responde com a mensagem de falha", async () => {
    const registrarErro = vi.fn();
    const erro = new Error("503 do provedor");
    const resposta = await createAgente({ llm: modeloFalso(erro), registrarErro }).perguntar(
      "O que é o split payment?",
    );

    expect(resposta.tipo).toBe("falha");
    expect(registrarErro).toHaveBeenCalledWith(erro);
  });

  it("atende várias perguntas seguidas com a mesma instância", async () => {
    const agente = createAgente({ llm: modeloFalso("Resposta [lc214-art31].") });

    await expect(agente.perguntar("O que é o split payment?")).resolves.toMatchObject({
      tipo: "resposta",
    });
    await expect(agente.perguntar("oi")).resolves.toMatchObject({ tipo: "boas_vindas" });
  });
});

describe("perguntaSchema", () => {
  it("aceita pergunta de até MAX_PERGUNTA caracteres", () => {
    expect(perguntaSchema.safeParse({ pergunta: "a".repeat(MAX_PERGUNTA) }).success).toBe(true);
  });

  it("rejeita pergunta maior que MAX_PERGUNTA (custo e abuso)", () => {
    expect(perguntaSchema.safeParse({ pergunta: "a".repeat(MAX_PERGUNTA + 1) }).success).toBe(
      false,
    );
  });

  it("rejeita entrada que não seja texto", () => {
    expect(perguntaSchema.safeParse({ pergunta: 42 }).success).toBe(false);
    expect(perguntaSchema.safeParse({}).success).toBe(false);
  });

  it("limita a pergunta a um tamanho razoável para WhatsApp", () => {
    expect(MAX_PERGUNTA).toBeGreaterThanOrEqual(200);
    expect(MAX_PERGUNTA).toBeLessThanOrEqual(1000);
  });
});
