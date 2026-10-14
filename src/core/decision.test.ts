import { describe, expect, it } from "vitest";

import base from "../../knowledge/base.json";
import { decide, DECISAO_PADRAO } from "./decision";
import { parseKnowledgeBase, type Trecho } from "./knowledge";
import { buildIndex, search, type Resultado } from "./retrieval";
import { SINONIMOS } from "./sinonimos";

// Especificação da decisão responder × recusar (H06, ADR-004).
// A recusa é decidida no código, antes de qualquer chamada ao modelo de linguagem:
// por isso `decide` não recebe o modelo e devolve só o que fazer.

function resultado(id: string, score: number, cobertura: number): Resultado {
  const trecho: Trecho = {
    id,
    norma: "LC 214/2025",
    dispositivo: "art. de exemplo",
    texto: "Texto de exemplo.",
    url_fonte: "https://www.planalto.gov.br/exemplo",
    data_referencia: "2026-10-14",
  };
  return { trecho, score, cobertura };
}

const limites = { scoreMinimo: 1, coberturaMinima: 0.5 };

describe("decide — boas-vindas", () => {
  it.each(["", "   ", "oi", "Olá!", "Olá, tudo bem?", "bom dia", "Boa noite", "menu", "ajuda"])(
    "responde com boas-vindas a “%s”",
    (pergunta) => {
      expect(decide(pergunta, [], limites).tipo).toBe("boas_vindas");
    },
  );

  it("a mensagem de boas-vindas fala da reforma tributária e traz ao menos 3 perguntas de exemplo", () => {
    const decisao = decide("oi", [], limites);
    if (decisao.tipo !== "boas_vindas") throw new Error("esperava boas-vindas");

    expect(decisao.mensagem).toMatch(/reforma tributária/i);
    expect(
      decisao.mensagem.split("\n").filter((linha) => linha.trim().endsWith("?")).length,
    ).toBeGreaterThanOrEqual(3);
  });

  it("saudação seguida de pergunta não é só saudação", () => {
    expect(decide("Oi, o que é o IBS?", [resultado("fx-1", 2, 1)], limites).tipo).toBe("responder");
  });
});

describe("decide — recusar ou responder", () => {
  it("recusa quando a busca não achou nada", () => {
    expect(decide("O que é o IPVA?", [], limites).tipo).toBe("recusar");
  });

  it("recusa quando o escore fica abaixo do mínimo, mesmo com cobertura total", () => {
    expect(decide("pergunta", [resultado("fx-1", 0.9, 1)], limites).tipo).toBe("recusar");
  });

  it("recusa quando a cobertura fica abaixo do mínimo, mesmo com escore alto", () => {
    expect(decide("pergunta", [resultado("fx-1", 9, 0.4)], limites).tipo).toBe("recusar");
  });

  it("responde com os trechos que passam nos dois mínimos, na ordem da busca", () => {
    const decisao = decide(
      "pergunta",
      [resultado("fx-1", 5, 0.9), resultado("fx-2", 4, 0.2), resultado("fx-3", 3, 0.6)],
      limites,
    );

    expect(decisao.tipo).toBe("responder");
    if (decisao.tipo !== "responder") return;
    expect(decisao.trechos.map((t) => t.id)).toEqual(["fx-1", "fx-3"]);
  });

  it("os mínimos são inclusivos", () => {
    expect(decide("pergunta", [resultado("fx-1", 1, 0.5)], limites).tipo).toBe("responder");
  });

  it("a recusa fala da reforma tributária e não afirma nenhum fato (sem números)", () => {
    const decisao = decide("O que é o IPVA?", [], limites);
    if (decisao.tipo !== "recusar") throw new Error("esperava recusa");

    expect(decisao.mensagem).toMatch(/reforma tributária/i);
    expect(decisao.mensagem).not.toMatch(/\d/);
  });

  it.each([
    { scoreMinimo: -1, coberturaMinima: 0.5 },
    { scoreMinimo: Number.NaN, coberturaMinima: 0.5 },
    { scoreMinimo: 1, coberturaMinima: 0 },
    { scoreMinimo: 1, coberturaMinima: 1.1 },
  ])("rejeita limites inválidos: %o", (invalidos) => {
    expect(() => decide("pergunta", [], invalidos)).toThrow();
  });
});

// Smoke tests com a base real e os limites padrão. Valores provisórios: a calibração
// é feita na H11 com o conjunto-ouro. "Advogado paga menos imposto?" e "Quem fixa a
// alíquota do IBS?" ficam de fora porque, no protótipo, foram recusadas indevidamente
// (erro do lado seguro), e serão tratadas na calibração.
describe("decide — base real com limites padrão", () => {
  const indice = buildIndex(parseKnowledgeBase(base), { sinonimos: SINONIMOS });
  const decidir = (pergunta: string) =>
    decide(pergunta, search(indice, pergunta), DECISAO_PADRAO).tipo;

  it.each([
    "O que é o split payment?",
    "O que é o Imposto Seletivo?",
    "Quem tem direito ao cashback?",
    "Quando o ICMS e o ISS deixam de existir?",
    "Como fica o MEI na reforma?",
    "Qual a alíquota da CBS em 2026?",
    "O que é o IBS?",
    "A cesta básica terá imposto?",
    "Quando acaba o PIS e a Cofins?",
    "Remédios terão redução?",
  ])("responde: “%s”", (pergunta) => {
    expect(decidir(pergunta)).toBe("responder");
  });

  it.each([
    "Como declarar o imposto de renda?",
    "Qual o valor do IPVA do meu carro?",
    "Como calcular o imposto da minha empresa?",
    "Qual a previsão do tempo amanhã?",
    "Qual a taxa Selic hoje?",
    "O ITBI muda na reforma?",
    "Quanto custa abrir uma empresa?",
    "Posso parcelar dívida com a Receita?",
  ])("recusa: “%s”", (pergunta) => {
    expect(decidir(pergunta)).toBe("recusar");
  });
});
