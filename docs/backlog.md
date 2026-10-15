# Backlog

> Cada história tem critérios de aceite **testáveis**. Os testes de aceite são escritos e aprovados pelo autor **antes** da implementação (ver CLAUDE.md, regra 4).
> Estado: ⬜ a fazer · 🟨 em andamento · ✅ feito

## Releases

| Versão | Meta | Data-alvo |
|---|---|---|
| `v0.1.0` | Base do projeto: documentação, `.gitignore`, estrutura de pastas | 14/10 |
| `v0.2.0` | Núcleo: base de conhecimento + recuperação + decisão responder × recusar (sem LLM) | 15/10 |
| `v0.3.0` | Geração com LLM + simulador web | 16/10 |
| `v0.4.0` | Canal WhatsApp (Evolution API) + conjunto-ouro | 17/10 |
| `v1.0.0` | Revisão, README final, clone limpo, licença, repositório público | 18/10 |
| — | Postagem no fórum + réplica a um colega | 19/10 até 12h |

---

## v0.1.0 — Base

**H01 ✅ Documentos de base** — escopo, backlog, decisões, `CLAUDE.md`, `.gitignore` com `.env`, `.env.example`.
- [x] `.env` e `.env.*` ignorados; `.env.example` versionado
- [x] Documentos aprovados pelo autor

**H02 ✅ Estrutura de pastas e primeiro teste**
- [x] Pastas `src/core/`, `src/adapters/`, `knowledge/`, `eval/`, `prompts/`
- [x] `npm test` roda e passa com ao menos um teste real (`tokenize`, 6 casos — adianta a normalização da H05)

---

## v0.2.0 — Núcleo (sem LLM)

**H03 ✅ Formato da base de conhecimento**
Como mantenedor, quero cada dispositivo legal como um trecho com metadados, para citar a fonte exata.
- [x] Cada trecho tem: `id` estável, `norma`, `dispositivo`, `texto`, `url_fonte`, `data_referencia`
- [x] Esquema validado com `zod`; trecho sem fonte ou sem data **falha** a validação
- [x] Teste: carregar a base inteira sem erro; `id` duplicado é rejeitado
- [x] Além do pedido: fonte só `https` em `planalto.gov.br`, data inexistente rejeitada, campo desconhecido rejeitado, erro aponta trecho e campo (18 casos)

**H04 ✅ Base inicial**
- [x] Rascunho com 29 trechos extraídos do Planalto (gerado por `scripts/planalto/`)
- [x] Cada trecho conferido no texto oficial pelo autor — checklist em `docs/conferencia-base.md`
- [x] Trechos conferidos movidos para `knowledge/base.json` (29 trechos; abaixo da meta de 30–50, acima do mínimo de 20 do plano de corte)

**H05 ✅ Recuperação BM25**
Como usuário, quero que minha pergunta encontre o artigo certo, mesmo com acentos e caixa diferentes.
- [x] Normalização: minúsculas, sem acento, sem pontuação, remoção de *stopwords* em português
- [x] Devolve os `k` trechos mais relevantes com escore, em ordem decrescente
- [x] Determinístico: mesma pergunta → mesmo resultado
- [x] Testes com base-fixture pequena (não depende da base real)
- [x] Além do pedido: sinônimos (nome do tributo → artigo da Constituição) e 5 perguntas reais contra a base conferida
- [ ] 4 sinônimos [A CONFERIR] na Constituição (ICMS, ISS, IPI, Cofins) — `docs/conferencia-base.md`
- [x] Lacuna de teste achada por mutação: borda de palavra nos sinônimos ("155, II" × "155, III") — teste novo aprovado e adicionado

**H06 ✅ Decisão responder × recusar**
Como usuário, quero que o agente admita quando não sabe, em vez de inventar.
- [x] Abaixo dos mínimos → resposta de recusa padrão, **sem chamar o LLM** (`decide` nem recebe o modelo)
- [x] Pergunta vazia ou só saudação → mensagem de boas-vindas com exemplos de pergunta
- [x] Mudança de desenho: só o escore não separava dentro × fora do escopo; a decisão usa **escore mínimo e cobertura mínima** (ADR-004). Para isso, a busca ganhou palavras de pergunta como vazias, redução de plural e sinônimos de linguagem
- [ ] Limiar calibrado com o conjunto-ouro (H11) — valores atuais (0,5 e 0,3) são provisórios; margem estreita registrada no ADR-004
- [ ] Recusas indevidas conhecidas, para a H11: "Advogado paga menos imposto?" (cobertura 0,18) e "Quem fixa a alíquota do IBS?" (0,23)

---

## v0.3.0 — Geração e simulador

**H07 ✅ Geração restrita aos trechos (Gemini)**
- [x] Prompt de sistema versionado em `src/core/prompts/sistema.ts`, exigindo resposta só com base nos trechos
- [x] Citação pelo `id` do trecho (`[lc214-art31]`), verificável com exatidão; o núcleo troca pelo formato `(Norma, dispositivo)` e lista as fontes com link
- [x] Adaptador de LLM atrás de interface (`LlmAdapter`); modelo e cliente falsos nos testes
- [x] Saída validada: sem citação, com `id` não recuperado ou vazia → recusa, sem mostrar o texto do modelo
- [x] Timeout (15 s) e erro do provedor → mensagem de fallback, nunca erro para o usuário; o erro vai para o log do servidor
- [x] Aviso fixo "informativo, não substitui orientação profissional" ao fim de toda resposta
- [x] Pergunta isolada entre delimitadores e neutralizada (proteção contra instrução escondida na pergunta)
- [ ] **Execução real com o Gemini:** pendente — sem chave configurada neste ambiente; feita junto com a H08 ou a H12
- [x] Teste para `registrarErro` — coberto na H08 (`src/server/agente.test.ts`)

**H08 ✅ Simulador web**
Como avaliador, quero testar o agente no navegador, sem WhatsApp.
- [x] Página `/simulador` com campo de pergunta e histórico da sessão
- [x] Usa exatamente a mesma função do núcleo que o webhook usa (`createAgente().perguntar`, em `src/server/agente.ts`)
- [x] Mostra as fontes citadas em destaque, como links para o Planalto
- [x] Chave do Gemini, base e prompt só no servidor — conferido no código gerado para o navegador
- [x] Execução real no app montado: boas-vindas, recusa e falha amigável (sem chave) funcionando
- [ ] Resposta real do Gemini no simulador — depende da `GEMINI_API_KEY` nos segredos do Lovable

---

## v0.4.0 — WhatsApp e avaliação

**H09 ✅ Webhook da Evolution API**
- [x] Rota `POST /api/whatsapp/webhook` aceita só requisições com o segredo correto no cabeçalho `x-webhook-secret` (senão 401; sem segredo configurado, 503; outros métodos, 405)
- [x] *Payload* validado com `zod`; evento que não é mensagem de texto recebida → ignorado com 200
- [x] Ignora mensagens enviadas pelo próprio número (evita loop), de grupo, de status, antigas (> 5 min) e sem texto
- [x] Mesma mensagem (mesmo id) entregue duas vezes → respondida uma vez só; após falha no envio, a nova tentativa da Evolution é processada
- [x] Testes com *payloads* de exemplo em fixture (sem rede), no formato do código-fonte da Evolution API
- [x] Execução real da rota no servidor local, com `curl`: autenticação, filtros e falha no envio conferidos
- [x] Envio da resposta — ligado ao adaptador da Evolution na H10

**H10 ✅ Envio da resposta**
- [x] Adaptador `sendText` da Evolution API v2 (`POST /message/sendText/{instância}`, cabeçalho `apikey`, corpo `{ number, text }` — conferido no código-fonte) com timeout de 10 s e cancelamento; erro sem chave, número ou texto
- [x] Resposta longa quebrada em mensagens de até 1.600 caracteres (limite de leitura no celular), preferindo parágrafos e sem cortar palavras
- [x] `EVOLUTION_API_URL` precisa ser `https`
- [x] Ligado ao webhook, no lugar do envio provisório; conferido no servidor local
- [x] Checagem de tipos (`tsc`): 2 testes aprovados tinham uma variável local `fetch` que referenciava a si mesma — renomeada para `buscar` com aprovação do autor, sem mudar asserção

**H11 ✅ Conjunto-ouro e avaliação**
- [x] `eval/perguntas.json` com 32 perguntas (22 dentro, 10 fora do escopo), separadas em calibração (21) e teste (11); gabarito aprovado pelo autor
- [x] 10 perguntas fora do escopo, 4 delas armadilhas com palavras da base (MEI, ICMS, IBS, imposto)
- [x] `npm run eval` gera `eval/relatorio.md` com recall@3, respostas corretas, recusas indevidas e abstenção correta, por conjunto; a suíte exige 100% de abstenção fora do escopo
- [x] Calibração só com o conjunto de calibração; limites mantidos (ADR-004)
- [ ] Resultado registrado no README (com data) — na v1.0.0

**H12 ⬜ Teste do produto montado**
- [ ] Pergunta real enviada pelo WhatsApp → resposta com fonte; registrar GIF ou print (sem número de telefone visível)

---

## v1.0.0 — Entrega

**H13 ✅ README final** — descrição, arquitetura (Mermaid), pré-requisitos, instalação, variáveis de ambiente, uso (simulador e WhatsApp), testes, avaliação, tecnologias incluindo **modelos de IA e assistentes de código**, "Como a IA foi usada", "Limitações e próximos passos", licença.

**H14 🟨 Revisão de entrega**
- [x] Varredura de segredos nas 10.843 linhas adicionadas em todo o histórico (padrões do gitleaks, que não estava instalado; controle positivo com segredos falsos): nenhum segredo; nenhum `.env` jamais commitado
- [x] README conferido contra o código: comandos executados num clone limpo do GitHub; exemplo do webhook corrigido (503, não 401, com o `.env.example`)
- [x] Clone limpo: instalar, testar, avaliar, construir e rodar o servidor seguindo só o README
- [x] ≥ 10 commits significativos em Conventional Commits (64 do autor, todos no padrão)
- [x] 48 links relativos da documentação conferidos, sem link quebrado
- [x] `npm run lint` voltou a passar; página inicial e título do site deixaram de ser os do template
- [x] `LICENSE` (MIT)
- [ ] Tag `v1.0.0` — depois da H12
- [ ] Repositório **público** — decisão do autor

**H15 ⬜ Fórum N5** — rascunho da postagem (5 itens) e da réplica a um colega, para aprovação do autor.
