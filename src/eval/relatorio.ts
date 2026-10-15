import type { Limites } from "@/core/decision";

import type { MetricasConjunto, Relatorio } from "./avaliar";

const pct = (x: number) => `${Math.round(x * 100)}%`;
const lista = (ids: string[]) => (ids.length === 0 ? "—" : ids.join(", "));

function secao(nome: string, m: MetricasConjunto): string {
  return [
    `## ${nome}`,
    "",
    "| Métrica | Valor |",
    "|---|---|",
    `| Perguntas dentro do escopo | ${m.dentro.total} |`,
    `| Recall@3 (trecho esperado entre os 3 recuperados) | ${pct(m.dentro.recallAt3)} |`,
    `| Respostas corretas (respondeu usando um trecho esperado) | ${pct(m.dentro.respostasCorretas)} |`,
    `| Recusas indevidas | ${lista(m.dentro.recusasIndevidas)} |`,
    `| Respostas com trecho errado | ${lista(m.dentro.respostasComTrechoErrado)} |`,
    `| Perguntas fora do escopo | ${m.fora.total} |`,
    `| Abstenção correta (recusou fora do escopo) | ${pct(m.fora.abstencaoCorreta)} |`,
    `| Respostas indevidas fora do escopo | ${lista(m.fora.respostasIndevidas)} |`,
    "",
  ].join("\n");
}

/** Relatório em Markdown, gravado em eval/relatorio.md por `npm run eval`. */
export function formatarRelatorio(relatorio: Relatorio, limites: Limites, data: string): string {
  return [
    "# Relatório do conjunto-ouro",
    "",
    `> Gerado por \`npm run eval\` em ${data}. Mede a camada de busca e decisão, sem o modelo de linguagem.`,
    `> Limites: escore mínimo ${limites.scoreMinimo}, cobertura mínima ${limites.coberturaMinima}.`,
    "> Perguntas e gabarito em [perguntas.json](perguntas.json). O conjunto de **teste** não é usado para calibrar.",
    "",
    secao("Calibração", relatorio.calibracao),
    secao("Teste", relatorio.teste),
  ].join("\n");
}
