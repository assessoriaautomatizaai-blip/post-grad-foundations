import { describe, expect, it, vi } from "vitest";

import type { Resposta } from "@/core/answer";

import type { Agente } from "./agente";
import * as fx from "./fixtures/evolution";
import { createDeduplicador, createWebhookHandler, MENSAGEM_PERGUNTA_LONGA } from "./webhook";

// Especificação do webhook da Evolution API (H09, ADR-006). Tudo com fixtures: sem rede,
// sem WhatsApp e sem Gemini. O envio da resposta (H10) entra como função falsa.

const SEGREDO = "segredo-de-teste-com-tamanho-razoavel";
const RESPOSTA: Resposta = { tipo: "resposta", texto: "Resposta do agente.", fontes: [] };

function montar(opcoes: { segredo?: string | undefined } = {}) {
  const agente = { perguntar: vi.fn<Agente["perguntar"]>(async () => RESPOSTA) };
  const enviar = vi.fn(async (_para: string, _texto: string) => {});
  const registrarErro = vi.fn();
  const handler = createWebhookHandler({
    segredo: "segredo" in opcoes ? opcoes.segredo : SEGREDO,
    agente,
    enviar,
    registrarErro,
    deduplicador: createDeduplicador({ agora: () => fx.AGORA_MS }),
    agora: () => fx.AGORA_MS,
  });
  return { handler, agente, enviar, registrarErro };
}

function requisicao(corpo: unknown, segredo: string | null = SEGREDO): Request {
  const headers = new Headers({ "content-type": "application/json" });
  if (segredo !== null) headers.set("x-webhook-secret", segredo);
  return new Request("https://exemplo.lovable.app/api/whatsapp/webhook", {
    method: "POST",
    headers,
    body: typeof corpo === "string" ? corpo : JSON.stringify(corpo),
  });
}

describe("webhook — autenticação", () => {
  it("recusa com 401 a chamada sem o segredo, sem processar nada", async () => {
    const { handler, agente } = montar();
    const resposta = await handler(requisicao(fx.textoSimples, null));

    expect(resposta.status).toBe(401);
    expect(agente.perguntar).not.toHaveBeenCalled();
  });

  it("recusa com 401 a chamada com segredo errado", async () => {
    const { handler, agente } = montar();
    expect((await handler(requisicao(fx.textoSimples, "segredo-errado"))).status).toBe(401);
    expect(agente.perguntar).not.toHaveBeenCalled();
  });

  it.each([undefined, ""])(
    "recusa tudo com 503 quando o segredo não está configurado no servidor (%o)",
    async (segredo) => {
      const { handler, agente } = montar({ segredo });
      expect((await handler(requisicao(fx.textoSimples, ""))).status).toBe(503);
      expect(agente.perguntar).not.toHaveBeenCalled();
    },
  );

  it("confere o segredo antes de ler o corpo: corpo inválido sem segredo dá 401, não 400", async () => {
    const { handler } = montar();
    expect((await handler(requisicao("{ não é json", null))).status).toBe(401);
  });
});

describe("webhook — mensagens que respondem", () => {
  it("responde a texto simples: pergunta ao agente e envia a resposta para quem perguntou", async () => {
    const { handler, agente, enviar } = montar();
    const resposta = await handler(requisicao(fx.textoSimples));

    expect(resposta.status).toBe(200);
    expect(agente.perguntar).toHaveBeenCalledWith("O que é o split payment?");
    expect(enviar).toHaveBeenCalledWith("5565911111111@s.whatsapp.net", "Resposta do agente.");
  });

  it("responde a texto estendido (mensagem com link, citação ou formatação)", async () => {
    const { handler, agente } = montar();
    await handler(requisicao(fx.textoEstendido));
    expect(agente.perguntar).toHaveBeenCalledWith("Quem tem direito ao cashback?");
  });

  it("responde a conversa individual no endereçamento novo do WhatsApp (@lid)", async () => {
    const { handler, enviar } = montar();
    await handler(requisicao(fx.textoLid));
    expect(enviar).toHaveBeenCalledWith("123456789012345@lid", "Resposta do agente.");
  });

  it("responde à pergunta longa demais com aviso fixo, sem chamar o agente", async () => {
    const { handler, agente, enviar } = montar();
    await handler(requisicao(fx.textoLongo));

    expect(agente.perguntar).not.toHaveBeenCalled();
    expect(enviar).toHaveBeenCalledWith("5565911111111@s.whatsapp.net", MENSAGEM_PERGUNTA_LONGA);
  });
});

describe("webhook — eventos ignorados (200, sem resposta)", () => {
  it.each([
    ["mensagem enviada pelo próprio agente (evita loop)", fx.enviadaPeloAgente],
    ["mensagem de grupo", fx.deGrupo],
    ["atualização de status", fx.deStatus],
    ["imagem sem texto", fx.imagemSemTexto],
    ["texto vazio", fx.textoVazio],
    ["mensagem antiga (reenvio após reconexão)", fx.textoAntigo],
    ["evento que não é mensagem", fx.conexao],
  ])("ignora %s", async (_, payload) => {
    const { handler, agente, enviar } = montar();
    const resposta = await handler(requisicao(payload));

    expect(resposta.status).toBe(200);
    expect(agente.perguntar).not.toHaveBeenCalled();
    expect(enviar).not.toHaveBeenCalled();
  });

  it("devolve 400 para corpo que não é JSON (com o segredo certo)", async () => {
    const { handler } = montar();
    expect((await handler(requisicao("{ não é json"))).status).toBe(400);
  });

  it("devolve 400 para JSON fora do formato da Evolution", async () => {
    const { handler, agente } = montar();
    expect((await handler(requisicao({ qualquer: "coisa" }))).status).toBe(400);
    expect(agente.perguntar).not.toHaveBeenCalled();
  });
});

describe("webhook — duplicatas e falhas", () => {
  it("responde uma única vez à mesma mensagem entregue duas vezes (reenvio da Evolution)", async () => {
    const { handler, agente, enviar } = montar();

    expect((await handler(requisicao(fx.textoSimples))).status).toBe(200);
    expect((await handler(requisicao(fx.textoSimples))).status).toBe(200);
    expect(agente.perguntar).toHaveBeenCalledTimes(1);
    expect(enviar).toHaveBeenCalledTimes(1);
  });

  it("quando o envio falha, devolve 500 e registra o erro, para a Evolution tentar de novo", async () => {
    const { handler, enviar, registrarErro } = montar();
    enviar.mockRejectedValueOnce(new Error("Evolution fora do ar"));

    expect((await handler(requisicao(fx.textoSimples))).status).toBe(500);
    expect(registrarErro).toHaveBeenCalled();
  });

  it("depois de uma falha no envio, a nova tentativa da mesma mensagem é processada", async () => {
    const { handler, enviar } = montar();
    enviar.mockRejectedValueOnce(new Error("Evolution fora do ar"));

    await handler(requisicao(fx.textoSimples));
    expect((await handler(requisicao(fx.textoSimples))).status).toBe(200);
    expect(enviar).toHaveBeenCalledTimes(2);
  });

  it("não devolve o número nem o texto da mensagem no corpo da resposta HTTP", async () => {
    const { handler } = montar();
    const corpo = await (await handler(requisicao(fx.textoSimples))).text();

    expect(corpo).not.toContain("5565911111111");
    expect(corpo).not.toContain("split payment");
  });
});

describe("createDeduplicador", () => {
  it("lembra o id marcado e esquece depois do prazo", () => {
    let agora = 0;
    const dedup = createDeduplicador({ agora: () => agora, prazoMs: 1000 });

    expect(dedup.marcar("id-1")).toBe(true);
    expect(dedup.marcar("id-1")).toBe(false);
    agora = 1001;
    expect(dedup.marcar("id-1")).toBe(true);
  });

  it("permite desmarcar, para reprocessar após falha", () => {
    const dedup = createDeduplicador({ agora: () => 0 });
    dedup.marcar("id-1");
    dedup.desmarcar("id-1");
    expect(dedup.marcar("id-1")).toBe(true);
  });

  it("guarda no máximo `capacidade` ids, esquecendo os mais antigos", () => {
    const dedup = createDeduplicador({ agora: () => 0, capacidade: 2 });
    dedup.marcar("a");
    dedup.marcar("b");
    dedup.marcar("c");

    expect(dedup.marcar("a")).toBe(true);
    expect(dedup.marcar("c")).toBe(false);
  });
});
