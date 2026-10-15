import { dividirMensagem, MAX_CARACTERES_POR_MENSAGEM } from "@/core/whatsapp";

/** Envia `texto` para o identificador do WhatsApp `para` (como veio do webhook). */
export type EnviarMensagem = (para: string, texto: string) => Promise<void>;

interface EvolutionConfig {
  baseUrl: string;
  instancia: string;
  apiKey: string;
}

/**
 * Envio de texto pela Evolution API v2: POST {URL}/message/sendText/{instância}, cabeçalho
 * "apikey", corpo { number, text } (conferido no código-fonte da Evolution em 15/10/2026).
 * Respostas longas vão em várias mensagens, em ordem, uma de cada vez.
 */
export function createEvolutionSender(
  opcoes: EvolutionConfig & { fetch?: typeof fetch; timeoutMs?: number; maxCaracteres?: number },
): EnviarMensagem {
  const {
    baseUrl,
    instancia,
    apiKey,
    fetch: buscar = globalThis.fetch,
    timeoutMs = 10_000,
    maxCaracteres = MAX_CARACTERES_POR_MENSAGEM,
  } = opcoes;
  const url = `${baseUrl.replace(/\/+$/, "")}/message/sendText/${encodeURIComponent(instancia)}`;

  return async (para, texto) => {
    for (const parte of dividirMensagem(texto, maxCaracteres)) {
      const controle = new AbortController();
      const timer = setTimeout(() => controle.abort(), timeoutMs);
      let resposta: Response;
      try {
        resposta = await buscar(url, {
          method: "POST",
          headers: { apikey: apiKey, "content-type": "application/json" },
          body: JSON.stringify({ number: para, text: parte }),
          signal: controle.signal,
        });
      } catch (erro) {
        // Só o tipo do erro: a mensagem original pode trazer a URL ou dados da requisição.
        const tipo = controle.signal.aborted ? "tempo limite" : "falha de rede";
        throw new Error(
          `Evolution API: ${tipo} (${erro instanceof Error ? erro.name : "erro desconhecido"})`,
        );
      } finally {
        clearTimeout(timer);
      }
      // O corpo da resposta de erro não entra na mensagem: pode ecoar o número ou o texto.
      if (!resposta.ok) throw new Error(`Evolution API recusou o envio: HTTP ${resposta.status}`);
    }
  };
}

/** Lê a configuração do ambiente. A mensagem de erro cita a variável, nunca o valor. */
export function evolutionConfigFromEnv(env: Record<string, string | undefined>): EvolutionConfig {
  const ler = (nome: string) => {
    const valor = env[nome]?.trim();
    if (!valor) throw new Error(`Variável de ambiente ${nome} não configurada`);
    return valor;
  };
  const baseUrl = ler("EVOLUTION_API_URL");
  const apiKey = ler("EVOLUTION_API_KEY");
  const instancia = ler("EVOLUTION_INSTANCE");

  let protocolo: string;
  try {
    protocolo = new URL(baseUrl).protocol;
  } catch {
    throw new Error("EVOLUTION_API_URL não é uma URL válida");
  }
  if (protocolo !== "https:") {
    throw new Error("EVOLUTION_API_URL deve usar https, para a chave não trafegar em texto aberto");
  }
  return { baseUrl, apiKey, instancia };
}

/** Envio pronto para uso no servidor, configurado pelo ambiente. */
export function createEvolutionFromEnv(
  env: Record<string, string | undefined> = process.env,
): EnviarMensagem {
  return createEvolutionSender(evolutionConfigFromEnv(env));
}
