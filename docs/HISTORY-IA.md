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
