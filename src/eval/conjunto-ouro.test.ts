import { writeFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import base from "../../knowledge/base.json";
import conjuntoOuro from "../../eval/perguntas.json";
import { DECISAO_PADRAO } from "@/core/decision";
import { parseKnowledgeBase } from "@/core/knowledge";
import { buildIndex } from "@/core/retrieval";
import { SINONIMOS } from "@/core/sinonimos";

import { avaliar, conjuntoSchema, criarExecutor } from "./avaliar";
import { formatarRelatorio } from "./relatorio";

// Roda o agente (busca e decisão, sem modelo) no conjunto-ouro com os limites de produção.
// Em `npm run eval` (vitest --mode eval) também grava eval/relatorio.md.
describe("conjunto-ouro com os limites de produção", () => {
  const indice = buildIndex(parseKnowledgeBase(base), { sinonimos: SINONIMOS });
  const relatorio = avaliar(
    conjuntoSchema.parse(conjuntoOuro).perguntas,
    criarExecutor(indice, DECISAO_PADRAO),
  );

  if (import.meta.env.MODE === "eval") {
    const texto = formatarRelatorio(
      relatorio,
      DECISAO_PADRAO,
      new Date().toISOString().slice(0, 10),
    );
    writeFileSync("eval/relatorio.md", texto);
    console.log(texto);
  }

  // Critério do escopo (docs/escopo.md): 100% das perguntas fora do escopo recusadas.
  it.each(["calibracao", "teste"] as const)(
    "recusa todas as perguntas fora do escopo (%s)",
    (nome) => {
      expect(relatorio[nome].fora.respostasIndevidas).toEqual([]);
    },
  );
});
