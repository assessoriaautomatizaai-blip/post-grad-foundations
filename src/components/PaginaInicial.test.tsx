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
