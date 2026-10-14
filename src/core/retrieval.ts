import type { Trecho } from "./knowledge";
import { normalizeText, tokenize } from "./tokenize";

// Parâmetros clássicos do BM25: k1 controla a saturação da frequência do termo,
// b controla o peso do tamanho do trecho.
const K1 = 1.2;
const B = 0.75;

/** Termo que o usuário usa → expressões da lei que significam a mesma coisa. */
export type Sinonimos = Readonly<Record<string, readonly string[]>>;

export interface Resultado {
  trecho: Trecho;
  score: number;
}

interface Documento {
  trecho: Trecho;
  frequencias: Map<string, number>;
  tamanho: number;
}

export interface Indice {
  documentos: Documento[];
  frequenciaNosDocumentos: Map<string, number>;
  tamanhoMedio: number;
}

// Um trecho que contém uma das expressões ganha também os tokens do termo.
// A comparação é feita com espaços nas bordas para casar palavras inteiras:
// "art 156 a" não casa com "art 156 iii".
function termosPorSinonimo(texto: string, sinonimos: Sinonimos): string[] {
  const normalizado = ` ${normalizeText(texto)} `;
  return Object.entries(sinonimos).flatMap(([termo, expressoes]) =>
    expressoes.some((expressao) => normalizado.includes(` ${normalizeText(expressao)} `))
      ? tokenize(termo)
      : [],
  );
}

/** Monta o índice BM25 dos trechos. O texto dos trechos não é alterado. */
export function buildIndex(
  trechos: readonly Trecho[],
  opcoes: { sinonimos?: Sinonimos } = {},
): Indice {
  const sinonimos = opcoes.sinonimos ?? {};
  const frequenciaNosDocumentos = new Map<string, number>();

  const documentos = trechos.map((trecho) => {
    const tokens = [...tokenize(trecho.texto), ...termosPorSinonimo(trecho.texto, sinonimos)];
    const frequencias = new Map<string, number>();
    for (const token of tokens) frequencias.set(token, (frequencias.get(token) ?? 0) + 1);
    for (const token of frequencias.keys()) {
      frequenciaNosDocumentos.set(token, (frequenciaNosDocumentos.get(token) ?? 0) + 1);
    }
    return { trecho, frequencias, tamanho: tokens.length };
  });

  const tamanhoTotal = documentos.reduce((soma, doc) => soma + doc.tamanho, 0);
  return {
    documentos,
    frequenciaNosDocumentos,
    tamanhoMedio: documentos.length > 0 ? tamanhoTotal / documentos.length : 0,
  };
}

/**
 * Devolve até `k` trechos com escore positivo, do mais ao menos relevante.
 * Empates ficam na ordem da base, então a busca é determinística.
 */
export function search(indice: Indice, pergunta: string, k = 3): Resultado[] {
  const termos = [...new Set(tokenize(pergunta))];
  const total = indice.documentos.length;

  const resultados = indice.documentos.map((doc, posicao) => {
    let score = 0;
    for (const termo of termos) {
      const frequencia = doc.frequencias.get(termo);
      if (!frequencia) continue;
      const comTermo = indice.frequenciaNosDocumentos.get(termo) ?? 0;
      const idf = Math.log((total - comTermo + 0.5) / (comTermo + 0.5) + 1);
      const normalizacao = 1 - B + (B * doc.tamanho) / indice.tamanhoMedio;
      score += (idf * frequencia * (K1 + 1)) / (frequencia + K1 * normalizacao);
    }
    return { trecho: doc.trecho, score, posicao };
  });

  return resultados
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.posicao - b.posicao)
    .slice(0, k)
    .map(({ trecho, score }) => ({ trecho, score }));
}
