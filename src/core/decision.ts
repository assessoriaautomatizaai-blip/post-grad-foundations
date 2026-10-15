import type { Trecho } from "./knowledge";
import type { Resultado } from "./retrieval";
import { normalizeText, tokenize } from "./tokenize";

export interface Limites {
  /** Escore BM25 mínimo do trecho. */
  scoreMinimo: number;
  /** Cobertura mínima da pergunta pelo trecho, entre 0 (exclusivo) e 1. */
  coberturaMinima: number;
}

// Valores provisórios, escolhidos no protótipo de 14/10/2026 (ADR-004).
// A calibração é feita na H11 com o conjunto-ouro.
export const DECISAO_PADRAO: Limites = { scoreMinimo: 0.5, coberturaMinima: 0.3 };

export type Decisao =
  | { tipo: "boas_vindas"; mensagem: string }
  | { tipo: "recusar"; mensagem: string }
  | { tipo: "responder"; trechos: Trecho[] };

// Já normalizadas e sem as palavras vazias do tokenize ("tudo bem" → "tudo", "bem").
const SAUDACOES = new Set(
  "oi ola opa bom boa dia tarde noite tudo bem beleza blz ai menu ajuda inicio comecar obrigado obrigada valeu".split(
    " ",
  ),
);

export const MENSAGEM_BOAS_VINDAS = [
  "Olá! Eu tiro dúvidas básicas sobre a reforma tributária, sempre citando o artigo da lei de onde veio a resposta.",
  "",
  "Exemplos de perguntas:",
  "• O que é o IBS?",
  "• O que é o split payment?",
  "• Quem tem direito ao cashback?",
  "• Como fica o MEI na reforma?",
  "",
  "As respostas são informativas e não substituem a orientação de um contador ou advogado.",
].join("\n");

// Não afirma nenhum fato: a recusa acontece justamente quando a base não sustenta a resposta.
export const MENSAGEM_RECUSA = [
  "Não encontrei na minha base informação suficiente para responder isso com segurança.",
  "",
  "Eu respondo só dúvidas básicas sobre a reforma tributária (IBS, CBS, Imposto Seletivo, transição, cashback, cesta básica, Simples Nacional e MEI), sempre citando a lei.",
  "",
  "Tente reformular a pergunta ou procure um contador ou advogado.",
].join("\n");

// Tributos que não estão na base (docs/escopo.md, "Fora do escopo"). Pergunta que cita um
// deles é recusada antes da busca: "O IPVA acaba?" casava com o artigo que extingue o ICMS
// e o ISS (ADCT, art. 129) pela palavra "acaba", e a cobertura passava do mínimo.
// Não é afirmação ao usuário, só filtro de escopo; conferido em 15/10/2026 que nenhum
// aparece em knowledge/base.json. "renda" sozinha fica de fora: "família de baixa renda"
// é pergunta de cashback.
const TRIBUTOS_FORA_DA_BASE = [
  "ipva",
  "iptu",
  "itbi",
  "itcmd",
  "itcd",
  "itr",
  "imposto de renda",
  "imposto sobre a renda",
  "irpf",
  "irpj",
  "csll",
  "iof",
  "inss",
  "fgts",
];

function citaTributoForaDaBase(pergunta: string): boolean {
  const texto = ` ${normalizeText(pergunta)} `;
  return TRIBUTOS_FORA_DA_BASE.some((tributo) => texto.includes(` ${tributo} `));
}

function validar(limites: Limites): void {
  const { scoreMinimo, coberturaMinima } = limites;
  if (!Number.isFinite(scoreMinimo) || scoreMinimo < 0) {
    throw new Error(
      `scoreMinimo deve ser um número maior ou igual a zero (recebido: ${scoreMinimo})`,
    );
  }
  if (!Number.isFinite(coberturaMinima) || coberturaMinima <= 0 || coberturaMinima > 1) {
    throw new Error(
      `coberturaMinima deve estar entre 0 (exclusivo) e 1 (recebido: ${coberturaMinima})`,
    );
  }
}

/**
 * Decide o que fazer com a pergunta, antes de qualquer chamada ao modelo de linguagem:
 * dar boas-vindas, recusar (cita tributo fora da base, ou nenhum trecho passa nos
 * mínimos) ou responder com os trechos que passam nos dois mínimos, na ordem da busca.
 */
export function decide(
  pergunta: string,
  resultados: readonly Resultado[],
  limites: Limites = DECISAO_PADRAO,
): Decisao {
  validar(limites);

  if (tokenize(pergunta).every((palavra) => SAUDACOES.has(palavra))) {
    return { tipo: "boas_vindas", mensagem: MENSAGEM_BOAS_VINDAS };
  }

  if (citaTributoForaDaBase(pergunta)) {
    return { tipo: "recusar", mensagem: MENSAGEM_RECUSA };
  }

  const trechos = resultados
    .filter((r) => r.score >= limites.scoreMinimo && r.cobertura >= limites.coberturaMinima)
    .map((r) => r.trecho);

  return trechos.length > 0
    ? { tipo: "responder", trechos }
    : { tipo: "recusar", mensagem: MENSAGEM_RECUSA };
}
