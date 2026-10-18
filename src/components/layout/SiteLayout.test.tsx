import { fireEvent, screen, within } from "@testing-library/react";
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

  // Pedido do autor (18/10/2026): o menu tem só as páginas do site; o link do código saiu.
  it("o menu principal tem só Início e Simulador", async () => {
    await montar();
    const nav = screen.getByRole("navigation", { name: "Principal" });
    const nomes = within(nav)
      .getAllByRole("link")
      .map((link) => link.textContent?.trim());

    expect(nomes).toEqual(["Início", "Simulador"]);
  });

  it("tem botão de tema e rodapé com o aviso de que não substitui um profissional", async () => {
    await montar();
    expect(screen.getByRole("button", { name: /ativar tema/i })).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toHaveTextContent(/não substitui/i);
  });

  it("o cabeçalho marca quando a página rolou, para ganhar contorno", async () => {
    await montar();
    const cabecalho = screen.getByRole("banner");
    expect(cabecalho).toHaveAttribute("data-rolado", "false");

    Object.defineProperty(window, "scrollY", { value: 120, configurable: true });
    fireEvent.scroll(window);
    expect(cabecalho).toHaveAttribute("data-rolado", "true");

    Object.defineProperty(window, "scrollY", { value: 0, configurable: true });
    fireEvent.scroll(window);
    expect(cabecalho).toHaveAttribute("data-rolado", "false");
  });
});
