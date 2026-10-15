import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MENSAGEM_FALHA, type Resposta } from "@/core/answer";
import type { Trecho } from "@/core/knowledge";

import { Simulador } from "./Simulador";

// Especificação do simulador web (H08): o avaliador conversa com o agente sem WhatsApp.
// O componente recebe a função `perguntar` por parâmetro; aqui ela é falsa.

const split: Trecho = {
  id: "lc214-art31",
  norma: "LC 214/2025",
  dispositivo: "art. 31, caput",
  texto: "Texto do artigo.",
  url_fonte: "https://www.planalto.gov.br/ccivil_03/leis/lcp/lcp214.htm#art31",
  data_referencia: "2026-10-14",
};

const respostaComFonte: Resposta = {
  tipo: "resposta",
  texto:
    "É a separação do tributo no pagamento (LC 214/2025, art. 31, caput).\n\n*Fontes:*\n• LC 214/2025, art. 31, caput\n\n_Resposta informativa._",
  fontes: [split],
};

function montar(perguntar = vi.fn(async (_: string): Promise<Resposta> => respostaComFonte)) {
  render(<Simulador perguntar={perguntar} />);
  const campo = screen.getByLabelText(/sua pergunta/i);
  const botao = screen.getByRole("button", { name: /enviar/i });
  const enviar = (texto: string) => {
    fireEvent.change(campo, { target: { value: texto } });
    fireEvent.click(botao);
  };
  return {
    perguntar,
    campo,
    botao,
    enviar,
    conversa: () => screen.getByRole("log", { name: /conversa/i }),
  };
}

describe("Simulador", () => {
  it("tem campo de pergunta com rótulo e botão de enviar", () => {
    const { campo, botao } = montar();
    expect(campo).toBeInTheDocument();
    expect(botao).toBeInTheDocument();
  });

  it("não deixa enviar pergunta vazia ou só com espaços", () => {
    const { campo, botao } = montar();
    expect(botao).toBeDisabled();
    fireEvent.change(campo, { target: { value: "   " } });
    expect(botao).toBeDisabled();
  });

  it("envia a pergunta sem espaços nas pontas, uma vez, e limpa o campo", async () => {
    const { perguntar, campo, enviar } = montar();
    enviar("  O que é o split payment?  ");

    await screen.findByText(/separação do tributo/);
    expect(perguntar).toHaveBeenCalledTimes(1);
    expect(perguntar).toHaveBeenCalledWith("O que é o split payment?");
    expect(campo).toHaveValue("");
  });

  it("também envia com Enter (envio do formulário)", async () => {
    const { perguntar, campo } = montar();
    fireEvent.change(campo, { target: { value: "O que é o split payment?" } });
    fireEvent.submit(campo.closest("form") as HTMLFormElement);

    await screen.findByText(/separação do tributo/);
    expect(perguntar).toHaveBeenCalledTimes(1);
  });

  it("mostra a pergunta e a resposta no histórico, na ordem", async () => {
    const respostas = ["Primeira resposta.", "Segunda resposta."];
    const perguntar = vi.fn(async (): Promise<Resposta> => ({
      tipo: "resposta",
      texto: respostas.shift() ?? "",
      fontes: [],
    }));
    const { enviar, conversa } = montar(perguntar);

    enviar("Pergunta um?");
    await screen.findByText("Primeira resposta.");
    enviar("Pergunta dois?");
    await screen.findByText("Segunda resposta.");

    const textos = within(conversa())
      .getAllByRole("article")
      .map((mensagem) => mensagem.textContent ?? "");
    expect(textos).toHaveLength(4);
    expect(textos[0]).toContain("Pergunta um?");
    expect(textos[1]).toContain("Primeira resposta.");
    expect(textos[2]).toContain("Pergunta dois?");
    expect(textos[3]).toContain("Segunda resposta.");
  });

  it("indica que está consultando e bloqueia novo envio enquanto espera", async () => {
    let responder: (r: Resposta) => void = () => {};
    const perguntar = vi.fn(() => new Promise<Resposta>((resolve) => (responder = resolve)));
    const { enviar, botao } = montar(perguntar);

    enviar("O que é o split payment?");
    expect(await screen.findByRole("status")).toHaveTextContent(/consultando/i);
    expect(botao).toBeDisabled();

    responder(respostaComFonte);
    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
  });

  it("destaca as fontes citadas como links para o Planalto, em nova aba", async () => {
    const { enviar } = montar();
    enviar("O que é o split payment?");

    const link = await screen.findByRole("link", { name: "LC 214/2025, art. 31, caput" });
    expect(link).toHaveAttribute("href", split.url_fonte);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
  });

  it("mostra *negrito* e _itálico_ do WhatsApp como formatação, sem os símbolos", async () => {
    const { enviar } = montar();
    enviar("O que é o split payment?");

    const negrito = await screen.findByText("Fontes:");
    expect(negrito.tagName).toBe("STRONG");
    expect(screen.getByText("Resposta informativa.").tagName).toBe("EM");
    expect(screen.queryByText(/\*Fontes:\*/)).not.toBeInTheDocument();
  });

  it("mostra HTML vindo da resposta como texto, sem interpretar", async () => {
    const perguntar = vi.fn(async (): Promise<Resposta> => ({
      tipo: "resposta",
      texto: '<img src=x onerror="alert(1)"> texto',
      fontes: [],
    }));
    const { enviar, conversa } = montar(perguntar);
    enviar("pergunta?");

    await screen.findByText(/onerror/);
    expect(conversa().querySelector("img")).toBeNull();
  });

  it("mostra a mensagem de falha quando a chamada ao servidor falha, e continua funcionando", async () => {
    const perguntar = vi
      .fn<(pergunta: string) => Promise<Resposta>>()
      .mockRejectedValueOnce(new Error("rede caiu"))
      .mockResolvedValueOnce(respostaComFonte);
    const { enviar } = montar(perguntar);

    enviar("Primeira?");
    expect(await screen.findByText(MENSAGEM_FALHA)).toBeInTheDocument();
    expect(screen.queryByText(/rede caiu/)).not.toBeInTheDocument();

    enviar("Segunda?");
    expect(await screen.findByText(/separação do tributo/)).toBeInTheDocument();
  });

  it("anuncia novas mensagens para leitores de tela", () => {
    const { conversa } = montar();
    expect(conversa()).toHaveAttribute("aria-live", "polite");
  });
});
