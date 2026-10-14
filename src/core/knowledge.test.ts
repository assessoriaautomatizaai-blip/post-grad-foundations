import { describe, expect, it } from "vitest";

import base from "../../knowledge/base.json";
import { parseKnowledgeBase } from "./knowledge";

// Especificação do formato da base de conhecimento (H03, ADR-005).
// Cada trecho é um dispositivo legal com fonte oficial e data de referência;
// a base inválida precisa falhar no carregamento, nunca em produção.

// Trecho de exemplo. O texto e a URL são fictícios: servem só para testar o formato.
function trechoValido(sobrescrever: Record<string, unknown> = {}) {
  return {
    id: "lc214-art1",
    norma: "LC 214/2025",
    dispositivo: "art. 1º",
    texto: "Texto de exemplo do dispositivo, usado apenas em teste.",
    url_fonte: "https://www.planalto.gov.br/exemplo",
    data_referencia: "2026-10-14",
    ...sobrescrever,
  };
}

describe("parseKnowledgeBase", () => {
  it("aceita uma base válida e devolve os trechos tipados", () => {
    const trechos = parseKnowledgeBase([
      trechoValido(),
      trechoValido({ id: "ec132-art1", norma: "EC 132/2023" }),
    ]);

    expect(trechos).toHaveLength(2);
    expect(trechos[0]).toEqual(trechoValido());
    expect(trechos[1]?.norma).toBe("EC 132/2023");
  });

  it("aceita base vazia", () => {
    expect(parseKnowledgeBase([])).toEqual([]);
  });

  it("rejeita o que não for uma lista de trechos", () => {
    expect(() => parseKnowledgeBase({ trechos: [] })).toThrow();
    expect(() => parseKnowledgeBase(null)).toThrow();
  });

  it.each(["id", "norma", "dispositivo", "texto", "url_fonte", "data_referencia"])(
    "rejeita trecho sem o campo obrigatório %s",
    (campo) => {
      const trecho: Record<string, unknown> = trechoValido();
      delete trecho[campo];

      expect(() => parseKnowledgeBase([trecho])).toThrow(`campo "${campo}"`);
    },
  );

  it("rejeita texto e dispositivo vazios ou só com espaços", () => {
    expect(() => parseKnowledgeBase([trechoValido({ texto: "   " })])).toThrow("texto");
    expect(() => parseKnowledgeBase([trechoValido({ dispositivo: "" })])).toThrow("dispositivo");
  });

  it("aceita só as normas do recorte (EC 132/2023 e LC 214/2025)", () => {
    expect(() => parseKnowledgeBase([trechoValido({ norma: "Lei 9.999/2099" })])).toThrow("norma");
  });

  it("exige id estável em minúsculas, números e hífen", () => {
    expect(() => parseKnowledgeBase([trechoValido({ id: "LC214 Art 1" })])).toThrow('campo "id"');
    expect(() => parseKnowledgeBase([trechoValido({ id: "lc214-art-1º" })])).toThrow('campo "id"');
  });

  it("exige fonte oficial do Planalto, em https", () => {
    const fontesInvalidas = [
      "http://www.planalto.gov.br/exemplo",
      "https://www.blogtributario.com.br/lc214",
      "https://planalto.gov.br.site-falso.com/exemplo",
      "não é uma URL",
    ];
    for (const url_fonte of fontesInvalidas) {
      expect(() => parseKnowledgeBase([trechoValido({ url_fonte })])).toThrow("url_fonte");
    }

    expect(() =>
      parseKnowledgeBase([trechoValido({ url_fonte: "https://planalto.gov.br/exemplo" })]),
    ).not.toThrow();
  });

  it("exige data de referência válida no formato AAAA-MM-DD", () => {
    for (const data_referencia of ["14/10/2026", "2026-13-01", "2026-02-30", "ontem"]) {
      expect(() => parseKnowledgeBase([trechoValido({ data_referencia })])).toThrow(
        "data_referencia",
      );
    }
  });

  it("rejeita campo desconhecido, para pegar erro de digitação", () => {
    expect(() => parseKnowledgeBase([trechoValido({ url_fontes: "https://x" })])).toThrow(
      "url_fontes",
    );
  });

  it("rejeita id duplicado, informando qual é", () => {
    expect(() =>
      parseKnowledgeBase([trechoValido(), trechoValido({ dispositivo: "art. 2º" })]),
    ).toThrow("lc214-art1");
  });

  it("indica a posição do trecho inválido na mensagem de erro", () => {
    expect(() =>
      parseKnowledgeBase([trechoValido(), trechoValido({ id: "ec132-art1", texto: "" })]),
    ).toThrow(/\b1\b/);
  });
});

describe("base de conhecimento versionada (knowledge/base.json)", () => {
  it("carrega sem erro", () => {
    expect(() => parseKnowledgeBase(base)).not.toThrow();
  });
});
