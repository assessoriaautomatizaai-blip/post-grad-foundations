import { describe, expect, it, vi } from "vitest";

import type { FonteWeb, LlmAdapter } from "@/core/answer";
import base from "../../knowledge/base.json";

import { createAgente, MAX_PERGUNTA, perguntaSchema } from "./agente";

// Especificação do serviço do agente (H08; ADR-007). É a função única que o simulador web
// e o webhook do WhatsApp usam: base real e o núcleo completo.
// O modelo é falso: nenhum teste chama o Gemini.

function modeloFalso(resposta: string | Error, fontesWeb: FonteWeb[] = []) {
  const gerar = vi.fn<LlmAdapter["gerar"]>(async () => {
    if (resposta instanceof Error) throw resposta;
    return { texto: resposta, fontesWeb };
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

  it("manda ao modelo todos os trechos da base real", async () => {
    const llm = modeloFalso("O ISS acaba em 2033 [ec132-adct129].");
    await createAgente({ llm }).perguntar("Quando o ISS deixa de existir?");

    const enviado = llm.gerar.mock.calls[0]?.[0];
    for (const t of base) expect(enviado?.usuario).toContain(t.id);
  });

  it("responde pergunta fora da base com o complemento da web e a fonte", async () => {
    const fonte = { titulo: "gov.br", url: "https://www.gov.br/x" };
    const resposta = await createAgente({
      llm: modeloFalso("*Complemento:* O IPVA não muda com a reforma do consumo.", [fonte]),
    }).perguntar("Qual o valor do IPVA do meu carro?");

    expect(resposta.tipo).toBe("resposta");
    expect(resposta.fontesWeb).toEqual([fonte]);
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
