import { describe, expect, it } from "vitest";

import { ehSaudacao, MENSAGEM_BOAS_VINDAS } from "./decision";

// Especificação da saudação (H06; ADR-007). Com o ADR-007, o código não decide mais
// responder × recusar por limiar de busca: todas as perguntas vão ao modelo com a base
// inteira. Só a saudação continua tratada no código, sem chamar o modelo.

describe("ehSaudacao", () => {
  it.each(["", "   ", "oi", "Olá!", "Olá, tudo bem?", "bom dia", "Boa noite", "menu", "ajuda"])(
    "trata “%s” como saudação",
    (pergunta) => {
      expect(ehSaudacao(pergunta)).toBe(true);
    },
  );

  it.each(["Oi, o que é o IBS?", "Quando o ISS deixa de existir?", "O IPVA acaba?"])(
    "não trata pergunta como saudação: “%s”",
    (pergunta) => {
      expect(ehSaudacao(pergunta)).toBe(false);
    },
  );
});

describe("MENSAGEM_BOAS_VINDAS", () => {
  it("fala da reforma tributária e traz ao menos 3 perguntas de exemplo", () => {
    expect(MENSAGEM_BOAS_VINDAS).toMatch(/reforma tributária/i);
    expect(
      MENSAGEM_BOAS_VINDAS.split("\n").filter((linha) => linha.trim().endsWith("?")).length,
    ).toBeGreaterThanOrEqual(3);
  });
});
