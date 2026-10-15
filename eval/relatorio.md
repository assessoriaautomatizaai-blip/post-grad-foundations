# Relatório do conjunto-ouro

> Gerado por `npm run eval` em 2026-10-15. Mede a camada de busca e decisão, sem o modelo de linguagem.
> Limites: escore mínimo 0.5, cobertura mínima 0.3.
> Perguntas e gabarito em [perguntas.json](perguntas.json). O conjunto de **teste** não é usado para calibrar.

## Calibração

| Métrica | Valor |
|---|---|
| Perguntas dentro do escopo | 15 |
| Recall@3 (trecho esperado entre os 3 recuperados) | 73% |
| Respostas corretas (respondeu usando um trecho esperado) | 60% |
| Recusas indevidas | c01, c04, c11, c14, c15 |
| Respostas com trecho errado | c12 |
| Perguntas fora do escopo | 6 |
| Abstenção correta (recusou fora do escopo) | 100% |
| Respostas indevidas fora do escopo | — |

## Teste

| Métrica | Valor |
|---|---|
| Perguntas dentro do escopo | 7 |
| Recall@3 (trecho esperado entre os 3 recuperados) | 86% |
| Respostas corretas (respondeu usando um trecho esperado) | 71% |
| Recusas indevidas | t03, t06 |
| Respostas com trecho errado | — |
| Perguntas fora do escopo | 4 |
| Abstenção correta (recusou fora do escopo) | 100% |
| Respostas indevidas fora do escopo | — |
