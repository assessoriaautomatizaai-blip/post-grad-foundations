import { describe, expect, it } from "vitest";

import base from "../../knowledge/base.json";
import { parseKnowledgeBase, type Trecho } from "./knowledge";
import { buildIndex, search } from "./retrieval";
import { SINONIMOS } from "./sinonimos";

// Especificação da recuperação BM25 (H05, ADR-004).
// A busca é lexical e determinística; os sinônimos ligam os nomes que o usuário usa
// ("IBS", "ICMS", "cashback") ao vocabulário da lei ("imposto previsto no art. 156-A").

// Base de exemplo. Os textos são fictícios, só imitam o estilo da lei para testar a busca.
function trecho(id: string, texto: string): Trecho {
  return {
    id,
    norma: "LC 214/2025",
    dispositivo: "art. de exemplo",
    texto,
    url_fonte: "https://www.planalto.gov.br/exemplo",
    data_referencia: "2026-10-14",
  };
}

const exemplo = [
  trecho("fx-cbs", "A CBS será cobrada à alíquota de 0,9% em 2026."),
  trecho(
    "fx-ibs-ec",
    "Em 2026, o imposto previsto no art. 156-A será cobrado à alíquota estadual de 0,1%.",
  ),
  trecho(
    "fx-iss",
    "Ficam extintos, a partir de 2033, os impostos previstos nos arts. 155, II, e 156, III.",
  ),
  trecho(
    "fx-cesta",
    "Ficam reduzidas a zero as alíquotas do IBS e da CBS sobre a Cesta Básica Nacional.",
  ),
  trecho("fx-seletivo", "O Imposto Seletivo incidirá uma única vez sobre o bem."),
];

const ids = (resultados: { trecho: Trecho }[]) => resultados.map((r) => r.trecho.id);

describe("search", () => {
  const indice = buildIndex(exemplo);

  it("devolve primeiro o trecho mais relevante", () => {
    expect(ids(search(indice, "Qual a alíquota da CBS em 2026?"))[0]).toBe("fx-cbs");
  });

  it("ignora maiúsculas, acentos e pontuação da pergunta", () => {
    expect(search(indice, "QUAL A ALIQUOTA DA CBS EM 2026")).toEqual(
      search(indice, "Qual a alíquota da CBS em 2026?"),
    );
  });

  it("devolve no máximo k resultados, 3 por padrão", () => {
    expect(search(indice, "alíquota 2026 CBS IBS imposto").length).toBe(3);
    expect(search(indice, "alíquota 2026 CBS IBS imposto", 1)).toHaveLength(1);
  });

  it("ordena por escore decrescente e só devolve escore positivo", () => {
    const resultados = search(indice, "imposto seletivo CBS 2026", 5);
    const escores = resultados.map((r) => r.score);

    expect(escores.every((s) => s > 0)).toBe(true);
    expect(escores).toEqual([...escores].sort((a, b) => b - a));
  });

  it("devolve lista vazia quando nenhum trecho tem termo da pergunta", () => {
    expect(search(indice, "previdência privada")).toEqual([]);
  });

  it("devolve lista vazia para pergunta vazia ou só com palavras vazias", () => {
    expect(search(indice, "")).toEqual([]);
    expect(search(indice, "o que é a")).toEqual([]);
  });

  it("dá mais peso ao termo raro do que ao termo comum (IDF)", () => {
    // "seletivo" aparece em 1 trecho; "cbs", em 2.
    expect(ids(search(indice, "seletivo cbs"))[0]).toBe("fx-seletivo");
  });

  it("é determinística e desempata pela ordem da base", () => {
    const iguais = [
      trecho("fx-primeiro", "Texto sobre a CBS."),
      trecho("fx-segundo", "Texto sobre a CBS."),
    ];
    const indiceIguais = buildIndex(iguais);

    expect(ids(search(indiceIguais, "CBS"))).toEqual(["fx-primeiro", "fx-segundo"]);
    expect(search(indiceIguais, "CBS")).toEqual(search(indiceIguais, "CBS"));
  });

  it("não altera o texto dos trechos devolvidos", () => {
    const [primeiro] = search(indice, "CBS 2026");
    expect(primeiro?.trecho).toEqual(exemplo[0]);
  });
});

describe("sinônimos", () => {
  const sinonimos = { ibs: ["art. 156-A"], icms: ["155, II"] };

  it("sem sinônimos, o nome do tributo não acha o trecho que usa só o número do artigo", () => {
    expect(ids(search(buildIndex(exemplo), "O que é o IBS?", 5))).not.toContain("fx-ibs-ec");
  });

  it("com sinônimos, o nome do tributo acha o trecho que usa só o número do artigo", () => {
    expect(ids(search(buildIndex(exemplo, { sinonimos }), "O que é o IBS?", 5))).toContain(
      "fx-ibs-ec",
    );
    expect(ids(search(buildIndex(exemplo, { sinonimos }), "Quando o ICMS acaba?", 5))).toContain(
      "fx-iss",
    );
  });

  it("não confunde artigos parecidos: 156-A (IBS) não é 156, III (ISS)", () => {
    expect(ids(search(buildIndex(exemplo, { sinonimos }), "IBS", 5))).not.toContain("fx-iss");
  });

  // Achado por teste de mutação: sem casar palavra inteira, "155 ii" é prefixo de "155 iii".
  it("casa a expressão só como palavra inteira: 155, II (ICMS) não é 155, III", () => {
    const outroInciso = [trecho("fx-155-iii", "Imposto previsto no art. 155, III.")];
    const indice = buildIndex(outroInciso, { sinonimos: { icms: ["155, II"] } });

    expect(search(indice, "ICMS")).toEqual([]);
  });

  it("casa a expressão ignorando acentos, caixa e pontuação", () => {
    const indice = buildIndex(exemplo, { sinonimos: { ibs: ["ART 156 A"] } });
    expect(ids(search(indice, "IBS", 5))).toContain("fx-ibs-ec");
  });
});

// Smoke tests com a base real e o mapa de sinônimos real (src/core/sinonimos.ts).
// Não substituem o conjunto-ouro da H11; garantem que as perguntas mais básicas funcionam.
describe("base real", () => {
  const indice = buildIndex(parseKnowledgeBase(base), { sinonimos: SINONIMOS });

  it.each([
    ["O que é o split payment?", "lc214-art31"],
    ["O que é o Imposto Seletivo?", "lc214-art409"],
    ["Quem tem direito ao cashback?", "lc214-art112"],
    ["Quando o ICMS e o ISS deixam de existir?", "ec132-adct129"],
    ["Como fica o MEI na reforma?", "lc214-art41-p1-p3"],
  ])("“%s” traz %s entre os 3 primeiros", (pergunta, esperado) => {
    expect(ids(search(indice, pergunta))).toContain(esperado);
  });
});
