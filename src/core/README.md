# src/core

Regra de negócio do agente, em TypeScript puro e **sem I/O** (sem rede, sem banco, sem variável de ambiente): normalização da pergunta, recuperação na base, decisão responder × recusar, montagem do prompt e formatação da resposta.

Tudo aqui é testável com `npm test`, sem chave e sem internet. Ver ADR-001 em [docs/decisoes.md](../../docs/decisoes.md).
