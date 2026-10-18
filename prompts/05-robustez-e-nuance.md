# Prompt 05 — Robustez, nuance e transições na página inicial

Executado com o skill `designer-de-interfaces-frontend` a partir do pedido do autor ("quero um frontend profissional que possa impressionar pela robustez, pela qualidade das nuances e pelos efeitos de transição"). Continua o prompt 04, só na página inicial, mantendo a linguagem "lei comentada".

```
EFEITOS (cada um com função):
1. Faixa em movimento com dispositivos que existem na base, como a margem de um Diário
   Oficial; para ao passar o mouse; bordas esmaecidas.
2. Linha de progresso no "Como funciona", guiada pela rolagem (animation-timeline: view());
   onde não há suporte, não aparece.
3. Títulos de seção revelados como tinta (clip-path da esquerda para a direita).
4. Números do Art. 4º contando até o valor; o leitor de tela recebe sempre o valor final.
5. Cabeçalho com contorno e profundidade quando a página rola.
6. Incisos: marcador que desliza e marca-texto no título ao passar o mouse.

RESTRIÇÕES:
- Nenhum efeito esconde ou inventa conteúdo: sem JavaScript ou com "reduzir movimento",
  tudo aparece no estado final; a faixa só mostra dispositivos da base (teste).
- Sem dependência nova; contraste AA; teclado; 375 px sem rolagem lateral.

CRITÉRIOS DE SUCESSO:
- [ ] Faixa conferida contra a base (teste)
- [ ] Valores finais dos números disponíveis para leitor de tela (teste)
- [ ] Cabeçalho marca a rolagem (teste)
- [ ] Testes existentes sem alteração; tsc, lint e build sem erro
- [ ] Prévia aprovada pelo autor antes do commit
```
