import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { FundoVivo } from "./FundoVivo";

// Fundo da página (prompt 06): manchas de cor, grade de pontos e holofote que segue o mouse.
// É só decoração: não pode ser lido pelo leitor de tela nem atrapalhar o conteúdo, e o
// holofote só existe com mouse e sem "reduzir movimento".

function preferencias({ mouse, reduzir }: { mouse: boolean; reduzir: boolean }) {
  vi.stubGlobal("matchMedia", (consulta: string) => ({
    matches:
      (consulta.includes("pointer: fine") && mouse) ||
      (consulta.includes("prefers-reduced-motion") && reduzir),
    media: consulta,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

describe("FundoVivo", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("é decorativo: fica escondido do leitor de tela", () => {
    preferencias({ mouse: true, reduzir: false });
    render(<FundoVivo />);
    expect(screen.getByTestId("fundo-vivo")).toHaveAttribute("aria-hidden", "true");
  });

  it("com mouse, o holofote acompanha a posição do cursor", async () => {
    preferencias({ mouse: true, reduzir: false });
    render(<FundoVivo />);
    const fundo = screen.getByTestId("fundo-vivo");

    // O jsdom não tem PointerEvent; MouseEvent carrega as mesmas coordenadas.
    fireEvent(window, new MouseEvent("pointermove", { clientX: 120, clientY: 340 }));
    await waitFor(() => expect(fundo.style.getPropertyValue("--mx")).toBe("120px"));
    expect(fundo.style.getPropertyValue("--my")).toBe("340px");
    expect(fundo).toHaveAttribute("data-holofote", "true");
  });

  it("com 'reduzir movimento', o holofote não acompanha o cursor", async () => {
    preferencias({ mouse: true, reduzir: true });
    render(<FundoVivo />);
    const fundo = screen.getByTestId("fundo-vivo");

    // O jsdom não tem PointerEvent; MouseEvent carrega as mesmas coordenadas.
    fireEvent(window, new MouseEvent("pointermove", { clientX: 120, clientY: 340 }));
    await new Promise((resolver) => setTimeout(resolver, 50));
    expect(fundo.style.getPropertyValue("--mx")).toBe("");
    expect(fundo).toHaveAttribute("data-holofote", "false");
  });

  it("em tela de toque, o holofote não aparece", () => {
    preferencias({ mouse: false, reduzir: false });
    render(<FundoVivo />);
    expect(screen.getByTestId("fundo-vivo")).toHaveAttribute("data-holofote", "false");
  });
});
