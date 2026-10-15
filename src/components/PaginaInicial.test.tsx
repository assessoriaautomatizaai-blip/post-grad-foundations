import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

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
