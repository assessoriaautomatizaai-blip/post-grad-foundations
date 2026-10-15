import { ehSaudacao, MENSAGEM_BOAS_VINDAS } from "./decision";
import type { Trecho } from "./knowledge";
import { PROMPT_SISTEMA } from "./prompts/sistema";

export interface Prompt {
  sistema: string;
  usuario: string;
}

/** Página encontrada pela busca do modelo. Não é conferida por pessoa (ADR-007). */
export interface FonteWeb {
  titulo: string;
  url: string;
}

/** O que o modelo devolve: o texto e as fontes da busca na web que ele usou. */
export interface Geracao {
  texto: string;
  fontesWeb: FonteWeb[];
}

/** Modelo de linguagem atrás de uma interface: o núcleo não sabe qual é o provedor. */
export interface LlmAdapter {
  gerar(prompt: Prompt, opcoes?: { signal?: AbortSignal }): Promise<Geracao>;
}

export interface Resposta {
  tipo: "resposta" | "boas_vindas" | "fora_do_tema" | "sem_fonte" | "falha";
  /** Texto do WhatsApp: as fontes vão listadas com o endereço, que o WhatsApp torna clicável. */
  texto: string;
  /**
   * Só nas respostas: o mesmo texto sem as listas de endereços, para telas que mostram as
   * fontes como links com nome (o simulador). Os links não são alterados (termos do Google).
   */
  corpo?: string;
  /** Trechos da base efetivamente citados na resposta. */
  fontes: Trecho[];
  /** Páginas da busca na web listadas na resposta (complemento não conferido). */
  fontesWeb: FonteWeb[];
}

export const AVISO =
  "_Resposta informativa. A lei citada vem da base conferida; as fontes da web aparecem como não conferidas. Não substitui a orientação de um contador ou advogado._";

// Não expõe detalhe técnico (código de erro, provedor, chave): isso fica só no log do servidor.
export const MENSAGEM_FALHA =
  "Tive um problema técnico para responder agora. Tente de novo em alguns minutos.";

// Não afirma nenhum fato: aparece justamente quando a resposta não tinha fonte confiável.
export const MENSAGEM_SEM_FONTE = [
  "Não consegui confirmar essa informação numa fonte confiável agora.",
  "",
  "Tente reformular a pergunta ou procure um contador ou advogado.",
].join("\n");

export const MENSAGEM_FORA_DO_TEMA = [
  "Eu sou especializado na reforma tributária, então não consigo ajudar com esse assunto.",
  "",
  "Posso responder perguntas como:",
  "• O que muda com o IBS e a CBS?",
  "• Quando o ICMS e o ISS deixam de existir?",
  "• Quem tem direito ao cashback?",
].join("\n");

const TIMEOUT_PADRAO_MS = 25_000;
const CITACAO = /\[([a-z0-9]+(?:-[a-z0-9]+)*)\]/g;
const FORA_DO_TEMA = "[fora-do-tema]";
const COMPLEMENTO = /\*Complemento:\*/i;

const semResposta = (tipo: Resposta["tipo"], texto: string): Resposta => ({
  tipo,
  texto,
  fontes: [],
  fontesWeb: [],
});
const citacaoLegivel = (t: Trecho) => `${t.norma}, ${t.dispositivo}`;

// A pergunta é texto do usuário: sem "<" e ">", ela não consegue abrir nem fechar os
// delimitadores do prompt para se passar por instrução.
const neutralizar = (texto: string) => texto.replace(/</g, "‹").replace(/>/g, "›");

/** Monta o prompt: regras fixas no sistema; a base inteira e a pergunta delimitadas na mensagem. */
export function buildPrompt(pergunta: string, base: readonly Trecho[]): Prompt {
  const blocos = base
    .map((t) => `<trecho id="${t.id}" fonte="${citacaoLegivel(t)}">\n${t.texto}\n</trecho>`)
    .join("\n");
  return {
    sistema: PROMPT_SISTEMA,
    usuario: `<base>\n${blocos}\n</base>\n\n<pergunta>\n${neutralizar(pergunta.trim())}\n</pergunta>`,
  };
}

/** Só http(s), sem repetir endereço, na ordem em que a busca devolveu. */
function fontesWebValidas(fontes: readonly FonteWeb[]): FonteWeb[] {
  const vistas = new Set<string>();
  return fontes.filter(({ url }) => {
    let protocolo: string;
    try {
      protocolo = new URL(url).protocol;
    } catch {
      return false;
    }
    if ((protocolo !== "https:" && protocolo !== "http:") || vistas.has(url)) return false;
    vistas.add(url);
    return true;
  });
}

/**
 * Confere o que o modelo devolveu e monta a resposta final (ADR-007):
 * - "[fora-do-tema]" vira a mensagem fixa de redirecionamento;
 * - id citado que não existe na base bloqueia a resposta inteira;
 * - a parte "*Complemento:*" só fica se a busca devolveu fonte;
 * - sem citação da base e sem fonte da web, a resposta não é mostrada.
 */
export function renderAnswer(geracao: Geracao, base: readonly Trecho[]): Resposta {
  const textoDoModelo = geracao.texto.trim();
  if (textoDoModelo === "") return semResposta("sem_fonte", MENSAGEM_SEM_FONTE);
  if (textoDoModelo.includes(FORA_DO_TEMA)) {
    return semResposta("fora_do_tema", MENSAGEM_FORA_DO_TEMA);
  }

  const porId = new Map(base.map((t) => [t.id, t]));
  const citadosNoModelo = [...textoDoModelo.matchAll(CITACAO)].map((m) => m[1] ?? "");
  if (citadosNoModelo.some((id) => !porId.has(id))) {
    return semResposta("sem_fonte", MENSAGEM_SEM_FONTE);
  }

  const fontesWeb = fontesWebValidas(geracao.fontesWeb);
  const inicioComplemento = textoDoModelo.search(COMPLEMENTO);
  const texto =
    inicioComplemento >= 0 && fontesWeb.length === 0
      ? textoDoModelo.slice(0, inicioComplemento).trim()
      : textoDoModelo;

  const citados = [...texto.matchAll(CITACAO)].map((m) => m[1] ?? "");
  if (texto === "" || (citados.length === 0 && fontesWeb.length === 0)) {
    return semResposta("sem_fonte", MENSAGEM_SEM_FONTE);
  }

  const fontes = [...new Set(citados)].map((id) => porId.get(id) as Trecho);
  const corpo = texto.replace(
    CITACAO,
    (_, id: string) => `(${citacaoLegivel(porId.get(id) as Trecho)})`,
  );
  const partes = [corpo];
  if (fontes.length > 0) {
    partes.push(
      `*Fontes da lei:*\n${fontes.map((t) => `• ${citacaoLegivel(t)}: ${t.url_fonte}`).join("\n")}`,
    );
  }
  if (fontesWeb.length > 0) {
    partes.push(
      `*Outras fontes (não conferidas):*\n${fontesWeb.map((f) => `• ${f.titulo}: ${f.url}`).join("\n")}`,
    );
  }
  partes.push(AVISO);

  return {
    tipo: "resposta",
    texto: partes.join("\n\n"),
    corpo: `${corpo}\n\n${AVISO}`,
    fontes,
    fontesWeb,
  };
}

async function comTempoLimite<T>(
  executar: (signal: AbortSignal) => Promise<T>,
  limiteMs: number,
): Promise<T> {
  const controle = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const estouro = new Promise<never>((_, rejeitar) => {
    timer = setTimeout(() => {
      controle.abort();
      rejeitar(new Error(`tempo limite de ${limiteMs} ms excedido`));
    }, limiteMs);
  });
  try {
    return await Promise.race([executar(controle.signal), estouro]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Responde a uma pergunta de ponta a ponta. Saudação não chama o modelo; o resto vai ao
 * modelo com a base inteira. Nunca lança erro: falha do modelo vira a mensagem de falha.
 */
export async function answerQuestion(
  pergunta: string,
  dependencias: {
    base: readonly Trecho[];
    llm: LlmAdapter;
    timeoutMs?: number;
    /** Recebe o erro do modelo para o servidor registrar; o usuário vê só MENSAGEM_FALHA. */
    registrarErro?: (erro: unknown) => void;
  },
): Promise<Resposta> {
  const { base, llm, timeoutMs = TIMEOUT_PADRAO_MS, registrarErro } = dependencias;

  if (ehSaudacao(pergunta)) return semResposta("boas_vindas", MENSAGEM_BOAS_VINDAS);

  let geracao: Geracao;
  try {
    geracao = await comTempoLimite(
      (signal) => llm.gerar(buildPrompt(pergunta, base), { signal }),
      timeoutMs,
    );
  } catch (erro) {
    registrarErro?.(erro);
    return semResposta("falha", MENSAGEM_FALHA);
  }
  return renderAnswer(geracao, base);
}
