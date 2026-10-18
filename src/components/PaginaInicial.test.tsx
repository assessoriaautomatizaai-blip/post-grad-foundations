import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import base from "../../knowledge/base.json";
import { renderComRoteador } from "@/test/roteador";

import { PaginaInicial } from "./PaginaInicial";

// Página inicial (prompt 01): proposta de valor, como funciona e resultados medidos, com fonte.
describe("PaginaInicial", () => {
  it("tem um único título principal", async () => {
    await renderComRoteador(<PaginaInicial />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
  });

  it("leva ao simulador como ação principal", async () => {
    await renderComRoteador(<PaginaInicial />);
    expect(screen.getAllByRole("link", { name: /simulador/i })[0]).toHaveAttribute(
      "href",
      "/simulador",
    );
  });

  it("explica como funciona e o que fica fora do escopo", async () => {
    await renderComRoteador(<PaginaInicial />);
    expect(screen.getByRole("heading", { name: /como funciona/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /não responde/i })).toBeInTheDocument();
  });

  it("mostra resultados medidos com data e link para o relatório", async () => {
    await renderComRoteador(<PaginaInicial />);
    const relatorio = screen.getByRole("link", { name: /relatório/i });

    expect(relatorio.getAttribute("href")).toContain("eval/relatorio.md");
    expect(screen.getByText(/15\/10\/2026/)).toBeInTheDocument();
  });
});

// Identidade autoral (prompt 03): a página mostra a lei de verdade, não um chat de mentira.
describe("PaginaInicial — lei comentada", () => {
  it("o trecho de lei do topo é o texto literal da base, com o dispositivo e o link oficial", async () => {
    await renderComRoteador(<PaginaInicial />);
    const trecho = base.find((t) => t.id === "lc214-art157");
    if (!trecho) throw new Error("trecho lc214-art157 sumiu da base");

    const figura = screen.getByRole("figure", { name: /trecho da lei/i });
    expect(figura.textContent?.replace(/\s+/g, " ")).toContain(trecho.texto);
    const fonte = within(figura).getByRole("link", { name: /LC 214\/2025, art\. 157/ });
    expect(fonte).toHaveAttribute("href", trecho.url_fonte);
  });

  it("“Como funciona” é uma lista ordenada de 4 passos", async () => {
    await renderComRoteador(<PaginaInicial />);
    const secao = screen.getByRole("heading", { name: /como funciona/i }).closest("section");
    if (!secao) throw new Error("seção não encontrada");

    const passos = within(secao).getByRole("list");
    expect(passos.tagName).toBe("OL");
    expect(within(passos).getAllByRole("listitem")).toHaveLength(4);
  });
});

// Apresentação (prompt 04): o topo demonstra o produto sem trocar de página.
describe("PaginaInicial — demonstração no topo", () => {
  it("a demonstração responde à pergunta citando o mesmo dispositivo do trecho mostrado", async () => {
    await renderComRoteador(<PaginaInicial />);
    const demo = screen.getByRole("complementary", { name: /demonstração/i });

    expect(demo).toHaveTextContent("Ônibus e metrô vão pagar imposto?");
    expect(demo).toHaveTextContent("LC 214/2025, art. 157, caput");
    // Só afirma o que está no trecho literal da base.
    expect(demo).toHaveTextContent(/isento do IBS e da CBS/);
  });
});

// Robustez e nuance (prompt 05): efeitos que nunca escondem nem inventam conteúdo.
describe("PaginaInicial — faixa de dispositivos e números", () => {
  it("a faixa em movimento só mostra dispositivos que existem na base", async () => {
    await renderComRoteador(<PaginaInicial />);
    const faixa = screen.getByRole("list", { name: /dispositivos da base/i });
    const naBase = new Set(base.map((t) => `${t.norma}, ${t.dispositivo}`));
    const itens = within(faixa).getAllByRole("listitem");

    expect(itens.length).toBeGreaterThanOrEqual(8);
    for (const item of itens) expect(naBase).toContain(item.textContent?.trim());
  });

  it("os números das garantias ficam disponíveis com o valor final para leitor de tela", async () => {
    await renderComRoteador(<PaginaInicial />);
    const secao = screen
      .getByRole("heading", { name: /fonte em toda resposta/i })
      .closest("section");
    if (!secao) throw new Error("seção não encontrada");

    for (const valor of ["96", "0", "100%"]) {
      expect(within(secao).getByText(valor, { selector: ".sr-only" })).toBeInTheDocument();
    }
  });
});

// Redesenho com base na referência (prompt 07): a caixa de pergunta do topo abre o Consultor.
describe("PaginaInicial — caixa de pergunta", () => {
  it("a caixa de pergunta do topo leva ao simulador", async () => {
    await renderComRoteador(<PaginaInicial />);
    expect(screen.getByRole("link", { name: /faça sua pergunta/i })).toHaveAttribute(
      "href",
      "/simulador",
    );
  });
});
