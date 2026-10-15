# Escopo do MVP

> Estado: **proposta — aguardando aprovação**. Itens marcados [A PREENCHER] / [A CONFERIR] dependem de decisão do autor.

## Problema

A reforma tributária do consumo (EC 132/2023 e LC 214/2025) muda a vida de empresas e contadores ao longo de vários anos de transição. As dúvidas são frequentes e repetitivas, e as respostas que circulam (inclusive as de chatbots genéricos) costumam **não citar a fonte** ou **inventar** alíquotas e prazos.

## Solução (MVP)

Um agente que responde pelo **WhatsApp** a dúvidas sobre a reforma tributária, com três garantias:

1. **Toda resposta cita a fonte primária** (norma e dispositivo, ex.: "LC 214/2025, art. X") e a data de referência da base.
2. **Fora da base, o agente se recusa** e diz que não tem informação suficiente — a decisão é tomada no código, por limiar de recuperação.
3. **Aviso fixo:** a resposta é informativa e não substitui orientação de contador ou advogado.

## Usuários

- **Primário:** empresário ou profissional de contabilidade com dúvida pontual, pelo WhatsApp.
- **Avaliador do curso:** precisa reproduzir o projeto **sem ter acesso ao WhatsApp do autor** → simulador web.

## Dentro do escopo

| # | Item |
|---|---|
| E1 | Receber mensagem de texto do WhatsApp via webhook da **Evolution API** e responder pelo mesmo canal |
| E2 | Base de conhecimento versionada em `knowledge/`, **um trecho por dispositivo legal**, com fonte e data de referência |
| E3 | Recuperação lexical (BM25) sobre a base — determinística e testável offline |
| E4 | Decisão **responder × recusar** por limiar, no código |
| E5 | Geração da resposta por LLM **restrita aos trechos recuperados**, com citação obrigatória |
| E6 | **Simulador de conversa** na interface web (Lovable), usando o mesmo núcleo do WhatsApp |
| E7 | Validação do webhook (segredo compartilhado), deduplicação de mensagem repetida e tratamento de falha do LLM com resposta de fallback |
| E8 | Conjunto-ouro de perguntas com gabarito (incluindo perguntas fora do escopo) e relatório de acerto |
| E9 | Documentação de entrega: README, registro do uso de IA, limitações, licença, tag `v1.0.0` |

**Recorte temático da base no MVP — tira-dúvidas básico:** perguntas de quem está começando a entender a reforma, não de quem precisa apurar tributo.

| Tema | Exemplos de pergunta |
|---|---|
| O que muda | "O que é a reforma tributária?", "Quais tributos deixam de existir?" |
| Os novos tributos | "O que é IBS?", "O que é CBS?", "O que é o Imposto Seletivo?" |
| Cronograma de transição | "Quando começa?", "Até quando convivem os dois sistemas?" |
| Conceitos-chave | "O que é não cumulatividade?", "O que é *split payment*?", "O que é *cashback*?" |
| Quem é afetado | "Muda algo para o Simples Nacional?", "E para o MEI?" |

Fontes: EC 132/2023 e LC 214/2025, no texto oficial do Planalto. Cada trecho é conferido no texto oficial antes de entrar na base. Meta: 30 a 50 trechos.

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

| Critério | Meta | Como medir |
|---|---|---|
| Recuperação | o trecho correto entre os 3 primeiros em ≥ 80% das perguntas do conjunto-ouro — **medido em 15/10/2026: 73% (calibração), 86% (teste); 77% no total — não atingido** | `npm run eval` |
| Abstenção | 100% das perguntas fora do escopo recusadas — **medido em 15/10/2026: 100% (calibração e teste)** | `npm run eval` |
| Citação | toda resposta não recusada contém ao menos uma fonte da base | teste automatizado sobre a saída |
| Execução real | uma pergunta enviada pelo WhatsApp recebe resposta com fonte | demonstração gravada (GIF/print) |
| Reprodutibilidade | um terceiro clona, instala, roda testes e o simulador seguindo só o README | teste em clone limpo |

## Restrições

- Prazo: **19/10/2026, 12h**.
- Repositório **público** no momento da entrega (exigência do curso).
- Stack do template Lovable: TanStack Start + React + TypeScript + Vite + Vitest.
- Evolution API hospedada na **Cloudfy**; modelo: Gemini 3.8 Flash via Gemini API (plano pago). Custos em [estimativa.md](estimativa.md).
