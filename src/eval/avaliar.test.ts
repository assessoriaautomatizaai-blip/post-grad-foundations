import { describe, expect, it } from "vitest";

import base from "../../knowledge/base.json";
import conjuntoOuro from "../../eval/perguntas.json";
import { parseKnowledgeBase, type Trecho } from "@/core/knowledge";
import { buildIndex } from "@/core/retrieval";

import { avaliar, conjuntoSchema, criarExecutor, type Execucao, type Pergunta } from "./avaliar";

// Especificação da avaliação do agente pelo conjunto-ouro (H11, P-avaliacao-de-rag-alem-dos-testes).
// A avaliação mede a camada de busca e decisão (sem modelo de linguagem): o trecho certo veio?
// O agente respondeu quando devia e recusou quando devia?

describe("conjunto-ouro (eval/perguntas.json)", () => {
  const conjunto = conjuntoSchema.parse(conjuntoOuro);
  const idsDaBase = new Set(parseKnowledgeBase(base).map((t) => t.id));
  const dentro = conjunto.perguntas.filter((p) => !p.fora_do_escopo);
  const fora = conjunto.perguntas.filter((p) => p.fora_do_escopo);

  it("tem pelo menos 20 perguntas, 5 delas fora do escopo", () => {
    expect(conjunto.perguntas.length).toBeGreaterThanOrEqual(20);
    expect(fora.length).toBeGreaterThanOrEqual(5);
  });

  it("não repete id nem pergunta", () => {
    expect(new Set(conjunto.perguntas.map((p) => p.id)).size).toBe(conjunto.perguntas.length);
    expect(new Set(conjunto.perguntas.map((p) => p.pergunta)).size).toBe(conjunto.perguntas.length);
  });

  it("todo trecho esperado existe na base", () => {
    for (const p of dentro) for (const id of p.esperado ?? []) expect(idsDaBase).toContain(id);
  });

  it("os dois conjuntos (calibração e teste) têm perguntas dentro e fora do escopo", () => {
    for (const nome of ["calibracao", "teste"] as const) {
      expect(dentro.some((p) => p.conjunto === nome)).toBe(true);
      expect(fora.some((p) => p.conjunto === nome)).toBe(true);
    }
  });
});

describe("conjuntoSchema", () => {
  const valida = {
    id: "x1",
    conjunto: "calibracao",
    pergunta: "O que é o IBS?",
    esperado: ["lc214-art1"],
  };

  it("exige trecho esperado em pergunta dentro do escopo", () => {
    expect(conjuntoSchema.safeParse({ perguntas: [{ ...valida, esperado: [] }] }).success).toBe(
      false,
    );
  });

  it("exige motivo e proíbe trecho esperado em pergunta fora do escopo", () => {
    const fora = { id: "x2", conjunto: "teste", pergunta: "IPVA?", fora_do_escopo: true };
    expect(conjuntoSchema.safeParse({ perguntas: [fora] }).success).toBe(false);
    expect(
      conjuntoSchema.safeParse({ perguntas: [{ ...fora, motivo: "m", esperado: ["a"] }] }).success,
    ).toBe(false);
    expect(conjuntoSchema.safeParse({ perguntas: [{ ...fora, motivo: "m" }] }).success).toBe(true);
  });

  it("aceita só os conjuntos calibracao e teste", () => {
    expect(
      conjuntoSchema.safeParse({ perguntas: [{ ...valida, conjunto: "treino" }] }).success,
    ).toBe(false);
  });
});

describe("avaliar", () => {
  const perguntas: Pergunta[] = [
    { id: "d1", conjunto: "calibracao", pergunta: "acerta tudo", esperado: ["a"] },
    { id: "d2", conjunto: "calibracao", pergunta: "recupera mas recusa", esperado: ["b"] },
    { id: "d3", conjunto: "calibracao", pergunta: "responde com trecho errado", esperado: ["c"] },
    { id: "d4", conjunto: "calibracao", pergunta: "não recupera", esperado: ["d"] },
    {
      id: "f1",
      conjunto: "calibracao",
      pergunta: "recusa certo",
      fora_do_escopo: true,
      motivo: "m",
    },
    {
      id: "f2",
      conjunto: "calibracao",
      pergunta: "responde indevido",
      fora_do_escopo: true,
      motivo: "m",
    },
    { id: "t1", conjunto: "teste", pergunta: "teste certo", esperado: ["a"] },
  ];
  const execucoes: Record<string, Execucao> = {
    "acerta tudo": { recuperados: ["a", "x"], decisao: "responder", respondidoCom: ["a"] },
    "recupera mas recusa": { recuperados: ["b"], decisao: "recusar", respondidoCom: [] },
    "responde com trecho errado": {
      recuperados: ["x", "y", "z"],
      decisao: "responder",
      respondidoCom: ["x"],
    },
    "não recupera": { recuperados: [], decisao: "recusar", respondidoCom: [] },
    "recusa certo": { recuperados: ["a"], decisao: "recusar", respondidoCom: [] },
    "responde indevido": { recuperados: ["a"], decisao: "responder", respondidoCom: ["a"] },
    "teste certo": { recuperados: ["a"], decisao: "responder", respondidoCom: ["a"] },
  };
  const relatorio = avaliar(perguntas, (pergunta) => execucoes[pergunta] as Execucao);

  it("mede recall@3: o trecho esperado está entre os recuperados", () => {
    expect(relatorio.calibracao.dentro.total).toBe(4);
    expect(relatorio.calibracao.dentro.recallAt3).toBeCloseTo(2 / 4);
  });

  it("conta como resposta correta só quando responde usando um trecho esperado", () => {
    expect(relatorio.calibracao.dentro.respostasCorretas).toBeCloseTo(1 / 4);
  });

  it("lista as recusas indevidas e as respostas com trecho errado, pelo id da pergunta", () => {
    expect(relatorio.calibracao.dentro.recusasIndevidas).toEqual(["d2", "d4"]);
    expect(relatorio.calibracao.dentro.respostasComTrechoErrado).toEqual(["d3"]);
  });

  it("mede a abstenção correta fora do escopo e lista as respostas indevidas", () => {
    expect(relatorio.calibracao.fora.total).toBe(2);
    expect(relatorio.calibracao.fora.abstencaoCorreta).toBeCloseTo(1 / 2);
    expect(relatorio.calibracao.fora.respostasIndevidas).toEqual(["f2"]);
  });

  it("separa as métricas por conjunto", () => {
    expect(relatorio.teste.dentro.total).toBe(1);
    expect(relatorio.teste.dentro.recallAt3).toBe(1);
    expect(relatorio.teste.fora.total).toBe(0);
  });
});

describe("criarExecutor", () => {
  function trecho(id: string, texto: string): Trecho {
    return {
      id,
      norma: "LC 214/2025",
      dispositivo: "art. de exemplo",
      texto,
      url_fonte: "https://www.planalto.gov.br/exemplo",
      data_referencia: "2026-10-15",
    };
  }
  const indice = buildIndex([
    trecho("fx-split", "O split payment segrega o tributo no pagamento."),
    trecho("fx-cbs", "A CBS será cobrada à alíquota de 0,9% em 2026."),
  ]);
  const executar = criarExecutor(indice, { scoreMinimo: 0.1, coberturaMinima: 0.3 });

  it("devolve os ids recuperados, a decisão e os trechos usados na resposta", () => {
    expect(executar("O que é o split payment?")).toEqual({
      recuperados: ["fx-split"],
      decisao: "responder",
      respondidoCom: ["fx-split"],
    });
  });

  it("recusa sem trechos quando a pergunta está fora da base", () => {
    expect(executar("Qual o valor do IPVA?")).toMatchObject({
      decisao: "recusar",
      respondidoCom: [],
    });
  });
});
