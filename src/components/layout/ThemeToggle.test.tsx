import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SCRIPT_TEMA } from "@/lib/tema";

import { ThemeToggle } from "./ThemeToggle";

// Tema claro/escuro (prompt 01): segue o sistema na primeira visita, alterna por botão,
// guarda a escolha e não pisca o tema errado no carregamento.

const html = document.documentElement;

beforeEach(() => {
  html.classList.remove("dark");
  localStorage.clear();
});
afterEach(() => vi.restoreAllMocks());

describe("ThemeToggle", () => {
  it("no tema claro, oferece ativar o escuro; ao clicar, ativa e guarda a escolha", () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: /ativar tema escuro/i }));

    expect(html).toHaveClass("dark");
    expect(localStorage.getItem("tema")).toBe("escuro");
    expect(screen.getByRole("button", { name: /ativar tema claro/i })).toBeInTheDocument();
  });

  it("começa refletindo o tema já aplicado no carregamento", () => {
    html.classList.add("dark");
    render(<ThemeToggle />);
    expect(screen.getByRole("button", { name: /ativar tema claro/i })).toBeInTheDocument();
  });

  it("volta ao claro e guarda essa escolha", () => {
    html.classList.add("dark");
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole("button", { name: /ativar tema claro/i }));

    expect(html).not.toHaveClass("dark");
    expect(localStorage.getItem("tema")).toBe("claro");
  });
});

describe("SCRIPT_TEMA (roda no <head>, antes do primeiro paint)", () => {
  const executar = () => new Function(SCRIPT_TEMA)();
  const sistemaEscuro = (escuro: boolean) =>
    vi.spyOn(window, "matchMedia").mockReturnValue({ matches: escuro } as MediaQueryList);

  it("usa a escolha guardada, acima da preferência do sistema", () => {
    sistemaEscuro(false);
    localStorage.setItem("tema", "escuro");
    executar();
    expect(html).toHaveClass("dark");
  });

  it("sem escolha guardada, segue o sistema", () => {
    sistemaEscuro(true);
    executar();
    expect(html).toHaveClass("dark");
  });

  it("não quebra a página se o armazenamento local estiver bloqueado", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("bloqueado");
    });
    expect(executar).not.toThrow();
  });
});
