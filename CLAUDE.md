# CLAUDE.md — contrato de trabalho com agentes de código

Este arquivo é o contrato que qualquer agente de IA de desenvolvimento (Claude Code, Lovable, Copilot) segue ao trabalhar neste repositório. Leia também o [AGENTS.md](AGENTS.md) (regras de sincronização com o Lovable).

## O projeto

**Chat com IA, no site, que tira dúvidas sobre a reforma tributária brasileira**, com resposta **fundamentada em fonte primária** (artigo de lei citado) e **recusa** quando a pergunta está fora da base.

Mini-projeto do curso C4 (_Laboratório Introdutório: Construindo um Mini-projeto com IA Generativa_, Especialização em Engenharia de Software — UFG/AKCIT). Prazo de entrega: **19/10/2026, 12h**.

Documentos de referência, nesta ordem:

1. [docs/escopo.md](docs/escopo.md) — o que entra e, principalmente, **o que não entra**
2. [docs/backlog.md](docs/backlog.md) — histórias com critérios de aceite e releases
3. [docs/decisoes.md](docs/decisoes.md) — decisões técnicas (ADRs)
4. [docs/estimativa.md](docs/estimativa.md) — esforço e custo
5. [docs/HISTORY-IA.md](docs/HISTORY-IA.md) — registro do uso de IA

## Regras invioláveis

1. **Sem segredo no repositório.** Chaves e tokens só em `.env` (ignorado) ou nos segredos do Lovable. Toda variável nova entra em `.env.example` sem valor. Se um segredo chegar a um commit: **revogar → rotacionar → limpar histórico**, nessa ordem, e avisar o humano.
2. **Não reescrever histórico publicado** (`push --force`, `rebase`/`amend` de commits já enviados) — quebra a sincronização com o Lovable.
3. **A `main` fica sempre funcionando.** Todo push para `main` aparece no Lovable na hora. Push só com aprovação explícita do humano.
4. **Testes são o oráculo e pertencem ao humano.** Testes que definem comportamento são escritos primeiro e aprovados pelo humano antes da implementação. **Não altere arquivos de teste para fazê-los passar** — se um teste parecer errado, pare e pergunte.
5. **Nenhum fato jurídico vem da memória do modelo sem fonte.** Alíquotas, prazos, datas, artigos e nomes de tributos vêm (a) da base de conhecimento (`knowledge/`), com o texto literal da lei citado pelo dispositivo, ou (b) da busca na web feita pelo modelo, **sempre com o link da fonte e identificada como complemento não conferido**. Afirmação sem nenhuma das duas fontes não chega ao usuário (ADR-007).
6. **As garantias da resposta são conferidas no código, não delegadas ao prompt:** citação de lei que não existe na base bloqueia a resposta; complemento sem fonte da web é removido; resposta sem fonte nenhuma vira mensagem fixa; assunto fora da reforma vira mensagem fixa de redirecionamento (ADR-007).
7. **Versões de dependência vêm do gerenciador de pacotes** (`npm view`, lockfile), nunca da memória do modelo.
8. **Dados pessoais:** número de telefone e conteúdo de mensagem não vão para log em claro (LGPD).

## Arquitetura (resumo — detalhes em docs/decisoes.md)

```
WhatsApp ⇄ Evolution API (Cloudfy) ──webhook──▶ /api/whatsapp/webhook (server route)
                                              │
Simulador web (/simulador) ──────────────────▶│
                                              ▼
                                  src/core/ (TypeScript puro, sem I/O)
                                  answerQuestion() → buildPrompt(base inteira) → renderAnswer()
                                              │            │
                                  src/adapters/llm       knowledge/ (base com fonte)
                                  (Gemini + busca Google)
                                  src/adapters/evolution
```

- `src/core/` — regra de negócio **pura e testável**: normalizar pergunta, tratar saudação, montar o prompt com a base inteira, conferir citações e fontes, formatar resposta para WhatsApp.
- `src/adapters/` — tudo que fala com o mundo externo (Evolution API, LLM). Sempre atrás de uma interface, com _mock_ nos testes, timeout e fallback.
- `knowledge/` — base de conhecimento versionada, um trecho por dispositivo legal.

## Convenções

- **Commits:** Conventional Commits em português, imperativo, minúsculo — `feat(core): adiciona recuperação por BM25`. Um commit = uma mudança lógica.
- **Testes:** `vitest` em `src/**/*.test.ts`; rodar com `npm test`. Nenhuma chamada de rede em teste unitário.
- **Tipos:** TypeScript estrito; entradas externas (webhook, resposta do LLM) validadas com `zod`.
- **Prompts usados no desenvolvimento** que geraram código relevante vão para `prompts/`, e o resultado (o que a IA errou, o que a revisão pegou) para `docs/HISTORY-IA.md`.

## Comandos

```bash
bun install --frozen-lockfile   # instala dependências exatamente como no bun.lock
npm run dev                     # servidor local
npm test                        # suíte de testes
npm run lint                    # lint
# avaliação do conjunto-ouro: em revisão desde o ADR-007 (passa a chamar o LLM de verdade)
npm run build                   # build de produção
```
