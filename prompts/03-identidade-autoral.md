# Prompt 03 — Identidade autoral (tirar a "cara de feito com IA")

Gerado com o skill `frontend-prompt-optimizer` a partir do pedido do autor ("quero que o projeto perca essa cara de algo feito com IA… transições interessantes, efeitos e layout moderno, mas que não seja facilmente identificado que foi feito com IA") e de um diagnóstico do código da página inicial. Executado pelo Claude Code.

```
OBJETIVO:
Redesenhar a página inicial e o layout do Inciso com uma linguagem visual autoral — de "lei
comentada" — que não lembre template gerado por IA, com transições e efeitos que tenham
propósito, sem perder acessibilidade (WCAG 2.1 AA) nem os testes existentes.

CONTEXTO:
- Stack: TanStack Start (React 19, @tanstack/react-router 1.170.41, com defaultViewTransition),
  Tailwind 4 com tokens oklch (src/styles.css), fontes da marca self-hosted.
- Marca Inciso: traço do I + travessão; papel, tinta, azul-caneta, marca-texto, grafite.
- Diagnóstico dos clichês atuais:
  1. hero padrão SaaS (pílula com bolinha, título, parágrafo, 2 botões, card flutuante com sombra);
  2. brilho de gradiente radial no fundo;
  3. "Como funciona" em 4 cards idênticos com ícone em quadradinho e "01/02";
  4. "responde × não responde" em dois cards com ✓ e ✗;
  5. três cards de estatística com número gigante;
  6. mesmo raio, borda e sombra em tudo (kit de componentes, sem hierarquia);
  7. animação genérica de fade/slide.

INSTRUÇÕES PASSO-A-PASSO:
1. Testes primeiro: hook de revelação (visível sem IntersectionObserver e com movimento
   reduzido; anima uma vez só), trecho de lei do topo igual ao texto literal da base,
   "Como funciona" como lista ordenada de 4 incisos, transição de página ligada no roteador.
2. Grade editorial assimétrica (texto + coluna de notas de margem), filetes finos no lugar
   de cards, raio pequeno, sem sombra decorativa.
3. Topo: título à esquerda; à direita, uma "folha" com o trecho literal da EC 132 (ADCT,
   art. 129) e nota de margem com a pergunta que ele responde. O marca-texto passa sobre o
   trecho quando ele entra na tela.
4. "Como funciona" como incisos (I – a IV), numerais em mono, sem ícones.
5. "Responde" com marca-texto ao passar o mouse; "Não responde" riscado como redação
   revogada do Planalto (efeito visual; o título da seção dá o sentido ao leitor de tela).
6. Números dentro de uma frase editorial, em mono, separados por filetes.
7. Movimento: marca-texto (background-size), filetes que se desenham (scaleX), incisos em
   sequência curta (60 ms), transição entre páginas (View Transitions), sublinhado que
   cresce nos links. Tudo desligado em prefers-reduced-motion; conteúdo nunca depende de JS.
8. Verificar: testes, contraste, 375 px sem rolagem lateral, tema escuro, teclado.

CRITÉRIOS DE SUCESSO:
- [ ] Nenhum dos 7 clichês do diagnóstico continua na página inicial
- [ ] Sem IntersectionObserver ou com movimento reduzido, todo o conteúdo aparece
- [ ] Trecho de lei do topo é literal da base (teste)
- [ ] Testes existentes sem alteração; tsc, lint e build sem erro
- [ ] Sem dependência nova; sem rolagem lateral em 375 px; foco visível
- [ ] Prévia aprovada pelo autor antes do commit

PRINCÍPIOS A SEGUIR:
- A forma vem do assunto (lei anotada), não de um kit de componentes.
- Movimento explica algo (marcar, citar, ligar) ou não existe.
- Hierarquia por tipografia e espaço, não por caixas e sombras.
- Assimetria intencional; uma ideia principal por seção.

STACK RECOMENDADA:
CSS (transições e @keyframes) + IntersectionObserver num hook próprio; View Transitions pelo
roteador; nenhuma biblioteca de animação nova.
```
