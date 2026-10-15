// Payloads de exemplo do webhook da Evolution API v2, no formato montado por
// src/api/integrations/event/webhook/webhook.controller.ts (evolution-foundation/evolution-api,
// branch main, consultado em 15/10/2026) e de exemplos reais publicados na issue #91.
// Números, ids e chaves são fictícios.

const AGORA_S = 1_792_000_000; // instante de referência dos testes, em segundos

function evento(event: string, data: unknown) {
  return {
    event,
    instance: "tira-duvidas",
    data,
    destination: "https://exemplo.lovable.app/api/whatsapp/webhook",
    date_time: "2026-10-15T12:00:00.000Z",
    sender: "5565900000000@s.whatsapp.net",
    server_url: "https://evolution.exemplo.com",
    apikey: "chave-da-instancia-ficticia",
  };
}

function mensagem(opcoes: {
  id?: string;
  remoteJid?: string;
  fromMe?: boolean;
  message: Record<string, unknown>;
  messageType?: string;
  messageTimestamp?: number;
}) {
  return evento("messages.upsert", {
    key: {
      remoteJid: opcoes.remoteJid ?? "5565911111111@s.whatsapp.net",
      fromMe: opcoes.fromMe ?? false,
      id: opcoes.id ?? "3EB0946F0C4651173802D6",
    },
    pushName: "Pessoa de Teste",
    message: opcoes.message,
    messageType: opcoes.messageType ?? "conversation",
    messageTimestamp: opcoes.messageTimestamp ?? AGORA_S,
    owner: "tira-duvidas",
    source: "android",
  });
}

export const AGORA_MS = AGORA_S * 1000;

export const textoSimples = mensagem({ message: { conversation: "O que é o split payment?" } });

export const textoEstendido = mensagem({
  id: "3EB0ESTENDIDO",
  messageType: "extendedTextMessage",
  message: { extendedTextMessage: { text: "Quem tem direito ao cashback?" } },
});

// Novo endereçamento do WhatsApp (LID): ainda é conversa individual.
export const textoLid = mensagem({
  id: "3EB0LID",
  remoteJid: "123456789012345@lid",
  message: { conversation: "O que é o IBS?" },
});

// Mensagem enviada pela própria instância: chega como messages.upsert (issue #1340).
export const enviadaPeloAgente = mensagem({
  id: "3EB0FROMME",
  fromMe: true,
  message: { conversation: "Resposta que o próprio agente mandou." },
});

export const deGrupo = mensagem({
  id: "3EB0GRUPO",
  remoteJid: "120363000000000000@g.us",
  message: { conversation: "O que é o IBS?" },
});

export const deStatus = mensagem({
  id: "3EB0STATUS",
  remoteJid: "status@broadcast",
  message: { conversation: "Atualização de status" },
});

export const imagemSemTexto = mensagem({
  id: "3EB0IMAGEM",
  messageType: "imageMessage",
  message: { imageMessage: { mimetype: "image/jpeg" } },
});

export const textoVazio = mensagem({ id: "3EB0VAZIO", message: { conversation: "   " } });

export const textoAntigo = mensagem({
  id: "3EB0ANTIGO",
  message: { conversation: "O que é o split payment?" },
  messageTimestamp: AGORA_S - 60 * 60, // uma hora atrás
});

export const textoLongo = mensagem({
  id: "3EB0LONGO",
  message: { conversation: "a".repeat(2000) },
});

export const conexao = evento("connection.update", { instance: "tira-duvidas", state: "open" });
