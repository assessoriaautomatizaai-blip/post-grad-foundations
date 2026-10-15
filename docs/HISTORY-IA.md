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

### 14/10/2026 — Busca BM25 e sinônimos (H05)

- **Fase:** implementação, em TDD.
- **Red:** 18 casos escritos antes do código e aprovados pelo autor — 13 com uma base fictícia (relevância, IDF, determinismo, sinônimos, artigos parecidos) e 5 perguntas reais contra a base conferida.
- **Green:** BM25 implementado sem biblioteca externa, mais o mapa de sinônimos com fonte para cada ligação. 43/43 testes, lint, tipos e build sem erro (44/44 depois do teste de borda).
- **Teste que passa de primeira merece desconfiança — teste de mutação:** quatro defeitos inseridos de propósito no código.
  - Sem sinônimos: **4 testes falharam**. Sem IDF: **1 falhou**. ✅
  - Sem desempate pela ordem da base: nenhum falhou — mutação **equivalente** (o `sort` do JavaScript já é estável), não é lacuna.
  - Sem borda de palavra no casamento de sinônimos: **nenhum falhou — lacuna real.** "155, II" (ICMS) casaria com "155, III". Na base atual isso não acontece (conferido trecho a trecho), mas uma lei nova na base poderia trazer o erro. Proposto ao autor um teste novo; **não foi adicionado sem aprovação**. Aprovado, o teste foi escrito, e a mesma mutação, reaplicada, passou a derrubá-lo (1 falha); com o código restaurado, 44/44.
- **O que a conferência dos sinônimos na base pegou:** o "IBS" só achava 1 trecho, porque a EC 132 escreve "arts. 156-A e 195, V" (plural) e a expressão era "art. 156-A". Trocada por "156-A"; agora acha 2 (e a CBS, 3).
- **Incidente de ambiente:** a suíte passou a travar sem mensagem. Causa: o projeto fica em `~/Documents`, sincronizado com o iCloud, que tinha tirado do disco 11.793 arquivos do `node_modules` e 93 do projeto (inclusive do `.git`); o vitest esperava indefinidamente o download. Correção, por decisão do autor: download forçado dos arquivos do projeto (`brctl download`), verificação do Git (`git fsck`) e `node_modules` reinstalado fora do iCloud, ligado ao projeto por link simbólico. A pasta precisa terminar em `/node_modules/`, porque o Vite reconhece dependências por esse trecho do caminho — por isso não se usou o sufixo `.nosync`.
- **Tempo real:** [A PREENCHER]

### 14/10/2026 — Decisão responder × recusar (H06)

- **A medição antes dos testes mudou o desenho.** Antes de escrever a especificação, a IA mediu os escores da busca em 12 perguntas dentro e 10 fora do escopo, para não escrever um teste impossível de cumprir. Resultado: **nenhum limiar de escore separava os dois grupos** — "O que é o IBS?" teve 0,67 e "Qual o valor do IPVA do meu carro?" teve 3,39. A H05, com seus 5 testes reais verdes, escondia três defeitos da busca: palavras de pergunta contando como termo ("qual" casava com "segundo o qual"), falta de plural ("advogado" não achava "advogados") e falta de sinônimos de uso comum ("remédios" × "medicamentos").
- **Decisão do autor:** entre seguir o backlog (só limiar, com erros declarados) e corrigir a busca acrescentando a **cobertura** como segundo sinal (+2 h estimadas), escolheu corrigir.
- **Protótipo antes do teste:** a IA prototipou a correção fora do repositório e mediu: 8/8 recusas corretas e 10/12 respostas corretas; os 2 erros são recusas indevidas. Só então escreveu os testes.
- **Red:** 1 caso novo no `tokenize`, 19 no `stem` (arquivo novo), 5 na busca (plural e cobertura) mais 2 perguntas reais, e 39 na decisão (arquivo novo, com 18 perguntas reais) — 66 casos novos. Aprovados pelo autor. Os 44 testes anteriores seguiram verdes.
- **Green:** 110/110 na primeira execução. Lint, tipos e build sem erro.
- **Teste de mutação:** 7 defeitos inseridos de propósito (decisão sem cobertura, sem escore, mínimos exclusivos, saudação com `some`, busca sem plural, cobertura sem peso IDF, cobertura sempre 1). **Todos derrubaram ao menos um teste** (de 1 a 7 falhas cada).
- **Risco registrado:** a margem da cobertura é estreita (0,28 fora × 0,30 mínimo). Vai para a calibração da H11.
- **Tempo real:** [A PREENCHER]

### 14/10/2026 — Geração da resposta com o Gemini (H07)

- **Fase:** implementação, em TDD — primeira vez que o **produto** usa IA (até aqui, a IA só era usada no processo de desenvolvimento).
- **Decisão de desenho proposta pela IA e aprovada:** o modelo cita os trechos pelo `id` (`[lc214-art31]`), e não por texto livre, porque o `id` é verificável com exatidão — citação a `id` não recuperado é invenção e vira recusa.
- **Red:** 27 casos escritos antes do código e aprovados — 19 da geração (prompt, validação de citação, fluxo completo com modelo falso) e 8 do adaptador (com cliente falso do SDK). Nenhum chama o Gemini de verdade.
- **Fato volátil conferido na fonte:** forma de chamada do SDK (`ai.models.generateContent` → `response.text`) e nomes dos campos (`systemInstruction`, `maxOutputTokens`, `abortSignal`) conferidos na documentação do pacote no npm e nos tipos instalados. A IA tinha previsto que o `bun` instalaria uma versão anterior à 2.29.1 por causa da regra de 24 h; **a previsão estava errada** — a versão tinha 29 h. Conferido pelo horário de publicação.
- **O que a própria IA corrigiu na implementação:** a primeira versão do fluxo engolia o erro do modelo num `catch` vazio — exatamente o defeito que o material do curso critica na U3. Passou a repassar o erro para uma função de registro fornecida pelo servidor (o núcleo não faz I/O). Essa função ainda não tem teste próprio (registrado no backlog).
- **Green:** 137/137 na primeira execução; lint, tipos e build sem erro. A checagem de tipos também confirmou que o cliente real do SDK é compatível com a interface usada no adaptador.
- **Teste de mutação:** 8 defeitos inseridos (aceitar `id` não recuperado, não neutralizar a pergunta, tirar o aviso, expor o erro técnico ao usuário, tirar o tempo limite, aceitar resposta sem citação, aceitar resposta vazia do Gemini, vazar a chave na mensagem de erro) — **todos derrubaram ao menos um teste**. Uma mudança inócua de controle não derrubou nenhum, como esperado.
- **Ainda não verificado:** a chamada real ao Gemini (sem chave neste ambiente). Suíte verde não prova que o produto montado funciona.
- **Tempo real:** [A PREENCHER]

### 15/10/2026 — Simulador web (H08)

- **Fase:** implementação, em TDD, e primeira execução do produto montado.
- **Red:** 20 casos aprovados antes do código — 8 do serviço do agente (base real, modelo falso), 11 do componente (histórico, espera, fontes como links, formatação do WhatsApp, HTML tratado como texto, falha de rede, acessibilidade) e 1 da rota.
- **Antes de rodar:** o iCloud tinha tirado do disco 369 arquivos do projeto durante a noite (o risco previsto no incidente da H05). Baixados de novo e o Git conferido antes de qualquer teste.
- **O que o framework pegou:** o build falhou com `Import denied in client environment` — o TanStack Start bloqueia no navegador qualquer arquivo em `src/server/`. A definição da função de servidor (a ponte RPC) foi para `src/lib/simulador.functions.ts`; a implementação ficou em `src/server/`, carregada só dentro do handler, que o framework remove do código do cliente.
- **Verificação da afirmação "a chave não vai para o navegador":** a IA procurou no código gerado para o cliente o texto de um trecho da lei, o prompt de sistema, `generateContent` e `GEMINI_API_KEY` — **nenhum aparece no cliente**; todos aparecem só no servidor.
- **O que a revisão da IA corrigiu além dos testes:**
  - O limite de 500 caracteres estava duplicado no componente; centralizado em `src/core/pergunta.ts` (importar do servidor levaria a base para o navegador).
  - O agente de produção criava o cliente do Gemini na primeira pergunta: **sem chave, até "oi" e as recusas falhariam**, embora não precisem do modelo. Passou a criar o cliente só quando o modelo é necessário.
  - O Prettier reformatou dois arquivos do template do Lovable; a mudança foi desfeita, por não fazer parte do escopo.
- **Green:** 157/157; lint, tipos e build sem erro. **Teste de mutação:** 8 defeitos (HTML interpretado/XSS, sem `trim`, erro técnico na tela, link sem `noopener`, envio vazio, sem `aria-live`, indicador de espera que nunca some, `registrarErro` ignorado) — **todos derrubados**.
- **Execução real (produto montado, servidor local):** "oi" → boas-vindas; "Qual o valor do IPVA do meu carro?" → recusa, sem chamar o modelo; "O que é o split payment?" → mensagem de falha amigável, porque não há chave neste ambiente. O log do servidor registrou `GEMINI_API_KEY não configurada`, **sem o texto da pergunta**.
- **Ainda não verificado:** a resposta real do Gemini. Observação: o servidor de desenvolvimento da configuração do Lovable também escuta na rede local (Network: 192.168.x.x) — aceitável só para desenvolvimento.
- **Tempo real:** [A PREENCHER]
