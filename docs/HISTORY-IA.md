# Registro do uso de IA

> Diário do desenvolvimento assistido por IA. Alimenta a seção "Como a IA foi usada" do README e os itens 3–5 do fórum do curso.
> Regra: **ganho de produtividade só se registra se for medido** (tempo real, nº de iterações). Estimativa é marcada como estimativa.

## Ferramentas

| Ferramenta                    | Papel                                                                                      |
| ----------------------------- | ------------------------------------------------------------------------------------------ |
| Claude Code (Claude Opus 5.5) | Leitura do material do curso, planejamento, documentação, implementação do núcleo e testes |
| Lovable                       | Geração da interface (simulador) e sincronização com o GitHub                              |

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

### 15/10/2026 — Webhook da Evolution API (H09)

- **Fase:** implementação, em TDD.
- **Fato volátil conferido na fonte primária:** a página de documentação da Evolution sobre webhooks deu 404. A IA foi ao **código-fonte** (`webhook.controller.ts`, branch `main`) e às issues do repositório oficial. Três achados mudaram o desenho: (1) os cabeçalhos configurados no webhook são enviados em toda chamada — é por eles que passa o segredo; (2) a Evolution **reenvia** a chamada quando falha ou demora, então duplicata é certa; (3) a issue #1340 mostra que as mensagens **enviadas** pela própria instância chegam como `messages.upsert` — sem filtrar `fromMe`, o agente responderia a si mesmo em loop.
- **Red:** 25 casos aprovados antes do código, com payloads de exemplo no formato do código-fonte (números e chaves fictícios).
- **Green:** 182/182; lint, tipos e build sem erro; nada do webhook no código do navegador.
- **Teste de mutação:** 10 defeitos (responder a si mesmo, aceitar grupo e status, sem deduplicação, não liberar após falha, aceitar sem segredo configurado, comparar só o começo do segredo, responder mensagem antiga, mandar pergunta longa ao agente, deduplicação sem prazo, deduplicação sem limite) — **todos derrubados**.
- **Execução real da rota (servidor local, `curl`, segredo de teste aleatório num `.env` ignorado pelo Git):** sem segredo e com segredo errado → 401; corpo inválido → 400; `connection.update`, `fromMe` e grupo → 200 ignorado; mensagem válida → 500, porque o envio é da H10 e foi deixado falhando de propósito para o webhook nunca fingir que respondeu. O log registrou só a causa do erro, **sem número e sem texto**.
- **Achado na execução real, não coberto pelos testes:** `GET` na rota devolvia 200 com a página vazia do app. Corrigido para 405 (`Allow: POST`) e conferido com `curl`.
- **Tempo real:** [A PREENCHER]

### 15/10/2026 — Projeto movido para fora do iCloud e envio pela Evolution (H10)

- **Mudança de ambiente, por decisão do autor:** depois de o iCloud tirar do disco 344 arquivos em menos de uma hora, o repositório foi clonado de novo em `~/Projetos/whats-app-agent`, fora da sincronização. Suíte: de travamentos e minutos para **3,5 s**. A cópia antiga ficou parada.
- **Fato volátil conferido na fonte primária:** endpoint, cabeçalho e corpo do envio de texto conferidos no código-fonte da Evolution (`sendMessage.router.ts`, `sendMessage.dto.ts`, `auth.guard.ts`, `createJid.ts`). Na v2 o corpo é `{ number, text }`; na v1 era `textMessage` — a mutação que volta ao formato v1 é derrubada pelos testes.
- **Red:** 25 casos aprovados antes do código — 9 da divisão de mensagens e 16 do adaptador (com `fetch` falso, sem rede).
- **Green:** 207/207; lint e build sem erro; nada da Evolution no código do navegador.
- **Erro da própria IA no teste aprovado:** a checagem de tipos (`tsc`) reprovou dois testes em que a IA escreveu `const fetch = vi.fn<typeof fetch>(...)` — o `typeof fetch` passa a apontar para a própria variável. O vitest não checa tipos, então os testes rodavam. A correção é só renomear a variável, sem mudar asserção; **não foi feita sem aprovação do autor** (CLAUDE.md, regra 4). Aprovada, a variável virou `buscar`; o arquivo manteve as mesmas 25 asserções e o `tsc` passou.
- **Teste de mutação:** 10 defeitos (sem `apikey`, corpo da v1, ignorar recusa da Evolution, número no erro, sem cancelamento por tempo, aceitar `http`, instância sem codificar, barra dupla na URL, parte acima do limite, ignorar parágrafos) — **todos derrubados**.
- **Erro de verificação pego antes de virar conclusão:** o primeiro teste da rota no servidor local mostrou no log a mensagem do envio provisório, já removida do código. A IA conferiu de qual pasta o servidor tinha subido: era a **cópia antiga**, porque a ferramenta de pré-visualização reaproveitou a configuração da raiz antiga. O resultado foi descartado, a configuração corrigida para o caminho novo e o teste refeito.
- **Execução real (servidor da pasta nova):** "oi" e "IPVA" chegaram ao agente (boas-vindas e recusa, sem chamar o modelo) e a tentativa de envio registrou no log `EVOLUTION_API_URL não configurada` — o envio real está ligado. O envio de ponta a ponta fica para a H12, com a instância da Cloudfy.
- **Tempo real:** [A PREENCHER]

### 15/10/2026 — Conjunto-ouro e calibração (H11)

- **Fase:** avaliação do RAG além dos testes (P-avaliacao-de-rag-alem-dos-testes).
- **O que a IA fez:** propôs 32 perguntas escritas como um leigo perguntaria, com o gabarito (trecho esperado) de cada uma, separadas em **calibração** (21) e **teste** (11, nunca usado para ajustar). Incluiu 4 armadilhas fora do escopo com palavras da base. O autor aprovou o gabarito.
- **Red/Green:** 14 casos (formato do conjunto e cálculo das métricas) aprovados antes do código; implementação passou de primeira. `npm run eval` grava `eval/relatorio.md`.
- **Linha de base antes de calibrar:** 100% de abstenção fora do escopo; 13/22 respostas certas dentro.
- **Calibração honesta:** busca em grade só no conjunto de calibração, com a restrição de nenhuma resposta fora do escopo. Ganho máximo: **+1 pergunta**, exigindo mudança de código. Com 15 perguntas isso é ruído; a IA recomendou e manteve os limites atuais e foi investigar **por que** as perguntas falham.
- **Diagnóstico:** as falhas são de **vocabulário** — verbos e palavras comuns ausentes da base dominando a cobertura, flexão verbal ("compensar" × "compensado"), termo onipresente ("IBS" em 19 dos 29 trechos) e ambiguidade ("saúde"). Ajustar limiar não resolve; o caminho é busca híbrida e flexão verbal (v2).
- **Teste medido uma única vez**, depois da decisão: 100% de abstenção, recall@3 86%, respostas corretas 57%.
- **O que não foi cumprido e está declarado:** o critério de recall ≥ 80% do escopo ficou em 73% na calibração (77% no total). Uma pergunta ("serviços de saúde") passa com trecho errado — risco registrado no ADR-004.
- **Tempo real:** [A PREENCHER]

### 15/10/2026 — README final, licença e revisão de entrega (H13 e H14)

- **README conferido em clone limpo:** a IA clonou o repositório do GitHub numa pasta temporária e seguiu o README ao pé da letra (instalar, testar, avaliar, construir, rodar). Pegou **um erro no próprio README**: o exemplo do webhook dizia 401, mas com o `.env.example` (segredo vazio) o código devolve 503, a falha fechada que ele mesmo implementa. Também corrigiu a versão mínima do Node (22.12, exigência do TanStack Start conferida no npm) e removeu do `.env.example` uma variável que nenhum código lê.
- **Varredura de segredos:** sem `gitleaks` instalado (instalar exigiria autorização), a IA varreu as 10.843 linhas adicionadas em todo o histórico com os padrões equivalentes e fez um **controle positivo** com segredos falsos no formato real, para provar que a varredura detectaria. Resultado: nenhum segredo; o único achado era um valor fictício dos testes.
- **Fato jurídico conferido na fonte:** a afirmação de que lei não tem proteção autoral, usada para publicar os trechos na base, foi conferida no art. 8º, IV, da Lei 9.610/1998 no Planalto.
- **Restos do template encontrados e corrigidos:** página inicial "Em construção" e título "Lovable App" — a primeira coisa que o avaliador veria. O `npm run lint` falhava por um arquivo do template; voltou a passar.
- **O que a IA deixou de propósito:** o nome `tanstack_start_ts` no `package.json` — está também no `bun.lock`, e trocá-lo quebraria a instalação travada descrita no README.
- **Documentação desatualizada corrigida:** ADRs ainda marcados como "Proposta", escopo "aguardando aprovação", comando de instalação errado no `CLAUDE.md` (o `npm install` ignora o `bun.lock`).
- **Tempo real:** [A PREENCHER]

### 15/10/2026 — Frontend profissional (prompt 01)

- **Ferramenta:** o skill `frontend-prompt-optimizer` gerou um prompt estruturado (objetivo, contexto, passos, critérios de sucesso, princípios de design) a partir do estado real do código; o prompt está versionado em `prompts/01-frontend-profissional.md` e foi executado pelo Claude Code.
- **Achados no código do template, antes de desenhar:** `<html lang="en">` com conteúdo em português (WCAG 3.1.1 — leitor de tela pronunciaria errado); página 404 e de erro em inglês; tokens de modo escuro sem nenhuma forma de ativá-los; nenhuma navegação entre páginas.
- **Testes primeiro:** 18 casos novos (exemplos clicáveis, contador de caracteres, nova conversa, tema, link de pular conteúdo, navegação com página atual, página inicial). Os 11 testes antigos do simulador seguiram valendo sem alteração.
- **Contraste calculado, não estimado:** a IA converteu os tokens oklch para sRGB e calculou a razão de contraste WCAG dos 22 pares texto/fundo nos dois temas — todos ≥ 4,5:1 (menor: 5,12:1).
- **O que a revisão pegou:**
  - O Node 26 traz um `localStorage` global experimental que encobre o do jsdom nos testes; corrigido no `setup.ts` (ambiente), não no código.
  - O texto do rodapé dizia "não substitu**em**" e o teste esperava "não substitui": ajustado o texto, não o teste.
  - `tsc` acusou um tipo com `exactOptionalPropertyTypes`; o primeiro "tsc ok" relatado pela IA era falso, porque o comando media o código de saída do `head`, não do `tsc` — refeito com o código de saída correto.
  - As capturas de tela da prévia saíam em branco depois de rolar a página. Antes de concluir que a página tinha defeito, a IA inspecionou o DOM (elemento visível em cada ponto, opacidade, cores): estava tudo certo — era a captura. Passou a capturar aumentando a altura da janela.
- **Verificação real (servidor local, navegador):** temas claro e escuro, tema mantido entre páginas, exemplo clicável, recusa ("Fora da base") e falha ("Falha técnica") com tratamento visual próprio, foco voltando ao campo, e **nenhuma rolagem horizontal em 375 px**. Nada da base, da chave ou do prompt no código do navegador; sem dependências novas e sem fontes externas.
- **Tempo real:** [A PREENCHER]

### 15/10/2026 — Aplicação da marca Inciso

- **Origem:** a marca foi criada em outra conversa ("Logomarca para produto"). A IA não achou o arquivo no repositório e, com a indicação do autor, localizou a conversa pelas ferramentas de sessão e os arquivos na pasta `MARCA` do curso. Lá constava que o nome mudou de _Dualis_ para _Inciso_ por conflito no INPI e que a busca do novo nome foi preliminar — registrado como [A CONFERIR], não como fato.
- **Testes primeiro:** 5 testes do componente de logotipo (nome acessível, cores do traço e das letras, versão decorativa) e 1 no cabeçalho (marca com link para a página inicial), escritos antes da troca.
- **Logotipo como componente, não imagem:** a geometria foi copiada dos SVGs do manual; só as cores viraram variáveis, para o traço do I seguir o tema (azul-caneta no claro, #8099FF no escuro, como na versão negativa) sem trocar as cores do traço e do travessão, que o manual proíbe.
- **Fontes da marca sem chamada externa:** Schibsted Grotesk, Source Serif 4 e IBM Plex Mono instaladas pelo `@fontsource` (versões do `npm view`), servidas pelo próprio app — nenhuma requisição ao Google Fonts. Mono nas citações de lei e nos números; serifada nos textos longos.
- **Contraste recalculado:** 28 pares texto/fundo nos dois temas, incluindo o traço do logotipo sobre o fundo (mínimo 3:1 para elemento gráfico) — nenhuma falha; menor razão 5,78:1.
- **Ícones:** favicon SVG e ICO (32 e 48 px), apple-touch-icon e ícones 192/512 gerados a partir dos arquivos do manual; `theme-color` nas cores papel e tinta.
- **Tempo real:** [A PREENCHER]

### 15/10/2026 — Harmonia da paleta (prompt 02)

- **Ferramenta:** o skill `frontend-prompt-optimizer` gerou o prompt `prompts/02-harmonia-de-cores.md` a partir de um diagnóstico numérico dos tokens (matiz e croma oklch), não de impressão visual.
- **O que estava desarmônico:** neutros em duas famílias de cor (texto azulado em 264–266°, superfícies e bordas amarelo-esverdeadas em 106–128°); o amarelo marca-texto como `--accent`, deixando amarelos todos os hovers, a seleção e os ícones, quando o manual o reserva para destaque pontual; no escuro, um accent marrom-oliva e bordas brancas sem matiz.
- **Achado de acessibilidade:** a borda do campo de texto tinha ≈1,3:1 sobre o fundo; o WCAG 1.4.11 pede 3:1 para o limite de campos. Corrigida.
- **Sistema adotado (60-30-10):** neutros na matiz da tinta; azul-caneta para ações, foco, hover e seleção; marca-texto só em tokens próprios (`--citacao` para as fontes de lei e `--realce` para o traço de marca-texto no título).
- **Teste primeiro:** `src/styles.contraste.test.ts` lê o `styles.css`, converte oklch para sRGB, compõe transparências e confere, nos dois temas, 14 pares de texto (≥ 4,5:1), 5 elementos gráficos (≥ 3:1) e a regra de harmonia — 54 casos. Falhou na paleta antiga exatamente nos pontos do diagnóstico; uma mutação (cor de citação escurecida no tema escuro) foi detectada.
- **O que a prévia pegou:** o realce do título aparecia como um bloco amarelo cheio — o `<mark>` herda do navegador um fundo amarelo puro por baixo do degradê. Corrigido com fundo transparente; o contraste do texto sobre o realce é 13,3:1 (claro) e 7,9:1 (escuro).
- **Tempo real:** [A PREENCHER]

### 15/10/2026 — Recusa indevida do ISS e falha de abstenção (descobertas no site publicado)

- **Origem:** o autor testou o site publicado com "quando o iss deixa de existir ?" e recebeu recusa, embora a base tenha o dispositivo (EC 132/2023, ADCT, art. 129).
- **Diagnóstico com números, não com palpite:** a busca achava o artigo certo em 1º lugar (escore 3,24), mas a cobertura ficava em 0,23 (mínimo 0,30): "deixa" e "existir" não existem na base e pesam como os termos mais raros da pergunta. A hipótese inicial da IA (sinônimos não aplicados) estava errada — o erro era do próprio script de diagnóstico, que passava os sinônimos no formato errado.
- **A simulação da correção revelou um defeito pior, já em produção:** "O IPVA acaba?", "Quando acaba o IPTU?" e "O imposto de renda acaba?" **passavam** pelo filtro e seriam respondidas com o artigo que extingue ICMS e ISS — "acaba" casava com "extintos" e a cobertura passava do mínimo. O conjunto-ouro não tinha esse padrão, e por isso a abstenção medida era 100%.
- **Correção aprovada pelo autor (testes primeiro):** 7 casos novos (2 de resposta, 5 de recusa); regra no código que recusa pergunta que cita tributo fora da base (lista conferida contra a base: nenhum aparece nela; "renda" sozinha ficou de fora para não barrar "família de baixa renda"); sinônimo de linguagem "existir → extintos". Teste de mutação: sem a regra, 4 casos falham; sem o sinônimo, 2 falham.
- **Avaliação:** calibração inalterada; teste de 57% para 71% de respostas corretas (t01 deixou de ser recusada); abstenção 100% nos dois conjuntos. Ressalva registrada: o t01 é do conjunto de teste; a mudança veio da pergunta real, não do gabarito.
- **Tempo real:** [A PREENCHER]

### 15/10/2026 — O Gemini lê a base inteira e completa com busca na web (ADR-007)

- **Pedido do autor:** "quero algo que pense, não respostas mecânicas", juntando a base com conhecimento externo e sem deixar o usuário sem resposta. Isso muda duas regras do contrato (`CLAUDE.md`, regras 5 e 6); a IA apresentou o impacto antes e o autor aprovou o ADR-007, a redação nova das regras e os 45 testes antes da implementação.
- **Por que não só "ampliar a base":** a IA simulou, fora do repositório, a importação dos 67 dispositivos citados pela base do APP 2 com a busca por palavras: a abstenção caiu de 100% para 50% no teste ("Qual a previsão do tempo para amanhã?" casava com "previsão expressa" do art. 7º-A) e nenhum ajuste de limiar recuperava 100% sem derrubar as respostas corretas para ~30%. O limite era do método, não do limiar.
- **Conhecimento externo com fonte, não de memória:** a IA conferiu no SDK instalado que o `@google/genai` tem a ferramenta `googleSearch` e devolve as fontes, e na página oficial de preços que a busca existe no plano pago (5.000 consultas grátis por mês). A alternativa "Gemini respondendo de memória" foi descartada no ADR por produzir fato jurídico sem fonte.
- **Garantias no código, testadas:** artigo citado que não existe na base bloqueia a resposta; complemento sem fonte da web é removido; resposta sem nenhuma fonte vira mensagem fixa; `[fora-do-tema]` vira mensagem de redirecionamento; só links http(s), sem repetição.
- **Base ampliada para 96 trechos** pela ferramenta `scripts/planalto/montar.py` (nova lista `SPEC_APP2`): os 29 antigos saíram idênticos da versão vigente do Planalto e os 67 novos passaram na conferência automática (67/67); a conferência humana dos 67 ficou pendente, registrada em `docs/conferencia-base.md`. Achado: o dispositivo que o APP 2 deixou [A CONFERIR] sobre cumulação de reduções é o art. 7º-A, parágrafo único, incluído pela LC 227/2026.
- **Removido com aprovação:** busca BM25, mapa de sinônimos, limiar, regra de tributos fora da base e a avaliação sem modelo (com seus testes). `eval/perguntas.json` e o último relatório ficaram como histórico do método anterior.
- **O que a verificação pegou:** a página inicial passou a mostrar a mesma data duas vezes e um teste existente acusou (corrigido o texto, não o teste); o custo por resposta estimado no ADR (~8 mil tokens) estava abaixo do real — medido em ~11 mil tokens de entrada (≈ US$ 0,011), corrigido no ADR, no README e na estimativa.
- **Pendente:** avaliação com o Gemini sobre o conjunto-ouro (testes próprios, numa etapa seguinte) e teste real da busca, inclusive se os links vêm como redirecionamento do Google [A CONFERIR].
- **Tempo real:** [A PREENCHER]

### 15/10/2026 — Links da busca quebravam o simulador; termos do Google

- **Primeiro teste real (pelo autor, no Lovable):** a busca no Google funcionou, com fontes da lei e da web separadas. Mas os endereços da web vieram como redirecionamento do Google, com centenas de caracteres sem espaço, e estouraram o balão do simulador.
- **A IA leu os termos da Gemini API antes de corrigir:** a ideia inicial (trocar o redirecionamento pelo endereço final da página) **violaria os termos**, que proíbem alterar os links e coletá-los por meios automatizados. A correção ficou dentro dos termos: os links são mostrados como vieram, com o nome do site como rótulo.
- **Testes primeiro:** 5 casos novos — o núcleo devolve um `corpo` sem as listas de endereços (o texto do WhatsApp continua com eles, porque lá o endereço é o link); o simulador não mostra endereço cru, numera nomes repetidos ("senado.leg.br (2)") e o balão quebra palavras longas.
- **Achados dos termos que ficaram pendentes:** exibir as _Search Suggestions_ junto com a resposta (exigência) e a proibição de "modificar" os resultados frente à conferência do ADR-007 — registrados como [A CONFERIR] no ADR-007, para decisão do autor.
- **Tempo real:** [A PREENCHER]
