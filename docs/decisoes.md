# Decisões técnicas (ADRs)

> Formato curto: contexto → decisão → consequências. Estado: **Proposta** (aguarda o autor) · **Aceita** · **Substituída**.

---

## ADR-001 — Núcleo em TypeScript puro, separado dos adaptadores

**Estado:** Proposta

**Contexto.** O curso exige testes automatizados passando e um projeto que terceiros reproduzam. O WhatsApp (Evolution API) e o LLM são dependências externas, instáveis e difíceis de testar.

**Decisão.** Toda a regra de negócio fica em `src/core/`, sem I/O: normalização, recuperação, decisão responder × recusar, montagem do prompt, validação e formatação da resposta. Evolution API e LLM ficam em `src/adapters/`, atrás de interfaces injetadas no núcleo.

**Consequências.**
- ✅ O núcleo é testado com `vitest` sem rede e sem chave.
- ✅ O simulador web e o webhook do WhatsApp usam a mesma função, então o que o avaliador testa é o que roda em produção.
- ⚠️ Exige disciplina: o Lovable tende a gerar lógica dentro dos componentes React. Revisar cada mudança vinda do Lovable.

---

## ADR-002 — Evolution API chamando diretamente o Lovable; n8n fora do MVP

**Estado:** Proposta

**Contexto.** O fluxo poderia ser `Evolution → n8n → LLM → Evolution` ou `Evolution → rota do servidor no Lovable → Evolution`. Fluxos do n8n são editados visualmente, versionados como JSON opaco e difíceis de cobrir com testes automatizados.

**Decisão.** A Evolution API roda hospedada na **Cloudfy**. No MVP, o webhook da Evolution API aponta para uma **rota de servidor do próprio projeto** (`/api/whatsapp/webhook`). O n8n só entra se houver necessidade concreta (ex.: fila, reenvio, integração com outro sistema) — nesse caso, o JSON do workflow é exportado e versionado em `n8n/`.

**Consequências.**
- ✅ Um só repositório, uma só linguagem, tudo testável e versionado.
- ⚠️ A rota de servidor precisa responder rápido à Evolution API; se a geração demorar, pode ser preciso responder 200 imediatamente e processar depois. [A CONFERIR na implementação]

---

## ADR-003 — Gemini 3.8 Flash como modelo de linguagem do produto

**Estado:** Aceita (14/10/2026) — substitui a versão anterior desta ADR, que escolhia Claude Opus 5.5

**Contexto.** A resposta é gerada por um LLM a partir dos trechos recuperados. Critérios: custo por mensagem, qualidade em português jurídico, obediência à instrução de responder só com base nos trechos, latência no WhatsApp e tratamento dos dados dos usuários (LGPD).

**Opções comparadas** (preços do modo Standard por 1M de tokens, entrada/saída; ver [estimativa](estimativa.md)):

| Modelo | Preço | Observação |
|---|---|---|
| Claude Opus 5.5 | US$ 4,00 / 20,00 | Escolha inicial; ~5× mais caro que o escolhido |
| **Gemini 3.8 Flash** | **US$ 0,75 / 3,75 até 31/12/2026; US$ 1,50 / 7,50 a partir de 01/01/2027** | **Escolhido pelo autor** |
| Gemini 3.5 Flash-Lite | US$ 0,30 / 2,50 | Mais barato, modelo de geração anterior |
| Claude Haiku 5.5 | US$ 0,10 / 0,50 | O mais barato por token entre os comparados |

**Decisão.** Gemini **3.8 Flash** (`gemini-3.8-flash`, configurável por `GEMINI_MODEL`), via SDK oficial **`@google/genai`** (conferido no npm em 14/10/2026), **no plano pago**. Chave em `GEMINI_API_KEY`, só no `.env` e nos segredos do Lovable.

**Por que o plano pago, mesmo existindo plano gratuito.** Segundo os termos da Google, no plano gratuito o conteúdo enviado **é usado para melhorar os produtos** da Google; no pago, não. As perguntas chegam de pessoas reais pelo WhatsApp, então o plano gratuito é usado no máximo em desenvolvimento, com perguntas sintéticas, nunca com mensagens reais.

**Consequências.**
- ✅ O provedor fica atrás da interface `LlmAdapter` (ADR-001), com timeout e fallback; trocar de modelo não muda o núcleo, e o conjunto-ouro (H11) permite comparar modelos com a mesma régua.
- ⚠️ O preço é promocional e **dobra em 01/01/2027** — registrado na estimativa.
- ⚠️ Preços, IDs de modelo e termos de uso são fatos voláteis: conferidos na página oficial em 14/10/2026 e conferidos de novo antes da entrega.

---

## ADR-004 — Recuperação lexical (BM25) com recusa por limiar no código

**Estado:** Proposta

**Contexto.** Em domínio jurídico, o vocabulário da pergunta costuma coincidir com o da lei ("CBS", "IBS", "Simples Nacional", "split payment"). Busca semântica com embeddings exige outro serviço, chave e um banco vetorial, e não é determinística entre versões do modelo.

**Decisão.** No MVP, recuperação **BM25** implementada no projeto, sobre trechos de um dispositivo legal cada. Se o maior escore ficar abaixo de `RETRIEVAL_MIN_SCORE`, o agente **recusa sem chamar o LLM**. O limiar é calibrado com o conjunto-ouro (H11), e o valor escolhido é registrado aqui com a data.

**Consequências.**
- ✅ Determinístico, roda offline, testável; a recusa não depende do modelo "obedecer" ao prompt.
- ⚠️ Perde sinônimos e paráfrases ("imposto novo" × "IBS"). Mitigação no MVP: mapa de sinônimos em `src/core/sinonimos.ts`, que liga o nome do tributo às expressões da lei (ex.: `ibs → "156-A"`). Um trecho que contém a expressão passa a ser encontrado também pelo nome; o texto do trecho não é alterado. Cada ligação tem fonte. Busca híbrida (BM25 + embeddings) fica para v2.
- Implementação (14/10/2026): BM25 clássico (k1 = 1,2; b = 0,75), sem dependência externa; casamento de expressões por palavra inteira.
- Limiar calibrado: [A PREENCHER após H11]

---

## ADR-005 — Base de conhecimento como arquivos versionados, um trecho por dispositivo

**Estado:** Proposta

**Contexto.** Fatos tributários mudam (regulamentações novas, transição até 2033). A resposta precisa dizer de onde veio e de quando é a informação.

**Decisão.** A base vive em `knowledge/` como JSON versionado no Git, validado por esquema `zod`. Cada trecho tem `id` estável, `norma`, `dispositivo`, `texto`, `url_fonte` (Planalto) e `data_referencia`. Nenhum trecho entra sem conferência humana no texto oficial.

**Consequências.**
- ✅ Toda mudança na base aparece no histórico do Git; a citação é exata.
- ⚠️ Atualização é manual — limitação declarada no README.
- ⚠️ Os textos das normas são públicos (lei não tem proteção autoral — Lei 9.610/1998, art. 8º, IV) [A CONFERIR], mas resumos e comentários de terceiros não entram na base.

---

## ADR-006 — Segurança e privacidade do canal

**Estado:** Proposta

**Decisão.**
- O webhook exige segredo compartilhado (`WEBHOOK_SECRET`); sem ele, 401.
- Payload validado com `zod`; só mensagens de texto recebidas, fora de grupos, são processadas.
- Deduplicação por id de mensagem.
- Logs sem número de telefone nem texto da mensagem em claro.
- Chaves só em `.env` (local) e nos segredos do Lovable (produção).

**Consequências.** Reduz abuso do endpoint e exposição de dados pessoais (LGPD). Não há limitação de taxa no MVP — declarada como limitação.
