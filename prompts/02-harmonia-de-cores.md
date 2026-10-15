# Prompt 02 — Harmonia da paleta (marca Inciso)

Gerado com o skill `frontend-prompt-optimizer` a partir do pedido do autor ("quero que as cores tenham mais harmonia… atue como um verdadeiro dev designer") e do diagnóstico numérico dos tokens de `src/styles.css`. Executado pelo Claude Code.

```
OBJETIVO:
Reorganizar a paleta do app Inciso num sistema de cores único e harmônico, fiel à marca
(docs/marca/cores-e-fontes.md), nos temas claro e escuro, com contraste WCAG 2.1 AA
garantido por teste automatizado.

CONTEXTO:
- Stack: TanStack Start + React 19 + Tailwind 4; tokens oklch em src/styles.css
  (@theme inline → utilitários bg-*, text-*, border-*); componentes shadcn em src/components/ui.
- Marca: azul-caneta #2340C8 (ações), tinta #121826 (texto), papel #F4F5F2 (fundo),
  marca-texto #F2C230 (destaque pontual), grafite #4A5262 (texto secundário),
  #8099FF (azul no tema escuro).
- Diagnóstico (matiz oklch):
  1. Neutros em duas famílias: texto em 264–266° (azulado) e superfícies/bordas em
     106–128° (amarelo-esverdeado) — o cinza "puxa para o oliva" ao lado do texto azulado.
  2. --accent é o amarelo: todo hover (botões ghost/outline, navegação), a seleção de texto,
     os ícones dos passos e o degradê do topo ficam amarelos. A marca reserva o amarelo
     para destaque pontual; espalhado, ele compete com o azul das ações.
  3. Tema escuro: accent marrom-oliva (oklch 0.318 0.046 94) e bordas branco/12% sem matiz.
  4. Borda do campo de texto ≈1,3:1 sobre o fundo (WCAG 1.4.11 pede 3:1).

INSTRUÇÕES PASSO-A-PASSO:
1. Teste primeiro (src/styles.contraste.test.ts): ler styles.css, converter oklch → sRGB,
   compor alfa sobre o fundo e verificar, nos dois temas:
   - texto ≥ 4,5:1 (texto, texto secundário, botões, hover, citação, erro, links);
   - elementos gráficos ≥ 3:1 (traço do logotipo, anel de foco, borda do campo);
   - harmonia: neutros na família de matiz da tinta (266° ± 8°, croma baixo) e amarelo
     fora do --accent (fica só em --selo, --citacao e --realce).
2. Uma família de neutros: superfícies, bordas e cinzas derivados da tinta/grafite (matiz
   264–266°, croma ≤ 0,035). O papel continua sendo o fundo (croma 0,004 — neutro).
3. Papéis de cor (60-30-10): 60% papel e neutros, 30% tinta (texto), 10% azul-caneta
   (ações, foco, hover, seleção). Amarelo < 2%: só citações de lei e um realce no título.
4. --accent vira um véu de azul (hover/seleção coerentes com o botão primário).
5. Tokens novos para o amarelo, com papel semântico: --citacao, --citacao-foreground,
   --citacao-borda (chips de fonte legal) e --realce (traço de marca-texto no título).
6. Tema escuro com a mesma lógica: superfícies em degraus de luminosidade na matiz da tinta,
   bordas sólidas na mesma matiz, accent azul, citação em amarelo translúcido.
7. Aplicar nos componentes: chips de citação usam --citacao; o degradê do topo usa o véu
   azul; o título ganha o realce de marca-texto em "dispositivo citado".
8. Verificar: testes, tsc, lint, build, prévia nos dois temas e em 375 px.

EXEMPLO DE CÓDIGO:
:root {
  --accent: oklch(0.935 0.032 267);            /* véu de azul-caneta */
  --accent-foreground: oklch(0.37 0.16 267);
  --citacao: oklch(0.955 0.055 93);            /* marca-texto diluído */
  --citacao-foreground: oklch(0.21 0.029 266.1);
  --realce: oklch(0.834 0.158 89 / 0.45);
}
<mark className="bg-[linear-gradient(transparent_60%,var(--color-realce)_60%)]">…</mark>

CRITÉRIOS DE SUCESSO:
- [ ] Teste de contraste e harmonia passa nos dois temas (nenhum par abaixo do mínimo)
- [ ] Nenhum hover, foco ou seleção amarelo; amarelo só em citações e no realce do título
- [ ] Bordas, cartões e cinzas com a mesma matiz da tinta (sem "oliva")
- [ ] Borda do campo de texto ≥ 3:1 (WCAG 1.4.11)
- [ ] Testes existentes sem alteração; tsc, lint e build sem erro
- [ ] Prévia aprovada pelo autor antes do commit

PRINCÍPIOS A SEGUIR:
- Cor tem função: azul = agir; amarelo = "isto é lei citada"; vermelho = falha.
- Neutros com a matiz da marca dão unidade sem aparecer.
- Escuro não é inverso: superfícies sobem em luminosidade, não em saturação.
- Nunca preto/branco puros (tinta e papel já cumprem isso).

STACK RECOMENDADA:
Tailwind 4 (tokens oklch), Vitest (teste de contraste sem dependência nova).
```
