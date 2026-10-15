# Escopo do MVP

> Estado: **aprovado pelo autor em 14/10/2026; garantias revistas em 15/10/2026 (ADR-007, proposta)**. Os critérios de sucesso foram medidos em 15/10/2026 (ver tabela abaixo e [eval/relatorio.md](../eval/relatorio.md)).

## Problema

A reforma tributária do consumo (EC 132/2023 e LC 214/2025) muda a vida de empresas e contadores ao longo de vários anos de transição. As dúvidas são frequentes e repetitivas, e as respostas que circulam (inclusive as de chatbots genéricos) costumam **não citar a fonte** ou **inventar** alíquotas e prazos.

## Solução (MVP)

Um agente que responde pelo **WhatsApp** a dúvidas sobre a reforma tributária, com três garantias:

1. **Toda afirmação tem fonte:** o que vem da lei cita o dispositivo da base (ex.: "LC 214/2025, art. X"); o que vem da busca na web aparece como _complemento_, com link, identificado como não conferido. Citação de lei inventada nunca chega ao usuário — conferido no código (ADR-007).
2. **O usuário não fica sem resposta:** o Gemini lê a base inteira e completa com busca no Google; assunto fora da reforma recebe uma mensagem que explica o foco do agente.
3. **Aviso fixo:** a resposta é informativa e não substitui orientação de contador ou advogado.

## Usuários

- **Primário:** empresário ou profissional de contabilidade com dúvida pontual, pelo WhatsApp.
- **Avaliador do curso:** precisa reproduzir o projeto **sem ter acesso ao WhatsApp do autor** → simulador web.

## Dentro do escopo

| #   | Item                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------- |
| E1  | Receber mensagem de texto do WhatsApp via webhook da **Evolution API** e responder pelo mesmo canal                                   |
| E2  | Base de conhecimento versionada em `knowledge/`, **um trecho por dispositivo legal**, com fonte e data de referência                  |
| E3  | ~~Recuperação lexical (BM25) sobre a base~~ — substituída em 15/10/2026: o modelo recebe a **base inteira** (ADR-007)                 |
| E4  | ~~Decisão responder × recusar por limiar~~ — substituída: o código confere citações e fontes (ADR-007)                                |
| E5  | Geração da resposta por LLM com a base inteira e **busca no Google**, separando lei citada e complemento com link                     |
| E6  | **Simulador de conversa** na interface web (Lovable), usando o mesmo núcleo do WhatsApp                                               |
| E7  | Validação do webhook (segredo compartilhado), deduplicação de mensagem repetida e tratamento de falha do LLM com resposta de fallback |
| E8  | Conjunto-ouro de perguntas com gabarito (incluindo perguntas fora do escopo) e relatório de acerto                                    |
| E9  | Documentação de entrega: README, registro do uso de IA, limitações, licença, tag `v1.0.0`                                             |

**Recorte temático da base no MVP — tira-dúvidas básico:** perguntas de quem está começando a entender a reforma, não de quem precisa apurar tributo.

| Tema                    | Exemplos de pergunta                                                             |
| ----------------------- | -------------------------------------------------------------------------------- |
| O que muda              | "O que é a reforma tributária?", "Quais tributos deixam de existir?"             |
| Os novos tributos       | "O que é IBS?", "O que é CBS?", "O que é o Imposto Seletivo?"                    |
| Cronograma de transição | "Quando começa?", "Até quando convivem os dois sistemas?"                        |
| Conceitos-chave         | "O que é não cumulatividade?", "O que é _split payment_?", "O que é _cashback_?" |
| Quem é afetado          | "Muda algo para o Simples Nacional?", "E para o MEI?"                            |

Fontes: EC 132/2023 e LC 214/2025, no texto oficial do Planalto. Cada trecho é copiado literalmente do texto oficial pela ferramenta de `scripts/planalto/` e conferido contra o texto vigente. 29 trechos no MVP (14/10/2026, conferidos por pessoa); 96 depois da ampliação de 15/10/2026 (ADR-007), com os 67 novos aguardando conferência humana.

## Fora do escopo (explícito)

- Cálculo de tributo para um caso concreto, simulação de carga tributária ou planejamento tributário.
- Parecer ou consultoria — o agente informa, não aconselha.
- Mensagens de áudio, imagem ou documento (só texto no MVP).
- Memória de conversa entre mensagens (cada pergunta é respondida isoladamente).
- Busca semântica com embeddings / banco vetorial (fica para v2; ver ADR-004).
- Legislação estadual/municipal, regulamentos ainda não publicados e jurisprudência.
- Atualização automática da base a partir de sites oficiais.
- Painel administrativo, autenticação de usuários, cobrança, múltiplos números.
- Orquestração no n8n — só entra se surgir necessidade concreta (ver ADR-002).

## Critérios de sucesso do MVP

| Critério          | Meta                                                                                                                                                                 | Como medir                                                     |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| Recuperação       | o trecho correto entre os 3 primeiros em ≥ 80% das perguntas do conjunto-ouro — **medido em 15/10/2026: 73% (calibração), 86% (teste); 77% no total — não atingido** | `npm run eval`                                                 |
| ~~Abstenção~~     | ~~100% das perguntas fora do escopo recusadas~~ — critério do ADR-004, medido em 15/10/2026 (100%); substituído pelo ADR-007                                         | —                                                              |
| Citação válida    | 0 citações de lei inexistentes na saída; todo complemento com ao menos um link                                                                                       | teste automatizado sobre a saída + `npm run eval` (com Gemini) |
| Cobertura         | ≥ 90% das perguntas dentro do tema respondidas com fonte (lei ou web)                                                                                                | `npm run eval` (com Gemini)                                    |
| Foco              | 100% das perguntas fora do tema (ex.: previsão do tempo) recebem a mensagem de redirecionamento                                                                      | `npm run eval` (com Gemini)                                    |
| Execução real     | uma pergunta enviada pelo WhatsApp recebe resposta com fonte                                                                                                         | demonstração gravada (GIF/print)                               |
| Reprodutibilidade | um terceiro clona, instala, roda testes e o simulador seguindo só o README                                                                                           | teste em clone limpo                                           |

## Restrições

- Prazo: **19/10/2026, 12h**.
- Repositório **público** no momento da entrega (exigência do curso).
- Stack do template Lovable: TanStack Start + React + TypeScript + Vite + Vitest.
- Evolution API hospedada na **Cloudfy**; modelo: Gemini 3.8 Flash via Gemini API (plano pago). Custos em [estimativa.md](estimativa.md).
