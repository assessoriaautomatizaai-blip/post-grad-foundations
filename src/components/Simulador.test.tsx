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
  fontesWeb: [],
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
      fontesWeb: [],
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

  it("mostra as fontes da web como links à parte, identificados como não conferidos", async () => {
    const fonteWeb = {
      titulo: "Receita Federal — Reforma",
      url: "https://www.gov.br/receitafederal/x",
    };
    const { enviar } = montar(
      vi.fn(async (): Promise<Resposta> => ({ ...respostaComFonte, fontesWeb: [fonteWeb] })),
    );
    enviar("O que muda nas notas fiscais?");

    const lista = await screen.findByRole("list", { name: /fontes da web/i });
    const link = within(lista).getByRole("link", { name: /Receita Federal — Reforma/ });
    expect(link).toHaveAttribute("href", fonteWeb.url);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link.getAttribute("rel")).toContain("noopener");
    expect(lista).toHaveTextContent(/não conferid/i);
    // As fontes da lei continuam numa lista própria, separada da web.
    expect(screen.getByRole("list", { name: /fontes da lei/i })).not.toBe(lista);
  });

  it("não mostra endereços crus no balão: as fontes aparecem só como links com nome", async () => {
    const redirecionamento =
      "https://vertexaisearch.cloud.google.com/grounding-api-redirect/AUZIYQEghG4H3gRcfwS6OWl4OjOwHs7pz_32amddUoj116k7ri33T7uT6";
    const { enviar, conversa } = montar(
      vi.fn(async (): Promise<Resposta> => ({
        tipo: "resposta",
        texto: `Resposta (LC 214/2025, art. 31, caput).\n\n*Fontes da lei:*\n• LC 214/2025, art. 31, caput: ${split.url_fonte}\n\n*Outras fontes (não conferidas):*\n• senado.leg.br: ${redirecionamento}\n\n_Aviso._`,
        corpo: "Resposta (LC 214/2025, art. 31, caput).\n\n_Aviso._",
        fontes: [split],
        fontesWeb: [{ titulo: "senado.leg.br", url: redirecionamento }],
      })),
    );
    enviar("O que é o split payment?");

    const link = await screen.findByRole("link", { name: /senado\.leg\.br/ });
    expect(link).toHaveAttribute("href", redirecionamento);
    const balao = within(conversa()).getAllByRole("article")[1] as HTMLElement;
    for (const paragrafo of balao.querySelectorAll("span")) {
      expect(paragrafo.textContent).not.toContain("https://");
    }
  });

  it("numera as fontes da web com o mesmo nome, para cada link ter um nome único", async () => {
    const { enviar } = montar(
      vi.fn(async (): Promise<Resposta> => ({
        ...respostaComFonte,
        fontesWeb: [
          { titulo: "senado.leg.br", url: "https://exemplo.gov.br/a" },
          { titulo: "senado.leg.br", url: "https://exemplo.gov.br/b" },
        ],
      })),
    );
    enviar("Pergunta?");

    const lista = await screen.findByRole("list", { name: /fontes da web/i });
    const nomes = within(lista)
      .getAllByRole("link")
      .map((link) => link.textContent);
    expect(nomes).toEqual(["senado.leg.br", "senado.leg.br (2)"]);
  });

  it("o balão quebra palavras longas, para nada estourar a largura da página", async () => {
    const { enviar, conversa } = montar();
    enviar("O que é o split payment?");

    await screen.findByRole("link", { name: "LC 214/2025, art. 31, caput" });
    const balao = within(conversa()).getAllByRole("article")[1] as HTMLElement;
    expect(balao.className).toMatch(/overflow-wrap:anywhere|break-words/);
  });

  it.each([
    ["fora_do_tema", /fora do tema/i],
    ["sem_fonte", /sem fonte/i],
  ] as const)("identifica a resposta do tipo %s com um selo próprio", async (tipo, selo) => {
    const { enviar } = montar(
      vi.fn(async (): Promise<Resposta> => ({
        tipo,
        texto: "Mensagem fixa.",
        fontes: [],
        fontesWeb: [],
      })),
    );
    enviar("Qual a previsão do tempo?");

    expect(
      await within(screen.getByRole("log", { name: /conversa/i })).findByText(selo),
    ).toBeInTheDocument();
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
      fontesWeb: [],
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

// Frontend profissional (prompt 01): estado vazio, contador e nova conversa.
describe("Simulador — estado vazio, contador e nova conversa", () => {
  it("sem mensagens, mostra perguntas de exemplo que enviam a própria pergunta ao clicar", async () => {
    const { perguntar } = montar();
    const exemplos = screen.getAllByRole("button", { name: /\?$/ });
    expect(exemplos.length).toBeGreaterThanOrEqual(3);

    const escolhido = exemplos[0] as HTMLButtonElement;
    fireEvent.click(escolhido);

    await screen.findByText(/separação do tributo/);
    expect(perguntar).toHaveBeenCalledWith(escolhido.textContent);
  });

  it("esconde as perguntas de exemplo depois que a conversa começa", async () => {
    const { enviar } = montar();
    enviar("O que é o split payment?");
    await screen.findByText(/separação do tributo/);

    expect(screen.queryAllByRole("button", { name: /\?$/ })).toHaveLength(0);
  });

  it("mostra quantos caracteres foram usados do limite, ligado ao campo", () => {
    const { campo } = montar();
    const contador = document.getElementById(campo.getAttribute("aria-describedby") ?? "");

    expect(contador).toHaveTextContent("0/500");
    fireEvent.change(campo, { target: { value: "Olá IBS" } });
    expect(contador).toHaveTextContent("7/500");
  });

  it("só oferece 'Nova conversa' quando há mensagens, e ela limpa o histórico", async () => {
    const { enviar, conversa } = montar();
    expect(screen.queryByRole("button", { name: /nova conversa/i })).not.toBeInTheDocument();

    enviar("O que é o split payment?");
    await screen.findByText(/separação do tributo/);
    fireEvent.click(screen.getByRole("button", { name: /nova conversa/i }));

    expect(within(conversa()).queryAllByRole("article")).toHaveLength(0);
    expect(screen.getAllByRole("button", { name: /\?$/ }).length).toBeGreaterThanOrEqual(3);
  });
});

// Visual de conversa de mensageiro (pedido do autor): hora, tiques de leitura e status.
describe("Simulador — estilo de conversa de mensageiro", () => {
  it("mostra a hora de cada mensagem", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 9, 15, 14, 7));
    try {
      const { enviar, conversa } = montar();
      enviar("O que é o split payment?");
      await screen.findByText(/separação do tributo/);

      for (const mensagem of within(conversa()).getAllByRole("article")) {
        expect(within(mensagem).getByText("14:07").tagName).toBe("TIME");
      }
    } finally {
      vi.useRealTimers();
    }
  });

  it("a pergunta fica como enviada e vira lida quando a resposta chega", async () => {
    let responder: (resposta: Resposta) => void = () => {};
    const { enviar, conversa } = montar(
      vi.fn(() => new Promise<Resposta>((resolve) => (responder = resolve))),
    );
    enviar("O que é o split payment?");

    const pergunta = within(conversa()).getAllByRole("article")[0] as HTMLElement;
    expect(within(pergunta).getByLabelText("Enviada")).toBeInTheDocument();
    responder(respostaComFonte);
    expect(await within(pergunta).findByLabelText("Lida")).toBeInTheDocument();
  });

  it("o cabeçalho mostra 'online' e 'digitando…' enquanto o agente responde", async () => {
    let responder: (resposta: Resposta) => void = () => {};
    const { enviar } = montar(
      vi.fn(() => new Promise<Resposta>((resolve) => (responder = resolve))),
    );
    expect(screen.getByText("online")).toBeInTheDocument();

    enviar("O que é o split payment?");
    expect(await screen.findByText("digitando…")).toBeInTheDocument();
    responder(respostaComFonte);
    expect(await screen.findByText("online")).toBeInTheDocument();
  });
});
