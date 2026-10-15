import { z } from "zod";

import { MAX_PERGUNTA } from "@/core/pergunta";

import type { Agente } from "./agente";

export const MENSAGEM_PERGUNTA_LONGA = `Sua pergunta passou de ${MAX_PERGUNTA} caracteres. Envie uma dúvida mais curta, uma de cada vez.`;

// Mensagens mais antigas que isto são reenvios (ex.: depois de uma reconexão) e não são respondidas.
const IDADE_MAXIMA_MS = 5 * 60 * 1000;

// Só conversa individual: "@s.whatsapp.net" (número) ou "@lid" (endereçamento novo do WhatsApp).
// Grupos ("@g.us"), status ("status@broadcast") e canais ficam de fora.
const CONVERSA_INDIVIDUAL = /@(s\.whatsapp\.net|lid)$/;

// Formato montado pelo webhook.controller.ts da Evolution API v2 (ver fixtures/evolution.ts).
const eventoSchema = z.object({ event: z.string(), data: z.unknown() });

const mensagemSchema = z.object({
  key: z.object({ remoteJid: z.string(), fromMe: z.boolean(), id: z.string() }),
  message: z
    .object({
      conversation: z.string().nullish(),
      extendedTextMessage: z.object({ text: z.string().nullish() }).nullish(),
    })
    .nullish(),
  messageTimestamp: z.unknown().optional(),
});

/** Guarda os ids de mensagem já processados, para responder uma vez só a cada uma. */
export interface Deduplicador {
  /** Marca o id; devolve `false` se ele já estava marcado e ainda no prazo. */
  marcar(id: string): boolean;
  desmarcar(id: string): void;
}

/**
 * Deduplicador em memória, com prazo e capacidade limitados. Em hospedagem com várias
 * instâncias do servidor, cada uma tem a sua memória: uma duplicata rara ainda pode passar.
 */
export function createDeduplicador(
  opcoes: { agora?: () => number; prazoMs?: number; capacidade?: number } = {},
): Deduplicador {
  const { agora = Date.now, prazoMs = 10 * 60 * 1000, capacidade = 5000 } = opcoes;
  const expiraEm = new Map<string, number>();
  return {
    marcar(id) {
      const expiracao = expiraEm.get(id);
      if (expiracao !== undefined && expiracao > agora()) return false;
      expiraEm.delete(id);
      expiraEm.set(id, agora() + prazoMs);
      while (expiraEm.size > capacidade) {
        const maisAntigo = expiraEm.keys().next().value;
        if (maisAntigo === undefined) break;
        expiraEm.delete(maisAntigo);
      }
      return true;
    },
    desmarcar(id) {
      expiraEm.delete(id);
    },
  };
}

// Comparação em tempo constante: o tempo de resposta não revela quanto do segredo acertou.
function segredoConfere(recebido: string, esperado: string): boolean {
  const a = new TextEncoder().encode(recebido);
  const b = new TextEncoder().encode(esperado);
  let diferenca = a.length ^ b.length;
  for (let i = 0; i < Math.max(a.length, b.length); i++) diferenca |= (a[i] ?? 0) ^ (b[i] ?? 0);
  return diferenca === 0;
}

// A Evolution manda o horário em segundos; dependendo da versão, como número ou texto.
function idadeMs(messageTimestamp: unknown, agora: number): number | undefined {
  const segundos =
    typeof messageTimestamp === "string" ? Number(messageTimestamp) : messageTimestamp;
  return typeof segundos === "number" && Number.isFinite(segundos)
    ? agora - segundos * 1000
    : undefined;
}

// O corpo da resposta HTTP nunca leva número nem texto da mensagem.
const json = (status: number, corpo: { status: string; motivo?: string }) =>
  Response.json(corpo, { status });

/**
 * Webhook da Evolution API: autentica, filtra, deduplica, pergunta ao agente e envia a
 * resposta. Devolve 500 só quando vale a pena a Evolution tentar de novo (falha no envio).
 */
export function createWebhookHandler(dependencias: {
  segredo: string | undefined;
  agente: Agente;
  enviar: (para: string, texto: string) => Promise<void>;
  deduplicador?: Deduplicador;
  agora?: () => number;
  registrarErro?: (erro: unknown) => void;
}): (requisicao: Request) => Promise<Response> {
  const {
    segredo,
    agente,
    enviar,
    deduplicador = createDeduplicador(),
    agora = Date.now,
    registrarErro,
  } = dependencias;

  return async (requisicao) => {
    if (!segredo) return json(503, { status: "erro", motivo: "webhook não configurado" });
    if (!segredoConfere(requisicao.headers.get("x-webhook-secret") ?? "", segredo)) {
      return json(401, { status: "erro", motivo: "não autorizado" });
    }

    let corpo: unknown;
    try {
      corpo = await requisicao.json();
    } catch {
      return json(400, { status: "erro", motivo: "corpo não é JSON" });
    }
    const evento = eventoSchema.safeParse(corpo);
    if (!evento.success) return json(400, { status: "erro", motivo: "formato inesperado" });

    // Algumas versões mandam "MESSAGES_UPSERT"; o controlador atual manda "messages.upsert".
    if (evento.data.event.toLowerCase().replace(/_/g, ".") !== "messages.upsert") {
      return json(200, { status: "ignorado", motivo: "evento não é mensagem" });
    }
    const mensagem = mensagemSchema.safeParse(evento.data.data);
    if (!mensagem.success) return json(400, { status: "erro", motivo: "formato inesperado" });

    const { key, message, messageTimestamp } = mensagem.data;
    if (key.fromMe) return json(200, { status: "ignorado", motivo: "enviada pelo agente" });
    if (!CONVERSA_INDIVIDUAL.test(key.remoteJid)) {
      return json(200, { status: "ignorado", motivo: "não é conversa individual" });
    }
    const texto = (message?.conversation ?? message?.extendedTextMessage?.text ?? "").trim();
    if (texto === "") return json(200, { status: "ignorado", motivo: "sem texto" });
    const idade = idadeMs(messageTimestamp, agora());
    if (idade !== undefined && idade > IDADE_MAXIMA_MS) {
      return json(200, { status: "ignorado", motivo: "mensagem antiga" });
    }
    if (!deduplicador.marcar(key.id)) return json(200, { status: "ignorado", motivo: "duplicada" });

    try {
      const resposta =
        texto.length > MAX_PERGUNTA
          ? MENSAGEM_PERGUNTA_LONGA
          : (await agente.perguntar(texto)).texto;
      await enviar(key.remoteJid, resposta);
    } catch (erro) {
      // Libera o id para a nova tentativa da Evolution ser processada.
      deduplicador.desmarcar(key.id);
      registrarErro?.(erro);
      return json(500, { status: "erro", motivo: "falha ao responder" });
    }
    return json(200, { status: "respondida" });
  };
}
