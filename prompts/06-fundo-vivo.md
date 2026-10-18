# Prompt 06 — Fundo vivo da página

Executado com o skill `designer-de-interfaces-frontend` a partir do retorno do autor ("na minha imagem não apareceu nenhuma diferença relevante; quero efeito no plano de fundo… que a transforme numa página atrativa e moderna").

```
DIAGNÓSTICO: os efeitos do prompt 05 eram sutis demais para aparecer numa captura; o fundo
continuava chapado.

DIREÇÃO: um fundo em três camadas, atrás de todo o site, nas cores da marca:
1. Manchas de cor (azul-caneta, marca-texto, azul-claro), grandes e desfocadas, derivando
   devagar (26–38 s, alternado).
2. Grade de pontos como papel técnico, esmaecendo para baixo.
3. Holofote que segue o mouse: os pontos acendem em azul e surge um brilho suave.

RESTRIÇÕES:
- Decorativo: aria-hidden, sem cliques (pointer-events: none), atrás do conteúdo.
- "Reduzir movimento": manchas paradas e sem holofote; tela de toque: sem holofote.
- Movimento do mouse aplicado no máximo uma vez por quadro; animação só de transform.
- Sem dependência nova; texto legível nos dois temas; 375 px sem rolagem lateral.

CRITÉRIOS DE SUCESSO:
- [ ] Testes: decorativo; holofote acompanha o cursor; desligado com "reduzir movimento"
      e em toque
- [ ] Diferença visível à primeira vista nos dois temas
- [ ] Prévia aprovada pelo autor antes do commit
```

## Revisão (18/10/2026) — "mais high-tech e mais sutil, para não dificultar a leitura"

- Pontos trocados por **grade técnica de linhas** (blueprint, 48 px), visível só no alto e nas
  bordas — a máscara deixa a área do texto limpa.
- **Varredura**: uma linha de luz fina desce pela grade a cada 9 s, como um scanner.
- Holofote passa a **acender as linhas da grade** perto do cursor, com brilho contido.
- Manchas de cor reduzidas à metade ou menos (só profundidade).

## Revisão 2 (18/10/2026) — "como um ponto que acompanha o mouse"

- O holofote que acendia a grade saiu. No lugar, um **ponto de 6 px com anel fino** (24 px)
  acompanha o cursor com leve atraso (160 ms), acima do conteúdo, sem receber cliques.
- Some quando o mouse sai da janela; não existe em tela de toque nem com "reduzir movimento".

## Revisão 2 (18/10/2026) — "como um ponto que acompanha o mouse"

- O holofote que acendia a grade saiu. No lugar, um ponto de 6 px com anel fino (24 px)
  acompanha o cursor com leve atraso, acima do conteúdo, sem receber cliques; some quando o
  mouse sai da janela; não existe em tela de toque nem com "reduzir movimento".

## Revisão 3 (18/10/2026) — "ficou atrasado; retire"

- O ponto que seguia o mouse saiu: o atraso proposital (160 ms) fazia o ponto parecer
  lento em relação ao cursor. Ficam as manchas, a grade e a varredura.
