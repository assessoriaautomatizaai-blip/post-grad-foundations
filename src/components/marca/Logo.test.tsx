import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LogoAssinatura, LogoSimbolo } from "./Logo";

// Marca Inciso (docs/marca): o traço do I sai sempre em azul-caneta e o restante na cor do
// texto. As cores vêm de variáveis do tema, para a mesma marca funcionar no claro e no escuro.
describe("LogoAssinatura", () => {
  it("é uma imagem com o nome da marca", () => {
    render(<LogoAssinatura />);
    expect(screen.getByRole("img", { name: "Inciso" })).toBeInTheDocument();
  });

  it("pinta o traço do I com a cor de marca e as letras com a cor do texto", () => {
    render(<LogoAssinatura />);
    const svg = screen.getByRole("img", { name: "Inciso" });

    expect(svg.querySelector("[data-parte='traco']")).toHaveAttribute(
      "stroke",
      "var(--marca-traco)",
    );
    expect(svg.querySelector("[data-parte='letras']")).toHaveAttribute("stroke", "currentColor");
  });

  it("mantém a proporção do desenho original (199 × 68)", () => {
    render(<LogoAssinatura />);
    expect(screen.getByRole("img", { name: "Inciso" })).toHaveAttribute("viewBox", "0 0 199 68");
  });
});

describe("LogoSimbolo", () => {
  it("é uma imagem com o nome da marca, com traço e travessão separados", () => {
    render(<LogoSimbolo />);
    const svg = screen.getByRole("img", { name: "Inciso" });

    expect(svg.querySelector("[data-parte='traco']")).toHaveAttribute("fill", "var(--marca-traco)");
    expect(svg.querySelector("[data-parte='travessao']")).toHaveAttribute("fill", "currentColor");
  });

  it("pode ser decorativo, quando o nome já aparece ao lado", () => {
    const { container } = render(<LogoSimbolo decorativo />);
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});
