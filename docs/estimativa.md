# Estimativa de esforço e custo

> **Tudo aqui é estimativa**, feita em 14/10/2026, antes da implementação. Os valores reais são medidos e registrados no [HISTORY-IA](HISTORY-IA.md) e comparados com esta tabela na entrega. Divergências viram aprendizado na seção "Como a IA foi usada" do README.

## 1. Esforço (horas do autor)

Prazo: 14/10 a 19/10/2026 às 12h. A carga horária do C4 é de 30 h práticas.

| Release                       | O que inclui                                                                                                                      | Estimativa   | Onde está o risco                                                                                        |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------------------------------------------------- |
| `v0.1.0` Base                 | Leitura do material, escopo, backlog, ADRs, `CLAUDE.md`, `.gitignore`                                                             | 2 h          | —                                                                                                        |
| `v0.2.0` Núcleo               | Esquema da base, **30–50 trechos conferidos no Planalto**, BM25, decisão responder × recusar, testes                              | 6 h          | **Conferência humana dos trechos (~3 h)** — não dá para delegar à IA sem perder a garantia de fonte      |
| `v0.3.0` Geração + simulador  | Adaptador Gemini, prompt de sistema, validação da citação, fallback, página `/simulador`                                          | 4 h          | Ajuste do prompt até a resposta citar sempre a fonte                                                     |
| `v0.4.0` WhatsApp + avaliação | Evolution API na Cloudfy (instância, QR Code, webhook), rota do webhook, deduplicação, envio, conjunto-ouro, calibração do limiar | 6 h          | **Configuração da Evolution e alcance do webhook (~2 h)**; a resposta precisa chegar a tempo ao WhatsApp |
| `v1.0.0` Entrega              | README, varredura de segredos, clone limpo, licença, tag, repositório público                                                     | 3 h          | README conferido contra o código                                                                         |
| Fórum                         | Postagem com os 5 itens + réplica a um colega                                                                                     | 1,5 h        | —                                                                                                        |
| **Total**                     |                                                                                                                                   | **≈ 22,5 h** | Folga para imprevistos: ~7 h dentro das 30 h do curso                                                    |

**Plano de corte se o prazo apertar** (nesta ordem): reduzir a base para 20 trechos → simulador sem histórico → WhatsApp demonstrado por gravação em vez de número aberto ao público. **Não se corta:** testes, citação de fonte, recusa fora do escopo e o checklist de entrega.

## 2. Custo do modelo (Gemini 3.8 Flash)

Preços do modo Standard, plano pago, por 1M de tokens, consultados na página oficial (ai.google.dev/gemini-api/docs/pricing) em 14/10/2026. Fato volátil: conferir de novo antes da entrega.

| Modelo                                            | Entrada (US$) | Saída, incluindo raciocínio (US$) |
| ------------------------------------------------- | ------------- | --------------------------------- |
| **`gemini-3.8-flash` (escolhido)** até 31/12/2026 | **0,75**      | **3,75**                          |
| `gemini-3.8-flash` a partir de 01/01/2027         | 1,50          | 7,50                              |
| Referência: `claude-opus-5-5` (escolha anterior)  | 4,00          | 20,00                             |
| Referência: `claude-haiku-5-5`                    | 0,10          | 0,50                              |

**Premissas por resposta** (a confirmar com o consumo real medido na v0.3.0):

| Parte                                     | Tokens            |
| ----------------------------------------- | ----------------- |
| Prompt de sistema (regras + aviso)        | ~700              |
| 3 trechos recuperados (~400 cada)         | ~1.200            |
| Pergunta                                  | ~50               |
| **Entrada total**                         | **~2.000**        |
| Resposta curta para WhatsApp + raciocínio | **~500** de saída |

**Custo por resposta (Gemini 3.8 Flash):**

- Até 31/12/2026: 2.000 × 0,75/1M + 500 × 3,75/1M = US$ 0,0015 + US$ 0,0019 ≈ **US$ 0,0034**
- A partir de 2027: ≈ **US$ 0,0068**
- **Perguntas recusadas pelo limiar não chamam o modelo → custo zero.**

**Cenários:**

| Cenário                                                                        | Chamadas   | Gemini 3.8 Flash (2026) | Gemini 3.8 Flash (2027) | Referência: Opus 5.5 |
| ------------------------------------------------------------------------------ | ---------- | ----------------------- | ----------------------- | -------------------- |
| Desenvolvimento + avaliação (25 perguntas × ~12 rodadas + ~100 testes manuais) | ~400       | ≈ US$ 1,35              | —                       | ≈ US$ 7              |
| Pós-entrega, uso leve (20 perguntas/dia, 30 dias)                              | ~600/mês   | ≈ US$ 2/mês             | ≈ US$ 4/mês             | ≈ US$ 11/mês         |
| Uso moderado (100 perguntas/dia)                                               | ~3.000/mês | ≈ US$ 10/mês            | ≈ US$ 20/mês            | ≈ US$ 54/mês         |

Leitura: a troca reduz o custo do modelo em cerca de 5 vezes em relação ao Opus 5.5. No volume do projeto, o modelo deixa de ser o principal custo — a hospedagem da Evolution API tende a pesar mais.

**Plano gratuito:** existe, mas nele a Google usa o conteúdo para melhorar seus produtos. Só pode ser usado em desenvolvimento, com perguntas sintéticas, nunca com mensagens reais do WhatsApp (ADR-003).

**Revisão de 15/10/2026 (ADR-007): o modelo lê a base inteira e usa busca no Google.**

| Parte                                          | Tokens            |
| ---------------------------------------------- | ----------------- |
| Prompt de sistema                              | ~600              |
| Base inteira (96 trechos, ~42 mil caracteres)  | ~10.400           |
| Pergunta                                       | ~50               |
| **Entrada total**                              | **~11.000**       |
| Resposta + raciocínio (com complemento da web) | **~800** de saída |

- Custo por resposta até 31/12/2026: 11.000 × 0,75/1M + 800 × 3,75/1M ≈ US$ 0,0083 + US$ 0,0030 ≈ **US$ 0,011** (cerca de 3 vezes o valor anterior); a partir de 2027, ≈ **US$ 0,023**.
- Toda pergunta (exceto saudação) chama o modelo: não há mais recusa de custo zero.
- Busca no Google: **5.000 consultas grátis por mês** no plano pago (compartilhadas entre os modelos Gemini 3), depois US$ 14 por mil — página oficial de preços, consultada em 15/10/2026. Não existe no plano gratuito.
- Cenários revistos (2026): uso leve (~600/mês) ≈ US$ 7/mês; uso moderado (~3.000/mês) ≈ US$ 33/mês, dentro da cota grátis de busca.
- Caminho para reduzir: _context caching_ da base (preço próprio na mesma página) — [A CONFERIR] antes de adotar.

Controle de gasto: limite de orçamento no projeto do Google Cloud ligado à chave, `maxOutputTokens` baixo e uma chave exclusiva deste projeto, revogável sem afetar outros.

## 3. Infraestrutura

| Item                                              | Custo                                                |
| ------------------------------------------------- | ---------------------------------------------------- |
| Lovable (projeto + hospedagem da rota do webhook) | [A CONFERIR — plano atual do autor]                  |
| Evolution API na Cloudfy                          | [A CONFERIR — plano contratado]                      |
| GitHub (repositório público)                      | gratuito                                             |
| Número de WhatsApp dedicado ao agente             | [A CONFERIR] — recomendado não usar o número pessoal |

Câmbio para R$: [A CONFERIR na data da entrega].
