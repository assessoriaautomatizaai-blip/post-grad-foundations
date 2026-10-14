import { decide, MENSAGEM_RECUSA, type Limites } from "./decision";
import type { Trecho } from "./knowledge";
import { PROMPT_SISTEMA } from "./prompts/sistema";
import { search, type Indice } from "./retrieval";

export interface Prompt {
  sistema: string;
  usuario: string;
}

/** Modelo de linguagem atrás de uma interface: o núcleo não sabe qual é o provedor. */
export interface LlmAdapter {
  gerar(prompt: Prompt, opcoes?: { signal?: AbortSignal }): Promise<string>;
}

export interface Resposta {
  tipo: "resposta" | "recusa" | "boas_vindas" | "falha";
  texto: string;
  /** Trechos efetivamente citados na resposta. */
  fontes: Trecho[];
}

export const AVISO =
  "_Resposta informativa, com base na legislação citada. Não substitui a orientação de um contador ou advogado._";

// Não expõe detalhe técnico (código de erro, provedor, chave): isso fica só no log do servidor.
export const MENSAGEM_FALHA =
  "Tive um problema técnico para responder agora. Tente de novo em alguns minutos.";

const TIMEOUT_PADRAO_MS = 15_000;
const CITACAO = /\[([a-z0-9]+(?:-[a-z0-9]+)*)\]/g;

const recusa = (): Resposta => ({ tipo: "recusa", texto: MENSAGEM_RECUSA, fontes: [] });
const falha = (): Resposta => ({ tipo: "falha", texto: MENSAGEM_FALHA, fontes: [] });
const citacaoLegivel = (t: Trecho) => `${t.norma}, ${t.dispositivo}`;

// A pergunta é texto do usuário: sem "<" e ">", ela não consegue abrir nem fechar os
// delimitadores do prompt para se passar por instrução.
const neutralizar = (texto: string) => texto.replace(/</g, "‹").replace(/>/g, "›");

/** Monta o prompt: regras fixas no sistema; trechos e pergunta delimitados na mensagem. */
export function buildPrompt(pergunta: string, trechos: readonly Trecho[]): Prompt {
  const blocos = trechos
    .map((t) => `<trecho id="${t.id}" fonte="${citacaoLegivel(t)}">\n${t.texto}\n</trecho>`)
    .join("\n");
  return {
    sistema: PROMPT_SISTEMA,
    usuario: `<trechos>\n${blocos}\n</trechos>\n\n<pergunta>\n${neutralizar(pergunta.trim())}\n</pergunta>`,
  };
}

/**
 * Confere as citações do modelo e monta a resposta final. Vira recusa, sem mostrar o
 * texto do modelo, quando não há citação ou quando algum id citado não foi recuperado.
 */
export function renderAnswer(textoDoModelo: string, trechos: readonly Trecho[]): Resposta {
  const porId = new Map(trechos.map((t) => [t.id, t]));
  const citados = [...textoDoModelo.matchAll(CITACAO)].map((m) => m[1] ?? "");

  if (textoDoModelo.trim() === "" || citados.length === 0) return recusa();
  if (citados.some((id) => !porId.has(id))) return recusa();

  const fontes = [...new Set(citados)].map((id) => porId.get(id) as Trecho);
  const corpo = textoDoModelo
    .trim()
    .replace(CITACAO, (_, id: string) => `(${citacaoLegivel(porId.get(id) as Trecho)})`);
  const listaDeFontes = fontes.map((t) => `• ${citacaoLegivel(t)}: ${t.url_fonte}`).join("\n");

  return {
    tipo: "resposta",
    texto: `${corpo}\n\n*Fontes:*\n${listaDeFontes}\n\n${AVISO}`,
    fontes,
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
 * Responde a uma pergunta de ponta a ponta: busca, decide e, só se for responder,
 * chama o modelo. Nunca lança erro: falha do modelo vira a mensagem de falha.
 */
export async function answerQuestion(
  pergunta: string,
  dependencias: {
    indice: Indice;
    llm: LlmAdapter;
    limites?: Limites;
    timeoutMs?: number;
    /** Recebe o erro do modelo para o servidor registrar; o usuário vê só MENSAGEM_FALHA. */
    registrarErro?: (erro: unknown) => void;
  },
): Promise<Resposta> {
  const { indice, llm, limites, timeoutMs = TIMEOUT_PADRAO_MS, registrarErro } = dependencias;
  const decisao = decide(pergunta, search(indice, pergunta), limites);

  if (decisao.tipo === "boas_vindas") {
    return { tipo: "boas_vindas", texto: decisao.mensagem, fontes: [] };
  }
  if (decisao.tipo === "recusar") return recusa();

  let textoDoModelo: string;
  try {
    textoDoModelo = await comTempoLimite(
      (signal) => llm.gerar(buildPrompt(pergunta, decisao.trechos), { signal }),
      timeoutMs,
    );
  } catch (erro) {
    registrarErro?.(erro);
    return falha();
  }
  return renderAnswer(textoDoModelo, decisao.trechos);
}
