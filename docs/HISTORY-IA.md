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
