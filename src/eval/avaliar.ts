import { z } from "zod";

import { decide, type Limites } from "@/core/decision";
import { search, type Indice } from "@/core/retrieval";

const perguntaSchema = z.union([
  z
    .object({
      id: z.string().min(1),
      conjunto: z.enum(["calibracao", "teste"]),
      pergunta: z.string().min(1),
      esperado: z.array(z.string().min(1)).min(1),
      fora_do_escopo: z.literal(false).optional(),
    })
    .strict(),
  z
    .object({
      id: z.string().min(1),
      conjunto: z.enum(["calibracao", "teste"]),
      pergunta: z.string().min(1),
      fora_do_escopo: z.literal(true),
      motivo: z.string().min(1),
    })
    .strict(),
]);

/** Formato de eval/perguntas.json. */
export const conjuntoSchema = z.object({ perguntas: z.array(perguntaSchema) }).passthrough();

export type Pergunta = z.infer<typeof perguntaSchema>;
export type NomeConjunto = Pergunta["conjunto"];

/** O que o agente fez com uma pergunta, na camada de busca e decisão (sem modelo). */
export interface Execucao {
  /** Ids dos trechos recuperados pela busca (até 3). */
  recuperados: string[];
  decisao: "responder" | "recusar" | "boas_vindas";
  /** Ids dos trechos que iriam para o modelo; vazio quando não responde. */
  respondidoCom: string[];
}

export interface MetricasConjunto {
  dentro: {
    total: number;
    /** Fração em que um trecho esperado veio entre os recuperados. */
    recallAt3: number;
    /** Fração em que respondeu usando um trecho esperado. */
    respostasCorretas: number;
    recusasIndevidas: string[];
    respostasComTrechoErrado: string[];
  };
  fora: {
    total: number;
    /** Fração recusada, como devia. */
    abstencaoCorreta: number;
    respostasIndevidas: string[];
  };
}

export type Relatorio = Record<NomeConjunto, MetricasConjunto>;

const fracao = (parte: number, total: number) => (total === 0 ? 0 : parte / total);

function medir(perguntas: Pergunta[], executar: (pergunta: string) => Execucao): MetricasConjunto {
  const dentro = {
    total: 0,
    recuperou: 0,
    acertou: 0,
    recusas: [] as string[],
    erradas: [] as string[],
  };
  const fora = { total: 0, recusou: 0, indevidas: [] as string[] };

  for (const p of perguntas) {
    const execucao = executar(p.pergunta);
    if (p.fora_do_escopo) {
      fora.total++;
      if (execucao.decisao === "responder") fora.indevidas.push(p.id);
      else fora.recusou++;
      continue;
    }
    dentro.total++;
    const esperado = new Set(p.esperado);
    if (execucao.recuperados.some((id) => esperado.has(id))) dentro.recuperou++;
    if (execucao.decisao !== "responder") dentro.recusas.push(p.id);
    else if (execucao.respondidoCom.some((id) => esperado.has(id))) dentro.acertou++;
    else dentro.erradas.push(p.id);
  }

  return {
    dentro: {
      total: dentro.total,
      recallAt3: fracao(dentro.recuperou, dentro.total),
      respostasCorretas: fracao(dentro.acertou, dentro.total),
      recusasIndevidas: dentro.recusas,
      respostasComTrechoErrado: dentro.erradas,
    },
    fora: {
      total: fora.total,
      abstencaoCorreta: fracao(fora.recusou, fora.total),
      respostasIndevidas: fora.indevidas,
    },
  };
}

/** Mede o agente no conjunto-ouro, separando calibração e teste. */
export function avaliar(
  perguntas: Pergunta[],
  executar: (pergunta: string) => Execucao,
): Relatorio {
  return {
    calibracao: medir(
      perguntas.filter((p) => p.conjunto === "calibracao"),
      executar,
    ),
    teste: medir(
      perguntas.filter((p) => p.conjunto === "teste"),
      executar,
    ),
  };
}

/** Executor real: a mesma busca e a mesma decisão que o agente usa, sem o modelo. */
export function criarExecutor(indice: Indice, limites: Limites): (pergunta: string) => Execucao {
  return (pergunta) => {
    const resultados = search(indice, pergunta);
    const decisao = decide(pergunta, resultados, limites);
    return {
      recuperados: resultados.map((r) => r.trecho.id),
      decisao: decisao.tipo,
      respondidoCom: decisao.tipo === "responder" ? decisao.trechos.map((t) => t.id) : [],
    };
  };
}
