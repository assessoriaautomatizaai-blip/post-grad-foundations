import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useRevelar } from "./useRevelar";

// Especificação da revelação ao rolar (prompt 03). O efeito é só enfeite: o conteúdo
// nunca pode depender dele. Sem IntersectionObserver (navegador antigo, teste, leitor de
// tela) ou com "reduzir movimento", tudo aparece de imediato.

function Bloco() {
  const [ref, visivel] = useRevelar<HTMLDivElement>();
  return (
    <div ref={ref} data-testid="bloco" data-visivel={visivel}>
      Conteúdo
    </div>
  );
}

type Callback = (entradas: { isIntersecting: boolean }[]) => void;

function instalarObservador() {
  const instancias: { callback: Callback; disconnect: ReturnType<typeof vi.fn> }[] = [];
  class ObservadorFalso {
    disconnect = vi.fn();
    observe = vi.fn();
    unobserve = vi.fn();
    constructor(callback: Callback) {
      instancias.push({ callback, disconnect: this.disconnect });
    }
  }
  vi.stubGlobal("IntersectionObserver", ObservadorFalso);
  return instancias;
}

function movimentoReduzido(reduzir: boolean) {
  vi.stubGlobal("matchMedia", (consulta: string) => ({
    matches: reduzir && consulta.includes("prefers-reduced-motion"),
    media: consulta,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

describe("useRevelar", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sem IntersectionObserver, o conteúdo já nasce visível", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    render(<Bloco />);
    expect(screen.getByTestId("bloco")).toHaveAttribute("data-visivel", "true");
  });

  it("com movimento reduzido, o conteúdo nasce visível e nada é observado", () => {
    const instancias = instalarObservador();
    movimentoReduzido(true);
    render(<Bloco />);

    expect(screen.getByTestId("bloco")).toHaveAttribute("data-visivel", "true");
    expect(instancias).toHaveLength(0);
  });

  it("começa escondido e aparece quando entra na tela, uma vez só", () => {
    const instancias = instalarObservador();
    movimentoReduzido(false);
    render(<Bloco />);
    const bloco = screen.getByTestId("bloco");

    expect(bloco).toHaveAttribute("data-visivel", "false");
    act(() => instancias[0]?.callback([{ isIntersecting: true }]));
    expect(bloco).toHaveAttribute("data-visivel", "true");
    expect(instancias[0]?.disconnect).toHaveBeenCalled();
  });

  it("não aparece enquanto o elemento não entra na tela", () => {
    const instancias = instalarObservador();
    movimentoReduzido(false);
    render(<Bloco />);

    act(() => instancias[0]?.callback([{ isIntersecting: false }]));
    expect(screen.getByTestId("bloco")).toHaveAttribute("data-visivel", "false");
  });
});
