import { screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { renderComRoteador } from "@/test/roteador";

import { SiteLayout } from "./SiteLayout";

// Layout comum (prompt 01): pular para o conteúdo, navegação com página atual e rodapé com aviso.
describe("SiteLayout", () => {
  const montar = (caminho = "/") =>
    renderComRoteador(
      <SiteLayout>
        <p>conteúdo da página</p>
      </SiteLayout>,
      caminho,
    );

  it("mostra a marca Inciso no cabeçalho, com link para a página inicial", async () => {
    await montar("/simulador");
    const marca = screen.getByRole("img", { name: "Inciso" });
    expect(marca.closest("a")).toHaveAttribute("href", "/");
  });

  it("tem link para pular direto ao conteúdo principal", async () => {
    await montar();
    const pular = screen.getByRole("link", { name: /pular para o conteúdo/i });
    const destino = pular.getAttribute("href")?.replace("#", "") ?? "";

    expect(screen.getByRole("main")).toHaveAttribute("id", destino);
    expect(within(screen.getByRole("main")).getByText("conteúdo da página")).toBeInTheDocument();
  });

  it("navega entre Início e Simulador e marca a página atual", async () => {
    await montar("/simulador");
    const nav = screen.getByRole("navigation", { name: /principal/i });

    expect(within(nav).getByRole("link", { name: "Início" })).toHaveAttribute("href", "/");
    const simulador = within(nav).getByRole("link", { name: "Simulador" });
    expect(simulador).toHaveAttribute("href", "/simulador");
    expect(simulador).toHaveAttribute("aria-current", "page");
  });

  it("aponta para o código no GitHub em nova aba, com noopener", async () => {
    await montar();
    const codigo = screen.getByRole("link", { name: /código/i });

    expect(codigo.getAttribute("href")).toContain("github.com");
    expect(codigo).toHaveAttribute("target", "_blank");
    expect(codigo.getAttribute("rel")).toContain("noopener");
  });

  it("tem botão de tema e rodapé com o aviso de que não substitui um profissional", async () => {
    await montar();
    expect(screen.getByRole("button", { name: /ativar tema/i })).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toHaveTextContent(/não substitui/i);
  });
});
