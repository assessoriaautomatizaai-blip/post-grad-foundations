import { describe, expect, it } from "vitest";

import { dividirMensagem, MAX_CARACTERES_POR_MENSAGEM } from "./whatsapp";

// Especificação da divisão de respostas longas em várias mensagens de WhatsApp (H10).
// O limite é de legibilidade (a tela do celular), não um limite técnico do WhatsApp.

const normalizar = (texto: string) => texto.replace(/\s+/g, " ").trim();

describe("dividirMensagem", () => {
  it("devolve o texto inteiro quando ele cabe numa mensagem", () => {
    expect(dividirMensagem("Resposta curta.", 100)).toEqual(["Resposta curta."]);
  });

  it("devolve lista vazia para texto vazio ou só com espaços", () => {
    expect(dividirMensagem("", 100)).toEqual([]);
    expect(dividirMensagem("  \n\n ", 100)).toEqual([]);
  });

  it("prefere quebrar entre parágrafos", () => {
    const texto = `${"a".repeat(40)}\n\n${"b".repeat(40)}`;
    expect(dividirMensagem(texto, 60)).toEqual(["a".repeat(40), "b".repeat(40)]);
  });

  it("junta parágrafos curtos na mesma mensagem quando cabem", () => {
    const texto = "Primeiro.\n\nSegundo.\n\nTerceiro.";
    expect(dividirMensagem(texto, 100)).toEqual([texto]);
  });

  it("nenhuma parte passa do limite", () => {
    const texto = Array.from({ length: 30 }, (_, i) => `Frase número ${i} da resposta.`).join(" ");
    for (const parte of dividirMensagem(texto, 80)) expect(parte.length).toBeLessThanOrEqual(80);
  });

  it("não corta palavras ao meio quando há espaço para quebrar", () => {
    const palavras = Array.from({ length: 40 }, (_, i) => `palavra${i}`);
    const partes = dividirMensagem(palavras.join(" "), 50);

    for (const parte of partes) {
      for (const pedaco of parte.split(" ")) expect(palavras).toContain(pedaco);
    }
  });

  it("corta mesmo assim uma palavra maior que o limite (ex.: um link enorme)", () => {
    const partes = dividirMensagem("x".repeat(250), 100);
    expect(partes).toEqual(["x".repeat(100), "x".repeat(100), "x".repeat(50)]);
  });

  it("não perde nem repete conteúdo", () => {
    const texto = `Introdução da resposta.\n\n${"Detalhe importante. ".repeat(20)}\n\n*Fontes:*\n• LC 214/2025, art. 31\n\n_Aviso._`;
    expect(normalizar(dividirMensagem(texto, 120).join(" "))).toBe(normalizar(texto));
  });

  it("usa por padrão um limite de leitura confortável no celular", () => {
    expect(MAX_CARACTERES_POR_MENSAGEM).toBeGreaterThanOrEqual(1000);
    expect(MAX_CARACTERES_POR_MENSAGEM).toBeLessThanOrEqual(4096);
  });
});
