# Prompt 07 — Redesenho do site com base numa referência

Pedido do autor: usar a página "Consultor IA" da Viver de IA (app.viverdeia.ai/consultor-ia) como base para redesenhar todo o frontend, com o Claude in Chrome e o Firecrawl. Decisão do autor: **site inteiro**, mantendo a marca e as fontes do Inciso.

```
LEVANTAMENTO:
- Firecrawl: a página exige login e foi redirecionada para /login; trouxe só o visual do login.
- Claude in Chrome (sessão do autor): estrutura e estilos computados da página.
  - Barra lateral com seções em rótulo mono; item ativo em azul-marinho.
  - Saudação grande em dois tons (forte + acinzentada), subtítulo curto.
  - Caixa de pergunta ampla em vidro (raio 20 px, sombras em camadas).
  - "Explorar por área": fichas em pílula de vidro.
  - Botão principal: pílula azul-marinho em degradê, brilho no alto e relevo interno.
  - Fundo branco, texto azul-marinho (#0A1F3B), secundário cinza-azulado (#5E6B82).

DIREÇÃO (sem copiar marca, textos ou identidade da referência):
- Acabamento global: pílula principal em tinta (#121826) com relevo; superfícies de vidro;
  cartões de 20 px com sombras em camadas; versões próprias no tema escuro.
- Simulador como Consultor: barra lateral com o roteiro, saudação, caixa de pergunta de
  várias linhas (Enter envia, Shift+Enter quebra linha), fichas "Explorar por tema"; na
  conversa, a caixa desce para o rodapé, perguntas em balão de tinta e respostas em cartão.
- Página inicial: topo centralizado em dois tons, caixa de pergunta que abre o simulador,
  fichas por tema, demonstração e seções em cartões de vidro; menu em cápsula de vidro com a
  página atual em pílula de tinta.
- Fontes da marca mantidas (Schibsted Grotesk é do mesmo gênero da Geist).

CRITÉRIOS:
- [ ] Testes novos: saudação, Enter/Shift+Enter, fichas por tema, caixa que leva ao simulador
- [ ] Testes existentes sem alteração; tsc, lint e build sem erro
- [ ] Claro, escuro, tela larga e 375 px; prévia aprovada antes do commit
```
