# Registro do uso de IA

> Diário do desenvolvimento assistido por IA. Alimenta a seção "Como a IA foi usada" do README e os itens 3–5 do fórum do curso.
> Regra: **ganho de produtividade só se registra se for medido** (tempo real, nº de iterações). Estimativa é marcada como estimativa.

## Ferramentas

| Ferramenta | Papel |
|---|---|
| Claude Code (Claude Opus 5.5) | Leitura do material do curso, planejamento, documentação, implementação do núcleo e testes |
| Lovable | Geração da interface (simulador) e sincronização com o GitHub |

## Registro

### 14/10/2026 — Planejamento e documentos de base (v0.1.0)

- **Fase:** requisitos e arquitetura.
- **O que a IA fez:** leu o material do curso (enunciado do fórum, checklists de submissão das unidades 2 e 5, princípios de testes da unidade 4) e mapeou o que precisa ser entregue; propôs escopo, backlog com critérios de aceite, ADRs e o `CLAUDE.md`.
- **O que a revisão encontrou:**
  - O `.gitignore` gerado pelo template do Lovable **não ignorava `.env`** — risco de vazar chave da Evolution API ou do LLM. Corrigido antes de qualquer segredo existir, com exceção explícita para `.env.example`.
  - O repositório foi criado **privado**; o curso exige público na entrega — registrado no backlog (H14).
- **Decisões tomadas pelo humano:** recorte "tira-dúvidas básico", Evolution API na Cloudfy, modelo do produto (ADR-003). Pendente: licença.
- **Troca de modelo por custo:** a primeira escolha foi Claude Opus 5.5. A IA estimou o custo por resposta (≈ US$ 0,02) e, a pedido do autor, comparou com o Gemini usando a **página oficial de preços consultada no dia**, não a memória do modelo. O autor escolheu o **Gemini 3.8 Flash** (≈ US$ 0,0034 por resposta, cerca de 5× mais barato).
- **O que a consulta à fonte revelou** e uma resposta "de memória" não mostraria: (1) o preço do Gemini 3.8 Flash é promocional e **dobra em 01/01/2027**; (2) no plano gratuito, a Google **usa o conteúdo para melhorar os produtos** — inadequado para mensagens reais de usuários (LGPD), então o produto usa o plano pago; (3) por token, o Claude Haiku 5.5 era ainda mais barato — registrado na ADR-003 como alternativa.
- **A IA também estimou** o esforço: ≈ 22,5 h ([estimativa.md](estimativa.md)).
- **Tempo real:** [A PREENCHER — estimativa da v0.1.0: 2 h]

### 14/10/2026 — Estrutura de pastas e primeiro teste (H02)

- **Fase:** implementação, em TDD.
- **Red:** a IA escreveu só o teste de `tokenize` (normalização da pergunta para a busca), com 6 comportamentos, e confirmou que ele falhava porque a função não existia. **O autor revisou e aprovou o teste antes da implementação** — o teste é o oráculo e não foi escrito junto com o código (CLAUDE.md, regra 4).
- **Green:** implementação com normalização Unicode (NFD), remoção de acentos, separação por qualquer caractere fora de `[a-z0-9]` e lista de palavras vazias. 7/7 testes passando; tipos (`tsc`) e build sem erro.
- **O que a revisão pegou:**
  - O lint do projeto (Prettier) reprovou a primeira versão da lista de palavras vazias por formatação — corrigido sem alterar comportamento, com os testes verdes antes e depois.
  - Decisão deliberada: usar `NFD` e não `NFKD`. Com `NFKD`, o "º" de "5º" viraria a letra "o" e o token seria "5o"; com `NFD`, o "º" vira separador e o token é "5", o que o teste exige.
  - "nao" ficou fora da lista de palavras vazias: a negação muda o sentido da pergunta.
- **Tempo real:** [A PREENCHER]

### 14/10/2026 — Esquema da base de conhecimento (H03)

- **Fase:** implementação, em TDD.
- **Red:** a IA propôs o contrato (`parseKnowledgeBase(dados)`, que valida e devolve trechos tipados ou lança erro legível) e escreveu 18 casos de teste antes do código. O autor aprovou as três escolhas embutidas: só fonte do Planalto, só as duas normas do recorte e base vazia válida.
- **Green:** esquema com `zod` (objeto estrito, enum de normas, validação de URL por domínio e de data real) e checagem de `id` duplicado. 25/25 testes, lint, tipos e build sem erro. Ajuste técnico necessário: `resolveJsonModule` no `tsconfig.json` para importar `knowledge/base.json`.
- **O que a revisão pegou:**
  - Ao imprimir as mensagens de erro reais, duas vinham do zod **em inglês** ("Required", "Unrecognized key(s)"). Traduzidas para quem vai editar a base, sem mudar os testes.
  - **Fraqueza no próprio teste aprovado:** as asserções `toThrow("id")` procuram o texto "id" na mensagem, mas o cabeçalho "Base de conhecimento inválida" já contém "id" (em "inválida"). O teste garantia que o erro acontece, mas não que ele aponta o campo `id`. Levado ao autor, que **aprovou** reescrever as checagens para exigir `campo "id"` (e, na mesma linha parametrizada, `campo "<nome>"` para os seis campos obrigatórios).
  - **Prova de que a correção funciona (teste de mutação manual):** a implementação foi quebrada de propósito para omitir o nome do campo na mensagem — **8 testes falharam**, contra nenhum antes da correção. O código foi restaurado e a suíte voltou a 25/25.
  - A mutação também mostrou mais duas mensagens do zod **em inglês** (norma fora do enum e tipo errado). Traduzidas.
  - A validação de URL compara o domínio (`planalto.gov.br` ou subdomínio), não o texto: `https://planalto.gov.br.site-falso.com` é rejeitado, e há teste para isso.
- **Tempo real:** [A PREENCHER]

### 14/10/2026 — Rascunho da base de conhecimento (H04)

- **Fase:** construção da base de conhecimento.
- **O que a IA fez:** baixou a LC 214/2025 e a EC 132/2023 do Planalto e escreveu dois scripts (`scripts/planalto/`): um extrai os artigos vigentes e outro copia **literalmente** os dispositivos escolhidos para `knowledge/rascunho.json`. Selecionou 29 dispositivos para os cinco temas do recorte. Nenhum texto legal foi redigido ou resumido pela IA.
- **O que a verificação pegou antes de chegar ao autor:**
  - **Texto revogado misturado ao vigente.** A primeira extração descartava só `<strike>`, mas o Planalto marca a maior parte das redações revogadas com `text-decoration: line-through` (1.953 ocorrências na LC 214). Sinal: artigos 233 e 365 apareciam duas vezes. Corrigido; as duplicatas sumiram.
  - **Artigos de outras leis contados como da LC 214.** A LC 214 altera outras leis, citando os artigos delas entre aspas; isso gerava 37 números de artigo duplicados. O extrator passou a marcar artigos citados — o que, de quebra, permitiu usar os artigos 124 a 137 do ADCT, inseridos pela EC 132.
  - **Títulos de seção grudados no texto** do artigo anterior (ex.: "Dos Serviços de Educação" no fim do art. 128). Separados.
  - **Inciso a mais no recorte.** O trecho do art. 348, incisos I e II, saiu com o inciso III junto, porque o seletor "com subitens" não distinguia inciso de alínea. Corrigido e conferido que só esse trecho mudou.
  - O rascunho passa no esquema da H03 (29/29).
- **Limitação descoberta:** a EC 132 chama os novos tributos de "imposto previsto no art. 156-A" e "contribuição prevista no art. 195, V", sem os nomes IBS e CBS — a busca por palavra não os encontrará a partir de perguntas com os nomes. Vai para a H05 (sinônimos) e para as limitações do README.
- **Decisão que fica com o humano:** a conferência de cada trecho no texto oficial (`docs/conferencia-base.md`).
- **Tempo real:** [A PREENCHER]

### 14/10/2026 — Conferência humana e base preenchida (H04)

- **Conferência:** o autor conferiu os 29 trechos no texto oficial do Planalto e aprovou todos, **sem correções**.
- **Obstáculo de processo:** a marcação pelo editor do GitHub foi tentada duas vezes e não chegou ao repositório (nenhum commit, pull request ou branch nova, conferido pela API do GitHub). A IA **não marcou nada sem confirmação** e pediu que a conferência fosse informada no chat; o checklist registra essa origem.
- **Resultado:** `knowledge/rascunho.json` passou a `knowledge/base.json` sem alteração de conteúdo (comparado byte a byte com a versão enviada para conferência). A suíte carrega a base real e valida o formato: 25/25.
- **Tempo real:** [A PREENCHER — inclui o tempo de conferência do autor]
