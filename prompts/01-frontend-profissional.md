# Prompt 01 — Frontend profissional (gerado pelo skill frontend-prompt-optimizer)

> Gerado em 15/10/2026 pelo skill `frontend-prompt-optimizer`, a partir do estado real do código, e executado pelo Claude Code. O resultado (o que a IA errou, o que a revisão pegou) está em `docs/HISTORY-IA.md`.

```
OBJETIVO:
Elevar o frontend do "Tira-dúvidas da reforma tributária" (página inicial e simulador) a nível
profissional: identidade visual própria, hierarquia clara, responsivo mobile-first, WCAG 2.1 AA,
modo claro/escuro, estados de carregamento, vazio, recusa e falha, microinterações discretas e
nenhum custo de desempenho desnecessário — sem quebrar os 223 testes existentes.

CONTEXTO:
- Stack: TanStack Start + React 19 + TypeScript estrito + Tailwind CSS 4 (tokens oklch em
  src/styles.css, variante dark por classe .dark) + shadcn/ui (Radix) + lucide-react; gerado e
  sincronizado com o Lovable (main sempre funcionando).
- Páginas: "/" (hoje um bloco centralizado simples) e "/simulador" (componente Simulador: histórico,
  campo "Sua pergunta", botão "Enviar", role=log "Conversa", role=status "Consultando…", fontes como
  links para o Planalto com rel noopener, *negrito* e _itálico_ do WhatsApp).
- Público: avaliador acadêmico (vai julgar domínio técnico) e leigos com dúvida sobre impostos
  (precisam de clareza e confiança).
- Achados no código atual: <html lang="en"> com conteúdo em português (WCAG 3.1.1); página 404 em
  inglês; tokens de modo escuro existem mas não há como ativá-los; nenhuma navegação entre páginas.
- Restrições: sem dependências novas; sem fontes externas (desempenho e privacidade); nenhum número
  ou texto jurídico inventado — só o que vem da base ou de medições registradas e datadas; manter o
  aviso "informativo, não substitui contador ou advogado"; a base e o prompt não podem ir para o
  código do navegador.

INSTRUÇÕES PASSO-A-PASSO:
1. Identidade: paleta "papel e tinta" — fundo papel quente (não #FFF), tinta azul-petróleo como
   primária, âmbar de "selo" para citações; títulos em serifada de sistema (gravidade jurídica),
   corpo em sem serifa de sistema. Redefinir os tokens oklch em :root e .dark (contraste AA).
2. Base de acessibilidade: lang="pt-BR", link "Pular para o conteúdo", foco visível em tudo,
   landmarks (header, nav, main, footer), um h1 por página, 404 em português.
3. Tema: claro/escuro seguindo o sistema na primeira visita, botão para alternar com rótulo
   acessível, preferência guardada, sem "piscar" o tema errado no carregamento (script mínimo no head).
4. Layout comum: cabeçalho com marca, navegação (Início, Simulador, Código) e tema; rodapé com aviso
   e créditos.
5. Página inicial: herói com proposta de valor e chamada principal para o simulador; "Como funciona"
   fiel ao pipeline real (busca → decisão no código → geração com citação conferida); "O que ele
   responde / o que não responde" (do escopo); bloco de transparência com resultados medidos e
   datados do conjunto-ouro, com link para o relatório.
6. Simulador: estado vazio com perguntas de exemplo clicáveis (enviam a pergunta); bolhas distintas
   por autor; recusa e falha com tratamento visual próprio (não alarmista na recusa); indicador de
   digitação animado e acessível; fontes como "selos" de citação com ícone de link externo;
   contador de caracteres ligado ao campo; botão "Nova conversa"; rolagem automática para a última
   mensagem (sem animação se prefers-reduced-motion).
7. Microinterações só com CSS (tw-animate-css já instalado), respeitando prefers-reduced-motion.
8. Testes primeiro para cada comportamento novo (exemplos clicáveis, contador, nova conversa, tema,
   link de pular conteúdo, navegação); os testes existentes do Simulador continuam valendo.

EXEMPLO DE CÓDIGO:
// Tema sem "piscar": script mínimo no head, antes do primeiro paint
const SCRIPT_TEMA = `try{var t=localStorage.getItem("tema");var e=t?t==="escuro":matchMedia("(prefers-color-scheme: dark)").matches;document.documentElement.classList.toggle("dark",e)}catch(_){}`;

// Pergunta de exemplo clicável: botão real (teclado e leitor de tela), não div
<button type="button" onClick={() => enviar(exemplo)} className="... focus-visible:ring-2">{exemplo}</button>

CRITÉRIOS DE SUCESSO:
- [ ] 223 testes existentes + testes novos passando; tsc, lint e build sem erro
- [ ] lang="pt-BR"; um h1 por página; landmarks; link de pular conteúdo funcional
- [ ] Contraste de texto ≥ 4.5:1 nos dois temas (conferido nos tokens)
- [ ] Navegável só com teclado, com foco sempre visível
- [ ] Responsivo de 360 px a desktop, sem rolagem horizontal
- [ ] Tema alterna, persiste e não pisca no carregamento
- [ ] Nenhuma dependência nova; nenhuma fonte externa; base e prompt fora do código do navegador
- [ ] Nenhum número sem fonte: os resultados exibidos têm data e link para o relatório

PRINCÍPIOS A SEGUIR:
- Hierarquia: um elemento principal por tela (herói na inicial; conversa no simulador)
- Espaçamento na escala de 4 px (4, 8, 12, 16, 24, 32, 48, 64); whitespace generoso
- Cores: nunca #000 nem #FFF puros; paleta primária, acento, neutros e semânticas
- Tipografia: no máximo 2 famílias; line-height 1.5 no corpo e 1.2 nos títulos; tracking negativo
  em títulos grandes; escala 12/14/16/20/24/32/48

STACK RECOMENDADA:
- O que já está no projeto: React 19, Tailwind 4, Radix/shadcn, lucide-react, tw-animate-css
- Testes: Vitest + Testing Library (render com roteador em memória para componentes com Link)
```
