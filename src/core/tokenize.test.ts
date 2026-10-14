import { describe, expect, it } from "vitest";

import { tokenize } from "./tokenize";

// Especificação da normalização usada pela recuperação BM25 (H05).
// Pergunta e trecho da lei passam pela mesma função, então as duas formas
// de escrever ("tributária" e "tributaria") precisam virar o mesmo token.
describe("tokenize", () => {
  it("converte para minúsculas e remove acentos e cedilha", () => {
    expect(tokenize("Reforma Tributária")).toEqual(["reforma", "tributaria"]);
    expect(tokenize("CONTRIBUIÇÃO")).toEqual(["contribuicao"]);
  });

  it("remove pontuação", () => {
    expect(tokenize("IBS, CBS; Seletivo!")).toEqual(["ibs", "cbs", "seletivo"]);
  });

  it("remove artigos, preposições e conectivos comuns", () => {
    expect(tokenize("O que é a CBS da reforma?")).toEqual(["cbs", "reforma"]);
    expect(tokenize("Muda para o Simples Nacional e para o MEI")).toEqual([
      "muda",
      "simples",
      "nacional",
      "mei",
    ]);
  });

  it("mantém números, separando os de uma referência legal", () => {
    expect(tokenize("LC 214/2025, art. 5º")).toEqual(["lc", "214", "2025", "art", "5"]);
  });

  it("separa termos com hífen", () => {
    expect(tokenize("não-cumulatividade")).toEqual(["nao", "cumulatividade"]);
  });

  it("devolve lista vazia para texto vazio ou só com espaços e pontuação", () => {
    expect(tokenize("")).toEqual([]);
    expect(tokenize("   ?!  ")).toEqual([]);
  });
});
