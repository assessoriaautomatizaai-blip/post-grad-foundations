# Decisões técnicas (ADRs)

> Formato curto: contexto → decisão → consequências. Estado: **Proposta** (aguarda o autor) · **Aceita** · **Substituída**.

---

## ADR-001 — Núcleo em TypeScript puro, separado dos adaptadores

**Estado:** Aceita (14/10/2026) — implementada nas H02 a H08

**Contexto.** O curso exige testes automatizados passando e um projeto que terceiros reproduzam. O WhatsApp (Evolution API) e o LLM são dependências externas, instáveis e difíceis de testar.

**Decisão.** Toda a regra de negócio fica em `src/core/`, sem I/O: normalização, recuperação, decisão responder × recusar, montagem do prompt, validação e formatação da resposta. Evolution API e LLM ficam em `src/adapters/`, atrás de interfaces injetadas no núcleo.

**Consequências.**

- ✅ O núcleo é testado com `vitest` sem rede e sem chave.
- ✅ O simulador web e o webhook do WhatsApp usam a mesma função, então o que o avaliador testa é o que roda em produção.
- ⚠️ Exige disciplina: o Lovable tende a gerar lógica dentro dos componentes React. Revisar cada mudança vinda do Lovable.

---

## ADR-002 — Evolution API chamando diretamente o Lovable; n8n fora do MVP

**Estado:** Aceita (15/10/2026) — implementada nas H09 e H10

**Contexto.** O fluxo poderia ser `Evolution → n8n → LLM → Evolution` ou `Evolution → rota do servidor no Lovable → Evolution`. Fluxos do n8n são editados visualmente, versionados como JSON opaco e difíceis de cobrir com testes automatizados.

**Decisão.** A Evolution API roda hospedada na **Cloudfy**. No MVP, o webhook da Evolution API aponta para uma **rota de servidor do próprio projeto** (`/api/whatsapp/webhook`). O n8n só entra se houver necessidade concreta (ex.: fila, reenvio, integração com outro sistema) — nesse caso, o JSON do workflow é exportado e versionado em `n8n/`.

**Consequências.**

- ✅ Um só repositório, uma só linguagem, tudo testável e versionado.
- A rota processa a mensagem dentro da própria requisição. Conferido na H09 e na H10: a Evolution espera até 30 s pelo webhook (`webhook.controller.ts`), e o pior caso aqui é o tempo limite do Gemini (15 s) mais o do envio (10 s por mensagem). Se passar disso, a Evolution reenvia e a deduplicação evita resposta dupla.

---

## ADR-003 — Gemini 3.8 Flash como modelo de linguagem do produto

**Estado:** Aceita (14/10/2026) — substitui a versão anterior desta ADR, que escolhia Claude Opus 5.5

**Contexto.** A resposta é gerada por um LLM a partir dos trechos recuperados. Critérios: custo por mensagem, qualidade em português jurídico, obediência à instrução de responder só com base nos trechos, latência no WhatsApp e tratamento dos dados dos usuários (LGPD).

**Opções comparadas** (preços do modo Standard por 1M de tokens, entrada/saída; ver [estimativa](estimativa.md)):

| Modelo                | Preço                                                                      | Observação                                     |
| --------------------- | -------------------------------------------------------------------------- | ---------------------------------------------- |
| Claude Opus 5.5       | US$ 4,00 / 20,00                                                           | Escolha inicial; ~5× mais caro que o escolhido |
| **Gemini 3.8 Flash**  | **US$ 0,75 / 3,75 até 31/12/2026; US$ 1,50 / 7,50 a partir de 01/01/2027** | **Escolhido pelo autor**                       |
| Gemini 3.5 Flash-Lite | US$ 0,30 / 2,50                                                            | Mais barato, modelo de geração anterior        |
| Claude Haiku 5.5      | US$ 0,10 / 0,50                                                            | O mais barato por token entre os comparados    |

**Decisão.** Gemini **3.8 Flash** (`gemini-3.8-flash`, configurável por `GEMINI_MODEL`), via SDK oficial **`@google/genai`** (conferido no npm em 14/10/2026), **no plano pago**. Chave em `GEMINI_API_KEY`, só no `.env` e nos segredos do Lovable.

**Implementação (14/10/2026, H07).** `@google/genai` 2.29.1 (instalada pelo `bun`, que exige versão publicada há mais de 24 h; esta tinha 29 h). Forma de chamada e nomes de campo conferidos na documentação do pacote e nos tipos instalados, não na memória do modelo. Parâmetros: `maxOutputTokens` 1024 (no Gemini 3.x o raciocínio interno conta neste limite), `temperature` 0,2 e tempo limite de 15 s com cancelamento da requisição. O modelo cita cada trecho pelo `id` entre colchetes; o núcleo recusa a resposta se houver `id` fora dos trechos recuperados.

**Por que o plano pago, mesmo existindo plano gratuito.** Segundo os termos da Google, no plano gratuito o conteúdo enviado **é usado para melhorar os produtos** da Google; no pago, não. As perguntas chegam de pessoas reais pelo WhatsApp, então o plano gratuito é usado no máximo em desenvolvimento, com perguntas sintéticas, nunca com mensagens reais.

**Consequências.**

- ✅ O provedor fica atrás da interface `LlmAdapter` (ADR-001), com timeout e fallback; trocar de modelo não muda o núcleo, e o conjunto-ouro (H11) permite comparar modelos com a mesma régua.
- ⚠️ O preço é promocional e **dobra em 01/01/2027** — registrado na estimativa.
- ⚠️ Preços, IDs de modelo e termos de uso são fatos voláteis: conferidos na página oficial em 14/10/2026 e conferidos de novo antes da entrega.

---

## ADR-004 — Recuperação lexical (BM25) com recusa por limiar no código

**Estado:** Substituída pelo [ADR-007](#adr-007--o-gemini-lê-a-base-inteira-e-complementa-com-busca-na-web) em 15/10/2026 (antes: aceita em 14/10/2026, implementada nas H05 e H06, calibrada na H11)

**Contexto.** Em domínio jurídico, o vocabulário da pergunta costuma coincidir com o da lei ("CBS", "IBS", "Simples Nacional", "split payment"). Busca semântica com embeddings exige outro serviço, chave e um banco vetorial, e não é determinística entre versões do modelo.

**Decisão.** No MVP, recuperação **BM25** implementada no projeto, sobre trechos de um dispositivo legal cada. Se o maior escore ficar abaixo de `RETRIEVAL_MIN_SCORE`, o agente **recusa sem chamar o LLM**. O limiar é calibrado com o conjunto-ouro (H11), e o valor escolhido é registrado aqui com a data.

**Consequências.**

- ✅ Determinístico, roda offline, testável; a recusa não depende do modelo "obedecer" ao prompt.
- ⚠️ Perde sinônimos e paráfrases ("imposto novo" × "IBS"). Mitigação no MVP: mapa de sinônimos em `src/core/sinonimos.ts`, que liga o nome do tributo às expressões da lei (ex.: `ibs → "156-A"`). Um trecho que contém a expressão passa a ser encontrado também pelo nome; o texto do trecho não é alterado. Cada ligação tem fonte. Busca híbrida (BM25 + embeddings) fica para v2.
- Implementação (14/10/2026): BM25 clássico (k1 = 1,2; b = 0,75), sem dependência externa; casamento de expressões por palavra inteira.
- **Revisão em 14/10/2026 (H06): só o escore não basta.** Medido na base real, nenhum limiar de escore separava as perguntas: "O que é o IBS?" (dentro) teve 0,67 e "Qual o valor do IPVA do meu carro?" (fora) teve 3,39. A decisão passou a exigir dois mínimos:
  - **escore mínimo** (BM25) — descarta casamentos fracos;
  - **cobertura mínima** — fração da pergunta, ponderada pelo IDF, que o trecho contém. Termo da pergunta que não existe na base pesa o máximo contra a cobertura: é isso que recusa o IPVA.
  - Ajustes na busca que tornaram a cobertura útil: palavras de pergunta como vazias ("qual" casava com "segundo o qual"), redução de plural ("advogado" × "advogados") e sinônimos de linguagem ("remédio" → "medicamentos").
- **Limites provisórios:** escore ≥ 0,5 e cobertura ≥ 0,3 (`DECISAO_PADRAO`). Em 20 perguntas de teste: 8/8 fora do escopo recusadas; 10/12 dentro respondidas; os 2 erros são recusas indevidas (lado seguro).
- ⚠️ **Margem estreita:** a pergunta fora do escopo com maior cobertura ("Como declarar o imposto de renda?") ficou em 0,28, contra o mínimo de 0,30. Calibração definitiva na H11, com o conjunto-ouro.
- **Calibração (15/10/2026, H11), só com o conjunto de calibração** (21 perguntas; o de teste, 11, ficou separado): busca em grade de escore mínimo, cobertura mínima e peso dos termos desconhecidos, com a restrição de **nenhuma resposta fora do escopo**. A melhor configuração acertou 10/15 contra 9/15 dos limites atuais, exigindo mudança de código — com 15 perguntas, um acerto a mais está no ruído e seria ajuste viciado. **Limites mantidos: escore ≥ 0,5 e cobertura ≥ 0,3.**
- **Diagnóstico das falhas: vocabulário, não limiar.** Verbos e palavras comuns ausentes da base ("significa", "pagar", "posso", "comprei") pesam como termo principal; flexão verbal ("compensar" × "compensado"; "aproveitar crédito" × "apropriar créditos"); termo onipresente ("IBS" está em 19 dos 29 trechos) piora o ranking; ambiguidade legítima ("saúde" no Imposto Seletivo e na redução de 60%). Caminho para v2: busca híbrida (BM25 + embeddings), flexão verbal e lista ampliada de palavras vazias — avaliados contra o mesmo conjunto-ouro.
- **Resultado** (`npm run eval`, `eval/relatorio.md`): abstenção fora do escopo **100%** na calibração e no teste; recall@3 73% (calibração) e 86% (teste); respostas corretas 60% e 57%. O critério de recall ≥ 80% do escopo **não foi atingido na calibração** (17/22 = 77% no total).
- ⚠️ **Risco:** uma pergunta ("Serviços de saúde vão pagar menos imposto?") passou com trecho errado (Imposto Seletivo, "prejudiciais à saúde"). O prompt manda responder só com os trechos; o comportamento real do modelo nesse caso fica para a verificação com o Gemini.

---

## ADR-005 — Base de conhecimento como arquivos versionados, um trecho por dispositivo

**Estado:** Aceita (14/10/2026) — implementada nas H03 e H04

**Contexto.** Fatos tributários mudam (regulamentações novas, transição até 2033). A resposta precisa dizer de onde veio e de quando é a informação.

**Decisão.** A base vive em `knowledge/` como JSON versionado no Git, validado por esquema `zod`. Cada trecho tem `id` estável, `norma`, `dispositivo`, `texto`, `url_fonte` (Planalto) e `data_referencia`. Nenhum trecho entra sem conferência humana no texto oficial.

**Consequências.**

- ✅ Toda mudança na base aparece no histórico do Git; a citação é exata.
- ⚠️ Atualização é manual — limitação declarada no README.
- ⚠️ Os textos das normas são públicos (Lei 9.610/1998, art. 8º, IV: não são objeto de proteção como direitos autorais "os textos de tratados ou convenções, leis, decretos, regulamentos, decisões judiciais e demais atos oficiais" — conferido no Planalto em 15/10/2026), mas resumos e comentários de terceiros não entram na base.
- **Ampliação (15/10/2026, ADR-007):** 67 trechos citados pela base do APP 2 entraram com conferência **automática** contra o texto vigente (67/67) e conferência humana **pendente** — exceção aprovada pelo autor ao "nenhum trecho entra sem conferência humana", registrada em `docs/conferencia-base.md`. O complemento da web (ADR-007) não entra na base: é resultado de busca, mostrado à parte.

---

## ADR-006 — Segurança e privacidade do canal

**Estado:** Aceita (15/10/2026) — implementada nas H09 e H10

**Decisão.**

- O webhook exige segredo compartilhado (`WEBHOOK_SECRET`), enviado pela Evolution no cabeçalho `x-webhook-secret` (campo `headers` da configuração do webhook) e comparado em tempo constante; sem ele, 401. Sem segredo configurado no servidor, o webhook recusa tudo (503). Alternativa, se a versão da Evolution na Cloudfy não enviar cabeçalhos: o recurso `jwt_key` do próprio webhook da Evolution (token JWT HS256 de 10 minutos no cabeçalho `Authorization`).
- Payload validado com `zod`; só mensagens de texto recebidas, fora de grupos, são processadas.
- Deduplicação por id de mensagem.
- Logs sem número de telefone nem texto da mensagem em claro.
- Chaves só em `.env` (local) e nos segredos do Lovable (produção).

**Detalhes conferidos no código-fonte da Evolution API (15/10/2026, H09).**

- As mensagens **enviadas** pela instância também chegam como `messages.upsert`, com `fromMe: true` (issue #1340): ignorá-las é o que evita o agente responder a si mesmo em loop.
- A Evolution **reenvia** o webhook quando a chamada falha ou passa de 30 s: a deduplicação por id é obrigatória, e o handler devolve 500 só quando o envio falhou (para a nova tentativa ser útil).
- Conversa individual é `@s.whatsapp.net` ou `@lid` (endereçamento novo do WhatsApp); grupos (`@g.us`), status (`status@broadcast`) e canais são ignorados.
- Mensagens com mais de 5 minutos são ignoradas (reenvio de histórico após reconexão).

**Envio (15/10/2026, H10).** `POST {EVOLUTION_API_URL}/message/sendText/{EVOLUTION_INSTANCE}`, cabeçalho `apikey`, corpo `{ number, text }` (na v1 era `textMessage`; conferido em `sendMessage.dto.ts` e `sendMessage.router.ts`). O `number` recebe o identificador como veio do webhook: a função `createJid` da Evolution aceita `@s.whatsapp.net` e `@lid` sem alteração. URL obrigatoriamente `https`. Respostas acima de 1.600 caracteres vão em várias mensagens, em ordem, uma de cada vez; se uma falhar, as seguintes não saem e o webhook devolve 500 para a Evolution tentar de novo.

**Consequências.** Reduz abuso do endpoint e exposição de dados pessoais (LGPD). Não há limitação de taxa no MVP — declarada como limitação. A deduplicação é em memória: com várias instâncias do servidor, uma duplicata rara ainda pode passar — também declarada como limitação.

---

## ADR-007 — O Gemini lê a base inteira e complementa com busca na web

**Estado:** Aceita pelo autor (15/10/2026) — implementada; avaliação com o Gemini pendente. Substitui o ADR-004.

**Contexto.**

- O autor testou o site publicado e quer um agente que **raciocine** e **não deixe o usuário sem resposta**. Com o ADR-004, o código só chamava o modelo quando a pergunta tinha palavras parecidas com as da lei: "Quando o ISS deixa de existir?" era recusada porque a lei diz "ficam extintos".
- Medição de 15/10/2026: ampliar a base (63 a 67 trechos do APP 2) com a busca por palavras **quebra a abstenção** (de 100% para 50% no teste: "Qual a previsão do tempo para amanhã?" casava com "previsão expressa"). Nenhum ajuste de limiar recupera 100% sem derrubar as respostas corretas para ~30%. O limite é do método (palavra), não do limiar.
- Fatos conferidos em 15/10/2026: o SDK `@google/genai` instalado tem a ferramenta `googleSearch` e devolve as fontes em `groundingMetadata.groundingChunks` (título e endereço). Na página oficial de preços, o `gemini-3.8-flash` custa US$ 0,75 (entrada) e US$ 3,75 (saída) por milhão de tokens até 31/12/2026, e a busca no Google tem **5.000 consultas grátis por mês** no plano pago (compartilhadas entre os modelos Gemini 3), depois US$ 14 por mil.

**Decisão.**

1. **O Gemini recebe a base inteira** em toda pergunta (96 trechos depois da ampliação — cerca de 42 mil caracteres) e a pergunta delimitada. Sai a busca BM25, o limiar e o mapa de sinônimos do caminho de produção.
2. **Busca no Google ligada** (`tools: [{ googleSearch: {} }]`) para completar o que a base não cobre. As fontes da busca voltam do adaptador junto com o texto.
3. **A resposta separa as origens:** o que vem da base cita o trecho pelo id (`[lc214-art31]`) e vira "(LC 214/2025, art. 31, caput)"; o que vem da web aparece em "_Complemento:_" e as fontes da web são listadas à parte, como **não conferidas**.
4. **Regras conferidas no código (não delegadas ao prompt):**
   - id citado que não existe na base **bloqueia a resposta inteira** — citação de lei inventada nunca chega ao usuário;
   - o "_Complemento:_" só aparece se a busca devolveu ao menos uma fonte; sem fonte, a parte é removida (seria memória do modelo);
   - resposta sem nenhuma citação da base e sem nenhuma fonte da web não é mostrada: vira mensagem fixa pedindo para reformular ou procurar um contador;
   - assunto fora da reforma: o modelo devolve a marca `[fora-do-tema]` e o código troca por uma mensagem fixa que explica o foco do agente e dá exemplos.
5. Saudação continua tratada no código, sem chamar o modelo.
6. Tempo limite do modelo: **50 s**, com raciocínio baixo no Gemini. Era 25 s, mas perguntas com busca na web passavam desse tempo no site publicado (27/10/2026). No WhatsApp, que saiu da entrega, a Evolution reenviaria o webhook depois de 30 s, e a deduplicação absorveria o reenvio.

**Consequências.**

- ✅ Entende paráfrase ("deixa de existir", "vai acabar", "vai sumir") sem lista de sinônimos; responde perguntas operacionais (notas fiscais, prazos, comunicados) com link.
- ✅ A garantia central muda de forma, mas continua no código: nenhuma citação de lei inventada; nenhum complemento sem fonte.
- ⚠️ **Muda a regra 5 e a regra 6 do `CLAUDE.md`** e o critério de abstenção do escopo (100% de recusa fora da base) — ver as novas redações.
- ⚠️ **Complemento da web não é conferido por pessoa.** Pode estar desatualizado ou ser de fonte fraca; por isso aparece separado, com link e o rótulo "não conferido". O código não julga a qualidade da página.
- ⚠️ **A avaliação passa a chamar o Gemini** (rede, chave e custo de centavos). Deixa de ser teste unitário: vira `npm run eval` manual, com a chave do `.env`. Os testes unitários continuam sem rede, com modelo falso.
- ⚠️ Custo por pergunta: a base inteira vai em cada chamada (96 trechos ≈ 10,4 mil tokens; com o prompt, ~11 mil de entrada) — ≈ US$ 0,011 por resposta até 31/12/2026 (ver `docs/estimativa.md`); a busca é grátis até 5.000 consultas por mês.
- **Conferido no primeiro teste real (15/10/2026, Lovable):** a busca funciona e os endereços vêm como redirecionamento do Google (`vertexaisearch.cloud.google.com/grounding-api-redirect/…`), longos e sem espaço — no simulador, eles estouravam o balão. Correção: o simulador mostra as fontes **só como links com nome** (o título que a busca devolve, ex.: "senado.leg.br", numerado se repetir) e o balão quebra palavras longas; o WhatsApp continua com o endereço, que lá é o que fica clicável.
- **Termos da Gemini API para a busca (ai.google.dev/gemini-api/terms, lidos em 15/10/2026):**
  - os links **não podem ser trocados nem resolvidos** para o endereço final ("não redirecionar o usuário para longe das páginas de destino"; proibido "usar meios automatizados para coletar links" ou "identificar páginas de destino") — por isso o redirecionamento é mostrado como veio, só com um nome legível;
  - ⚠️ **exigência pendente:** exibir o resultado "com as Sugestões de Busca associadas" (_Search Suggestions_) ao usuário que perguntou — ainda não implementado; no WhatsApp não há como mostrar o bloco em HTML que o Google fornece. [A CONFERIR com o autor: como cumprir no simulador e no WhatsApp, ou desligar a busca no WhatsApp];
  - ⚠️ os termos dizem para não "modificar" os resultados da busca; a conferência do ADR-007 troca o `[id]` pela citação legível e remove complemento sem fonte. [A CONFERIR a interpretação]
  - o Google guarda pergunta e resposta por 30 dias para gerar e depurar os resultados da busca (no plano pago, sob o adendo de processamento de dados) — registrar na política de privacidade.
- Alternativas descartadas: (a) Gemini respondendo de memória, sem busca — fato jurídico sem fonte, contra a proposta do projeto; (b) busca semântica com embeddings — exige outro serviço e banco vetorial, e não resolve "não ficar sem resposta"; (c) importar os textos explicativos do APP 2 — texto redigido por IA, com 11 pendências [A CONFERIR].
