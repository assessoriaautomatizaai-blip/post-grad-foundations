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

**H04 🟨 Base inicial**
- [x] Rascunho com 29 trechos extraídos do Planalto (`knowledge/rascunho.json`, gerado por `scripts/planalto/`)
- [ ] Cada trecho conferido no texto oficial pelo autor — checklist em `docs/conferencia-base.md`
- [ ] Trechos conferidos movidos para `knowledge/base.json`

**H05 ⬜ Recuperação BM25**
Como usuário, quero que minha pergunta encontre o artigo certo, mesmo com acentos e caixa diferentes.
- [ ] Normalização: minúsculas, sem acento, sem pontuação, remoção de *stopwords* em português
- [ ] Devolve os `k` trechos mais relevantes com escore, em ordem decrescente
- [ ] Determinístico: mesma pergunta → mesmo resultado
- [ ] Testes com base-fixture pequena (não depende da base real)

**H06 ⬜ Decisão responder × recusar**
Como usuário, quero que o agente admita quando não sabe, em vez de inventar.
- [ ] Escore máximo < `RETRIEVAL_MIN_SCORE` → resposta de recusa padrão, **sem chamar o LLM**
- [ ] Pergunta vazia ou só saudação → mensagem de boas-vindas com exemplos de pergunta
- [ ] Limiar calibrado com o conjunto-ouro (H11), valor e justificativa registrados em ADR-004

---

## v0.3.0 — Geração e simulador

**H07 ⬜ Geração restrita aos trechos (Gemini)**
- [ ] Prompt de sistema versionado em `src/core/prompts/`, exigindo resposta só com base nos trechos e citação no formato `(Norma, dispositivo)`
- [ ] Adaptador de LLM atrás de interface; *mock* nos testes
- [ ] Saída validada: resposta sem nenhuma citação de trecho recuperado → substituída por recusa
- [ ] Timeout e erro do provedor → mensagem de fallback, nunca erro para o usuário
- [ ] Aviso fixo "informativo, não substitui orientação profissional" ao fim de toda resposta

**H08 ⬜ Simulador web**
Como avaliador, quero testar o agente no navegador, sem WhatsApp.
- [ ] Página `/simulador` com campo de pergunta e histórico da sessão
- [ ] Usa exatamente a mesma função do núcleo que o webhook usa
- [ ] Mostra as fontes citadas em destaque

---

## v0.4.0 — WhatsApp e avaliação

**H09 ⬜ Webhook da Evolution API**
- [ ] Rota `POST /api/whatsapp/webhook` aceita só requisições com o segredo correto (senão 401)
- [ ] *Payload* validado com `zod`; evento que não é mensagem de texto recebida → ignorado com 200
- [ ] Ignora mensagens enviadas pelo próprio número e mensagens de grupo
- [ ] Mesma mensagem (mesmo id) entregue duas vezes → respondida uma vez só
- [ ] Testes com *payloads* de exemplo salvos em fixture (sem rede)

**H10 ⬜ Envio da resposta**
- [ ] Adaptador `sendText` da Evolution API com timeout; falha registrada sem dado pessoal em claro
- [ ] Resposta longa quebrada em mensagens de até [A CONFERIR] caracteres

**H11 ⬜ Conjunto-ouro e avaliação**
- [ ] `eval/perguntas.json` com ≥ 20 perguntas: pergunta, `ids` esperados ou `fora_do_escopo: true`
- [ ] Pelo menos 5 perguntas fora do escopo (ex.: imposto de renda, cálculo de caso concreto)
- [ ] `npm run eval` gera relatório com recall@3 e taxa de abstenção correta
- [ ] Resultado registrado no README (com data)

**H12 ⬜ Teste do produto montado**
- [ ] Pergunta real enviada pelo WhatsApp → resposta com fonte; registrar GIF ou print (sem número de telefone visível)

---

## v1.0.0 — Entrega

**H13 ⬜ README final** — descrição, arquitetura (Mermaid), pré-requisitos, instalação, variáveis de ambiente, uso (simulador e WhatsApp), testes, avaliação, tecnologias incluindo **modelos de IA e assistentes de código**, "Como a IA foi usada", "Limitações e próximos passos", licença.

**H14 ⬜ Revisão de entrega**
- [ ] Varredura de segredos no histórico (`gitleaks`)
- [ ] README conferido contra o código (todo comando e exemplo executado de fato)
- [ ] Clone limpo: instalar, testar, rodar o simulador só seguindo o README
- [ ] ≥ 10 commits significativos em Conventional Commits
- [ ] `LICENSE` presente; tag `v1.0.0`; repositório **público**

**H15 ⬜ Fórum N5** — rascunho da postagem (5 itens) e da réplica a um colega, para aprovação do autor.
