# src/core

Regra de negócio do agente, em TypeScript puro e **sem I/O** (sem rede, sem banco, sem variável de ambiente): normalização da pergunta, saudação, montagem do prompt com a base inteira, conferência das citações e das fontes da web e formatação da resposta (ADR-007).

Tudo aqui é testável com `npm test`, sem chave e sem internet. Ver ADR-001 em [docs/decisoes.md](../../docs/decisoes.md).
